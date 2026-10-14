import {createHash} from 'node:crypto';
import {geminiEnv,geminiGenerate} from './_gemini.mjs';

export const DESIGN_STYLE_IDS=['modern','minimal','contemporary','classic','neo','indochine','mediterranean','scandi','japandi','japanese','tropical','artdeco','french','spanish','tuscan','craftsman','tudor','barn','midcentury','industrial','brutalist','coastal','vietnamese','balinese'];
const number=(v,max,integer=false)=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=max&&(!integer||Number.isInteger(v))?v:null;
const style=v=>DESIGN_STYLE_IDS.includes(v)?v:null;
const list=v=>Array.isArray(v)?v:[];
const text=(v,max=400)=>typeof v==='string'?v.replace(/[\u0000-\u001f]/g,' ').replace(/https?:\/\/\S+/gi,'[liên kết chưa xác minh]').trim().slice(0,max):'';

// No project, prompt, file contents/names, finance or household object crosses this boundary.
export function designResearchContext(input={}){
  const c=input&&typeof input==='object'?input:{},s=c.site||{},b=c.budget||{},r=c.references||{},a=r.analysis||{};
  const out={
    houseType:['new','shell'].includes(c.houseType)?c.houseType:'unconfirmed',styleId:style(c.styleId),
    site:{widthM:number(s.widthM,200),depthM:number(s.depthM,500),floors:number(s.floors,20,true),dimensionsStatus:s.dimensionsStatus==='customer_confirmed'?'customer_confirmed':'unconfirmed'},
    budget:{targetMinVnd:number(b.targetMinVnd,1e12),targetMaxVnd:number(b.targetMaxVnd,1e12),status:b.status==='customer_target'?'customer_target':'unconfirmed'},
    floorProgram:list(c.floorProgram).slice(0,20).map((f,i)=>({floor:i,bedrooms:number(f?.bedrooms,20,true),bathrooms:number(f?.bathrooms,20,true),living:f?.living===true,kitchen:f?.kitchen===true,office:f?.office===true,garage:f?.garage===true,worship:['none','room','living'].includes(f?.worship)?f.worship:'unconfirmed',extraRooms:list(f?.extraRooms).slice(0,20).map(q=>({type:['laundry','storage','office','gym','hobby','custom'].includes(q?.type)?q.type:'custom',count:number(q?.count,20,true),minAreaM2:number(q?.minAreaM2,200)}))})),
    references:{imageCount:number(r.imageCount,6,true)||0,videoCount:number(r.videoCount,6,true)||0,pdfCount:number(r.pdfCount,6,true)||0,analysis:{available:a.available===true,status:'unconfirmed',styleId:style(a.styleId),estimatedFloors:number(a.estimatedFloors,20,true)}}
  };
  if(!out.site.widthM)out.site.widthM=null;if(!out.site.depthM)out.site.depthM=null;if(!out.site.floors)out.site.floors=null;
  if(!out.budget.targetMinVnd||!out.budget.targetMaxVnd||out.budget.targetMinVnd>out.budget.targetMaxVnd)out.budget={targetMinVnd:null,targetMaxVnd:null,status:'unconfirmed'};
  out.missing=[];
  if(out.houseType==='unconfirmed')out.missing.push('house_type');
  if(!out.styleId)out.missing.push('style');
  if(out.site.dimensionsStatus!=='customer_confirmed'||!out.site.widthM||!out.site.depthM)out.missing.push('measured_dimensions');
  if(!out.site.floors)out.missing.push('floors');
  if(!out.floorProgram.length||out.floorProgram.length!==out.site.floors||out.floorProgram.some(f=>f.bedrooms===null||f.bathrooms===null||f.worship==='unconfirmed'||f.extraRooms.some(q=>q.count===null||q.minAreaM2===null)))out.missing.push('floor_program');
  if(out.budget.status!=='customer_target')out.missing.push('target_budget');
  if(out.references.analysis.available)out.missing.push('file_analysis_verification');
  return out;
}

export function publicDesignSourceUrl(value){
  try{
    if(typeof value!=='string'||value.length>1800)return '';
    const u=new URL(value);
    if(u.protocol!=='https:'||u.username||u.password||u.port&&u.port!=='443'||! /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(u.hostname)||/\.(local|internal|invalid|test)$/i.test(u.hostname))return '';
    if([...u.searchParams.keys()].some(k=>/^(?:key|api_?key|token|password|secret|credential)$/i.test(k)))return '';
    return u.href;
  }catch{return '';}
}

const LIMITATIONS=[
  'Mẫu chỉ là ý định thiết kế; số đo, kết cấu và mức giá cần kiểm tra riêng.',
  'Ngày tìm là thời điểm Search, không phải ngày xuất bản. Ngân sách mục tiêu không chứng minh giá xây dựng.',
  'Google Search không cấp quyền tải, sử dụng thương mại hoặc bán ảnh; chỉ mở liên kết nguồn.'
];
export function designFitReasons(c){
  return [c.houseType==='shell'?'Tham khảo hoàn thiện trên nhà thô; cần giữ và đo lại hiện trạng.':c.houseType==='new'?'Tham khảo hướng kiến trúc cho nhà mới.':'Loại nhà cần được xác nhận.',c.styleId?'Nghiên cứu theo phong cách đã chọn: '+c.styleId+'.':'Chưa xác nhận phong cách.',c.site.widthM&&c.site.depthM?'Đối chiếu khung '+c.site.widthM+' × '+c.site.depthM+' m theo hồ sơ; không đo từ ảnh.':'Chưa đủ số đo đối chiếu.',c.site.floors?c.site.floors+' tầng theo hồ sơ; công năng từng tầng phải kiểm tra trên mặt bằng.':'Chưa rõ số tầng.',c.budget.targetMaxVnd?'Khoảng ngân sách mục tiêu dùng để sàng lọc; chưa có báo giá cho mẫu.':'Cần xác nhận ngân sách mục tiêu.'];
}

// Supports bind each complete claim to provider evidence. Model-written URLs/indices are ignored.
export function normalizeDesignResearch(response,context,searchedAt){
  const raw=response?.raw||{},candidate=raw.candidates?.[0]||{},metadata=candidate.groundingMetadata||raw.grounding_metadata||raw.groundingMetadata||{};
  const outputText=typeof response.result==='string'?response.result:'';
  const sources=[],byUrl=new Map(),supports=[];
  const addSource=(url,title)=>{
    url=publicDesignSourceUrl(url);if(!url)return null;
    if(byUrl.has(url))return byUrl.get(url);
    if(sources.length>=18)return null;
    const s={id:'source-'+(sources.length+1),url,title:text(title,180)||'Nguồn web'};sources.push(s);byUrl.set(url,s.id);return s.id;
  };
  const chunkIds=list(metadata.groundingChunks||metadata.grounding_chunks).map(c=>addSource(c?.web?.uri,c?.web?.title));
  const segmentText=(s,t=outputText)=>{
    if(typeof s?.text==='string')return s.text;
    const start=s?.startIndex??s?.start_index,end=s?.endIndex??s?.end_index;
    return Number.isInteger(start)&&Number.isInteger(end)&&start>=0&&end>start&&end<=t.length?t.slice(start,end):'';
  };
  for(const support of list(metadata.groundingSupports||metadata.grounding_supports)){
    const ids=list(support.groundingChunkIndices||support.grounding_chunk_indices).filter(Number.isInteger).map(i=>chunkIds[i]).filter(Boolean);
    const segment=segmentText(support.segment);if(segment&&ids.length)supports.push({segment,ids});
  }
  // Interactions annotations are read only from provider text outputs, never from generated JSON.
  for(const out of [...list(raw.outputs),...list(raw.steps).filter(s=>s?.type==='model_output').flatMap(s=>list(s.content))])if(out?.type==='text'){
    for(const citation of list(out.annotations||out.citations))if(['url_citation','urlCitation'].includes(citation?.type)){
      const id=addSource(citation.url,citation.title),segment=segmentText(citation,out.text||outputText);
      if(id&&segment)supports.push({segment,ids:[id]});
    }
  }
  let parsed={};try{parsed=JSON.parse(outputText.replace(/^\s*```(?:json)?\s*/i,'').replace(/\s*```\s*$/,''));}catch{}
  const options=list(parsed.options).slice(0,6).filter(o=>o&&typeof o==='object').map((o,i)=>({
    id:'research-'+i,title:text(o.title,120)||'Định hướng tham khảo '+(i+1),styleId:context.styleId,
    claims:list(o.claims).slice(0,4).filter(c=>typeof c==='string'&&c.trim()&&c.length<=600).map(claim=>{
      const encoded=JSON.stringify(claim).slice(1,-1),ids=[...new Set(supports.filter(s=>s.segment.includes(claim)||s.segment.includes(encoded)).flatMap(s=>s.ids))];
      return {text:text(claim,600),sourceIds:ids,verified:ids.length>0};
    }),
    fitReasons:designFitReasons(context),missingCriteria:context.missing,
    limitations:[...LIMITATIONS,...list(o.limitations).slice(0,2).map(v=>text(v)).filter(Boolean)]
  }));
  const grounded=options.some(o=>o.claims.some(c=>c.verified));
  return {status:grounded?'ready':'unverified',notice:grounded?'Nguồn chỉ xác minh các kết luận được gắn bằng chứng; độ phù hợp là đối chiếu sơ bộ theo hồ sơ.':'Chưa có nguồn xác minh cho các kết luận. Thư viện BMH vẫn chọn được.',searchedAt,model:text(response?.model,120),sources,options,missingCriteria:context.missing,limitations:LIMITATIONS,allowLibrary:true};
}

export function designResearchPolicy(env=geminiEnv(),settings=process.env){
  if(!env.key)return 'missing_configuration';
  if(settings.GEMINI_DESIGN_RESEARCH_ENABLED!=='true'||settings.GEMINI_SEARCH_ENABLED!=='true')return 'search_not_allowed';
  // An operator's quota permission is independent of model discovery. A provider rejection stops calls.
  if(settings.GEMINI_DESIGN_RESEARCH_QUOTA!=='allowed')return 'quota_not_allowed';
  if(!/^gemini-[a-z0-9.-]+$/.test(env.primary)||/image|audio|tts|embedding|live|deep-research/.test(env.primary))return 'model_not_allowed';
  return '';
}

export function createDesignResearchRunner({generate=geminiGenerate,getEnv=geminiEnv,getSettings=()=>process.env,now=Date.now,timeoutMs=25000}={}){
  const cache=new Map(),buckets=new Map(),blocked=new Map(),windowMs=10*60*1000,ttl=15*60*1000;
  const fallback=(status,context)=>({status,notice:status==='quota'||status==='quota_not_allowed'?'Search chưa được phép trong hạn mức hoặc đã chạm quota. Tiếp tục chọn thư viện BMH.':status==='denied'?'Search bị từ chối quyền. Tiếp tục chọn thư viện BMH.':'Nghiên cứu chưa sẵn sàng; tiếp tục chọn thư viện BMH.',searchedAt:null,sources:[],options:[],missingCriteria:context.missing,limitations:LIMITATIONS,allowLibrary:true});
  return async(input,{scope='public'}={})=>{
    const context=designResearchContext(input),env=getEnv(),policy=designResearchPolicy(env,getSettings()),at=now();
    if(policy)return fallback(policy,context);
    const account=createHash('sha256').update(env.key+'|'+env.primary).digest('hex'),caller=account+'|'+String(scope).slice(0,160);
    if(blocked.get(account)>at||blocked.get(caller)>at)return fallback('quota_or_permission_blocked',context);
    const key=createHash('sha256').update(caller+'|'+JSON.stringify(context)).digest('hex');
    for(const [k,row] of cache)if(!row.pending&&row.until<=at)cache.delete(k);
    const prior=cache.get(key);if(prior)return prior.promise;
    for(const [k,row] of buckets)if(at-row.start>=windowMs)buckets.delete(k);
    for(const [k,until] of blocked)if(until<=at)blocked.delete(k);
    for(const [id,max] of [[account,6],[account+'|'+String(scope).slice(0,160),3]]){
      const row=buckets.get(id)||{start:at,count:0};if(row.count>=max)return fallback('call_limit',context);
    }
    if(cache.size>=80||buckets.size>=160)return fallback('call_limit',context);
    for(const id of [account,account+'|'+String(scope).slice(0,160)]){const row=buckets.get(id)||{start:at,count:0};row.count++;buckets.set(id,row);}
    const row={pending:true,until:at+ttl,promise:null};
    row.promise=(async()=>{
      try{
        const response=await generate({parts:[{text:'Tìm 3–6 mẫu nhà hoặc hướng thiết kế trên Google phù hợp hồ sơ thiết kế dưới đây. Trả JSON {"options":[{"title":"Tên hướng thiết kế","claims":["Kết luận ngắn từ nguồn"],"limitations":["Điều chưa kiểm chứng"]}]}. Không viết URL hoặc tự gắn chỉ số nguồn. Mỗi claim là một câu đầy đủ để Search gắn bằng chứng. Không suy số đo từ ảnh, không xác nhận dữ kiện chưa xác minh, không khẳng định giá xây dựng. Hồ sơ cho phép: '+JSON.stringify(context)}],systemInstruction:'Bạn nghiên cứu tham chiếu thiết kế BMH bằng Google Search. Tiếng Việt. Chỉ dùng dữ kiện được cho phép. Tệp chỉ có số lượng và phân tích sơ bộ; không có nội dung cá nhân. Giữ công năng từng tầng và ngân sách như tiêu chí, không áp dụng thay đổi.',tools:[{type:'google_search'}],configuredOnly:true,timeoutMs:Math.min(25000,Math.max(1000,timeoutMs)),maxOutputTokens:2400,thinkingLevel:'low'});
        return normalizeDesignResearch(response,context,new Date(now()).toISOString());
      }catch(err){
        const code=Number(err?.statusCode),status=code===429?'quota':[401,403].includes(code)?'denied':code===504?'timeout':'unavailable';
        if(status==='quota'||status==='denied')blocked.set(String(err?.code||'').startsWith('AI_')?caller:account,now()+ttl);
        row.until=now()+60000;
        return fallback(status,context);
      }finally{row.pending=false;}
    })();
    cache.set(key,row);return row.promise;
  };
}
export const runDesignResearch=createDesignResearchRunner();
