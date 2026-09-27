import {send,jsonBody,apiError} from '../server/_lib.mjs';
import {geminiGenerate,geminiEnv,geminiRateLimit} from '../server/_gemini.mjs';

const BANK_RATE_SCHEMA={
  type:'object',additionalProperties:false,
  properties:{
    verified:{type:'boolean'},
    bank_name:{type:'string'},
    product:{type:'string'},
    intro_rate_pct:{type:'number'},
    intro_months:{type:'integer',minimum:0,maximum:120},
    post_rate_pct:{type:'number'},
    source_date:{type:'string'},
    as_of:{type:'string'},
    rate_kind:{type:'string',enum:['home_loan','construction_loan','repair_loan','mixed_home_loan','unknown']},
    note:{type:'string'}
  },
  required:['verified','bank_name','product','intro_rate_pct','intro_months','post_rate_pct','source_date','as_of','rate_kind','note']
};

const CACHE_TTL=6*60*60*1000;
const cache=globalThis.__BMH_BANK_RATE_CACHE__||(globalThis.__BMH_BANK_RATE_CACHE__=new Map());

function safe(v,n=180){return String(v||'').replace(/[\u0000-\u001f]/g,' ').trim().slice(0,n);}
function saneRate(n){n=Number(n)||0;return n>=0&&n<=30?n:0;}
export function verifyRateEvidence(result,citations,bank,now=new Date()){
  const links=(Array.isArray(citations)?citations:[]).filter(x=>{try{return new URL(x?.url).protocol==='https:';}catch{return false;}});
  const date=String(result?.source_date||''),published=/^\d{4}-\d{2}-\d{2}$/.test(date)?Date.parse(date+'T00:00:00Z'):NaN;
  const age=now.getTime()-published,dated=Number.isFinite(published)&&age>=0&&age<=180*24*60*60*1000;
  const norm=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
  const claimed=norm(result?.bank_name),names=[norm(bank?.name),norm(bank?.fullName)].filter(x=>x.length>=3);
  const matchingBank=names.some(x=>claimed.includes(x)||x.includes(claimed)&&claimed.length>=5);
  const matchingSource=links.some(x=>names.some(name=>norm(x.title+' '+new URL(x.url).hostname).includes(name)));
  return result?.verified===true&&matchingSource&&dated&&matchingBank&&safe(result?.product).length>0
    &&['home_loan','construction_loan','repair_loan','mixed_home_loan'].includes(result?.rate_kind)
    &&saneRate(result?.intro_rate_pct)>0&&saneRate(result?.post_rate_pct)>0;
}

export default async function handler(req,res){
  try{
    if(req.method==='OPTIONS')return send(res,200,{ok:true});
    if(req.method!=='POST')return send(res,405,{ok:false,error:'Method not allowed'});
    if(!geminiEnv().key)return send(res,503,{ok:false,error:'Gemini chưa được cấu hình trên server.'});
    geminiRateLimit(req,{bucket:'bank-rate',max:24,windowMs:60*60*1000});

    const body=await jsonBody(req),bank={
      id:safe(body.bank_id,24),name:safe(body.bank_name,100),fullName:safe(body.full_name,180),swift:safe(body.swift,32)
    };
    if(!bank.id||!bank.name)return send(res,400,{ok:false,error:'Thiếu thông tin ngân hàng.'});

    const key=bank.id.toUpperCase(),now=Date.now(),cached=cache.get(key),force=body.force===true;
    if(!force&&cached&&now-cached.at<CACHE_TTL)return send(res,200,{ok:true,cached:true,...cached.payload});

    const today=new Date().toISOString().slice(0,10);
    const prompt=[
      'Hãy dùng Google Search để kiểm tra lãi suất vay mua nhà, xây nhà hoặc sửa nhà dành cho khách hàng cá nhân tại Việt Nam của ngân hàng sau:',
      `Tên ngắn: ${bank.name}`,
      `Tên đầy đủ: ${bank.fullName||bank.name}`,
      bank.swift?`SWIFT: ${bank.swift}`:'',
      `Ngày kiểm tra: ${today}`,
      '',
      'QUY TẮC BẮT BUỘC:',
      '1. Ưu tiên website chính thức của chính ngân hàng và trang sản phẩm vay nhà/xây sửa nhà.',
      '2. Không dùng lãi suất tiền gửi. Không nhầm với vay kinh doanh, thẻ tín dụng hoặc vay tín chấp.',
      '3. Nếu chỉ thấy mức "từ X%" thì được ghi X là lãi ưu đãi nhưng phải nói rõ trong note.',
      '4. Lãi sau ưu đãi chỉ điền khi nguồn công khai nêu rõ hoặc có công thức/mức tham chiếu đủ cụ thể. Nếu không có, trả 0 và giải thích.',
      '5. source_date là ngày công bố/cập nhật của nguồn nếu nhìn thấy, định dạng YYYY-MM-DD; nếu nguồn không ghi ngày thì để chuỗi rỗng.',
      '6. as_of là ngày hôm nay.',
      '7. verified=true chỉ khi tìm được nguồn công khai gọi rõ tên ngân hàng, có ngày cập nhật, sản phẩm vay nhà/xây/sửa nhà và cả lãi ưu đãi lẫn lãi sau ưu đãi. Nếu không đủ bằng chứng, verified=false và các số không chắc chắn phải là 0.',
      '8. Không bịa số liệu, không suy đoán từ ngân hàng khác.'
    ].filter(Boolean).join('\n');

    const {result,model,apiVersion,citations}=await geminiGenerate({
      parts:[{text:prompt}],
      systemInstruction:'Bạn là bộ thu thập dữ liệu lãi suất cho Build My Home. Chỉ trả dữ liệu có bằng chứng web. Ưu tiên nguồn chính thức của ngân hàng. Không bịa hoặc nội suy lãi suất.',
      schema:BANK_RATE_SCHEMA,
      maxOutputTokens:1800,
      thinkingLevel:'medium',
      timeoutMs:80000,
      tools:[{type:'google_search'}]
    });

    result.intro_rate_pct=saneRate(result.intro_rate_pct);
    result.post_rate_pct=saneRate(result.post_rate_pct);
    result.intro_months=Math.max(0,Math.min(120,Number(result.intro_months)||0));
    const validCitations=(citations||[]).filter(x=>{try{return new URL(x?.url).protocol==='https:';}catch{return false;}}).slice(0,8);
    result.verified=verifyRateEvidence(result,validCitations,bank);
    if(!result.verified){result.intro_rate_pct=0;result.post_rate_pct=0;result.intro_months=0;result.note=safe(result.note||'Thiếu nguồn có ngày cập nhật và đủ hai mức lãi suất cho đúng sản phẩm vay; vui lòng hỏi ngân hàng.',400);}

    const payload={
      provider:'gemini',model,apiVersion,grounded:true,
      fetched_at:new Date().toISOString(),
      result,
      citations:validCitations
    };
    cache.set(key,{at:now,payload});
    return send(res,200,{ok:true,cached:false,...payload});
  }catch(err){apiError(res,err);}
}
