import {send,jsonBody,apiError} from '../server/_lib.mjs';
import {geminiGenerate,geminiEnv} from '../server/_gemini.mjs';

const OPENAI_MODEL=String(process.env.OPENAI_MODEL||'gpt-5.6-terra').trim();
const OPENAI_URL='https://api.openai.com/v1/responses';
const AI_WINDOW_MS=10*60*1000,AI_MAX_PER_WINDOW=16;
const aiBuckets=globalThis.__BMH_AI_BUCKETS__||(globalThis.__BMH_AI_BUCKETS__=new Map());
function rateLimit(req){
  const ip=String(req.headers?.['x-forwarded-for']||req.headers?.['x-real-ip']||'unknown').split(',')[0].trim();
  const now=Date.now(),row=aiBuckets.get(ip);
  if(!row||now-row.start>AI_WINDOW_MS){aiBuckets.set(ip,{start:now,count:1});return;}
  row.count+=1;if(row.count>AI_MAX_PER_WINDOW)throw Object.assign(new Error('AI đang nhận quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.'),{statusCode:429});
  if(aiBuckets.size>500)for(const [k,v] of aiBuckets)if(now-v.start>AI_WINDOW_MS)aiBuckets.delete(k);
}


const FENG_SCHEMA={
  type:'object',additionalProperties:false,
  properties:{
    headline:{type:'string'},summary:{type:'string'},confidence:{type:'integer',minimum:0,maximum:100},
    family:{type:'array',maxItems:12,items:{type:'object',additionalProperties:false,properties:{role:{type:'string'},birth:{type:'integer'},kua:{type:'integer'},group:{type:'string'},good_directions:{type:'array',items:{type:'string'},maxItems:4},notes:{type:'array',items:{type:'string'},maxItems:5}},required:['role','birth','kua','group','good_directions','notes']}},
    home_recommendations:{type:'array',maxItems:10,items:{type:'object',additionalProperties:false,properties:{area:{type:'string'},recommendation:{type:'string'},rationale:{type:'string'},priority:{type:'string',enum:['low','medium','high']}},required:['area','recommendation','rationale','priority']}},
    conflicts:{type:'array',maxItems:8,items:{type:'string'}},
    caveats:{type:'array',maxItems:8,items:{type:'string'}}
  },required:['headline','summary','confidence','family','home_recommendations','conflicts','caveats']
};

const RESULT_SCHEMA={
  type:'object',additionalProperties:false,
  properties:{
    headline:{type:'string'},summary:{type:'string'},confidence:{type:'integer',minimum:0,maximum:100},
    brief:{type:'object',additionalProperties:false,properties:{
      budget_vnd:{type:'number'},province:{type:'string'},floors:{type:'integer'},style:{type:'string'},bedrooms:{type:'integer'},priorities:{type:'array',items:{type:'string'},maxItems:8}
    },required:['budget_vnd','province','floors','style','bedrooms','priorities']},
    metrics:{type:'object',additionalProperties:false,properties:{
      current_cost_vnd:{type:'number'},target_saving_vnd:{type:'number'},comfort_risk:{type:'string'},safety_note:{type:'string'}
    },required:['current_cost_vnd','target_saving_vnd','comfort_risk','safety_note']},
    findings:{type:'array',maxItems:8,items:{type:'object',additionalProperties:false,properties:{category:{type:'string'},severity:{type:'string',enum:['low','medium','high']},title:{type:'string'},detail:{type:'string'}},required:['category','severity','title','detail']}},
    recommendations:{type:'array',maxItems:8,items:{type:'object',additionalProperties:false,properties:{title:{type:'string'},detail:{type:'string'},benefit:{type:'string'},estimated_saving_vnd:{type:'number'},step:{type:'integer',minimum:1,maximum:10},safe_to_apply:{type:'boolean'}},required:['title','detail','benefit','estimated_saving_vnd','step','safe_to_apply']}},
    questions:{type:'array',maxItems:5,items:{type:'string'}}
  },required:['headline','summary','confidence','brief','metrics','findings','recommendations','questions']
};

function cleanProject(p={}){return {
  name:String(p.name||'').slice(0,120),style:String(p.style||'').slice(0,80),
  site:p.site&&typeof p.site==='object'?{province:String(p.site.province||'').slice(0,80),district:String(p.site.district||'').slice(0,120),frontDirection:String(p.site.frontDirection||'').slice(0,24),width:Number(p.site.width)||0,depth:Number(p.site.depth)||0,floors:Number(p.site.floors)||0,road:Number(p.site.road)||0,soil:String(p.site.soil||'').slice(0,120),shape:String(p.site.shape||'').slice(0,80),targetCoverage:Number(p.site.targetCoverage)||0}:null,
  finance:p.finance&&typeof p.finance==='object'?{cash:Number(p.finance.cash)||0,income:Number(p.finance.income)||0,living:Number(p.finance.living)||0,reserve:Number(p.finance.reserve)||0,existingDebt:Number(p.finance.existingDebt)||0,loan:Number(p.finance.loan)||0,years:Number(p.finance.years)||0,introRate:Number(p.finance.introRate)||0,postRate:Number(p.finance.postRate)||0}:null,
  household:p.household&&typeof p.household==='object'?{ownerBirth:Number(p.household.ownerBirth)||0,partnerEnabled:p.household.partnerEnabled!==false,partnerBirth:Number(p.household.partnerBirth)||0,children:Array.isArray(p.household.children)?p.household.children.slice(0,8).map(x=>({birth:Number(x.birth)||0,room:String(x.room||'').slice(0,40)})):[],relatives:Array.isArray(p.household.relatives)?p.household.relatives.slice(0,8).map(x=>({birth:Number(x.birth)||0,mobility:String(x.mobility||'').slice(0,60)})):[]}:null,
  plan:p.plan&&typeof p.plan==='object'?{rooms:Array.isArray(p.plan.rooms)?p.plan.rooms.slice(0,40).map(r=>({floor:Number(r.floor)||0,name:String(r.name||'').slice(0,80),type:String(r.type||'').slice(0,30),x:Number(r.x)||0,y:Number(r.y)||0,w:Number(r.w)||0,h:Number(r.h)||0})):[],openings:Array.isArray(p.plan.openings)?p.plan.openings.slice(0,80).map(o=>({floor:Number(o.floor)||0,kind:String(o.kind||'').slice(0,30),side:String(o.side||'').slice(0,20),width:Number(o.width)||0})):[]}:null,
  materials:p.materials&&typeof p.materials==='object'?{tier:String(p.materials.tier||''),climatePackage:String(p.materials.climatePackage||''),choices:p.materials.choices||{}}:null,
  performance:p.performance&&typeof p.performance==='object'?p.performance:null,computed:p.computed&&typeof p.computed==='object'?p.computed:null
};}

function actionInstruction(action){
  const common='Ưu tiên sự hữu ích cho chủ nhà Việt Nam. Không bịa số liệu chưa có. Dữ liệu computed do engine cung cấp là nguồn sự thật cho chi phí và điểm số. Tuyệt đối không khuyên cắt giảm thép, bê tông, móng, chống thấm, bảo vệ điện, PCCC hay hạng mục an toàn chỉ để tiết kiệm. Mọi kết luận về kết cấu, pháp lý, MEP và khả năng thi công phải ghi là cần KTS/kỹ sư/đơn vị có chuyên môn xác nhận.';
  const map={
    brief:'Đọc mô tả tự nhiên, trích xuất brief xây nhà, nhu cầu gia đình, ngân sách, số tầng/phòng và ưu tiên. Chỉ hỏi lại dữ liệu thực sự thiếu.',
    review:'Đánh giá phương án hiện tại theo công năng, lưu thông, ánh sáng, thông gió, người già/trẻ em, khí hậu, chi phí và khả năng trao đổi với KTS. Chỉ ra vấn đề cụ thể.',
    cost:'Tìm cơ hội tiết kiệm mà vẫn giữ tiện nghi và an toàn. Ưu tiên giảm diện tích lãng phí, chuẩn hóa cửa/kích thước, gom khu ướt, lựa chọn hoàn thiện, thiết bị và vận hành.',
    whatif:'Phân tích thay đổi giả định và tác động lên chi phí, công năng, tiện nghi, khí hậu và rủi ro; nêu giả định nào cần engine/KTS kiểm tra.',
    vision:'Phân tích ảnh nhà mẫu hoặc bản vẽ tham khảo; nhận diện phong cách, vật liệu, tổ chức không gian và điều cần xác minh; không bịa kích thước khi ảnh không có tỷ lệ.',
    fengshui:'Nghiên cứu phong thủy nhà ở theo thông tin từng thành viên và khu đất. Dùng Google Search để tổng hợp nhiều nguồn công khai, ưu tiên nguồn giải thích phương pháp Bát trạch/Cung phi rõ ràng. Phân biệt điều có tính truyền thống, điều còn tranh luận và điều chỉ nên xem như tham khảo. Không bịa sách, tác giả hay quy tắc. Không dùng phong thủy để thay thế quy chuẩn an toàn, kết cấu, ánh sáng, thông gió, sức khỏe hay pháp lý.'
  };
  return `${map[action]||map.review} ${common}`;
}

function extractOpenAIText(data){if(typeof data?.output_text==='string'&&data.output_text.trim())return data.output_text;for(const item of data?.output||[])for(const c of item?.content||[])if(c?.type==='output_text'&&typeof c.text==='string')return c.text;return '';}

async function openAIFallback({action,prompt,project,image}){
  const key=String(process.env.OPENAI_API_KEY||'').trim();if(!key)throw Object.assign(new Error('Chưa cấu hình GEMINI_API_KEY hoặc OPENAI_API_KEY.'),{statusCode:503});
  const userText=`Yêu cầu: ${prompt||'(không có câu hỏi bổ sung)'}\n\nDữ liệu dự án JSON:\n${JSON.stringify(project)}`;
  const content=[{type:'input_text',text:userText}];if(action==='vision'&&/^data:image\/(png|jpe?g|webp);base64,/i.test(image)&&image.length<12_000_000)content.push({type:'input_image',image_url:image,detail:'auto'});
  const payload={model:OPENAI_MODEL,store:false,max_output_tokens:1800,input:[{role:'system',content:[{type:'input_text',text:`Bạn là Build My Home AI Decision Engine. ${actionInstruction(action)} Trả lời tiếng Việt rõ ràng, có hành động cụ thể.`}]},{role:'user',content}],text:{format:{type:'json_schema',name:'build_my_home_ai_result',strict:true,schema:RESULT_SCHEMA}}};
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),50000);let r,data;try{r=await fetch(OPENAI_URL,{method:'POST',signal:ctl.signal,headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},body:JSON.stringify(payload)});data=await r.json();}finally{clearTimeout(timer);}
  if(!r.ok)throw Object.assign(new Error(data?.error?.message||`OpenAI HTTP ${r.status}`),{statusCode:r.status>=400&&r.status<500?r.status:502});
  const raw=extractOpenAIText(data);let result;try{result=JSON.parse(raw);}catch{throw Object.assign(new Error('OpenAI trả về dữ liệu không đúng JSON schema.'),{statusCode:502});}
  return {result,model:OPENAI_MODEL,provider:'openai',usage:data?.usage||null};
}

export default async function handler(req,res){
  try{
    if(req.method==='OPTIONS')return send(res,200,{ok:true});if(req.method!=='POST')return send(res,405,{ok:false,error:'Method not allowed'});rateLimit(req);
    const body=await jsonBody(req),action=String(body.action||'review').toLowerCase();if(!['brief','review','cost','whatif','vision','fengshui'].includes(action))return send(res,400,{ok:false,error:'AI action không hợp lệ.'});
    const prompt=String(body.prompt||'').trim().slice(0,6000),project=cleanProject(body.project||{}),image=String(body.image_data_url||'');
    if(geminiEnv().key){
      const parts=[];if(action==='vision'&&/^data:image\/(png|jpe?g|webp);base64,/i.test(image)&&image.length<12_000_000){const m=image.match(/^data:([^;]+);base64,(.+)$/i);if(m)parts.push({inline_data:{mime_type:m[1],data:m[2]}});}
      parts.push({text:`Yêu cầu: ${prompt||'(không có câu hỏi bổ sung)'}\n\nDữ liệu dự án JSON:\n${JSON.stringify(project)}`});
      const grounded=action==='fengshui';
      const {result,model,apiVersion,usage,citations}=await geminiGenerate({
        parts,
        systemInstruction:`Bạn là Build My Home AI Decision Engine. ${actionInstruction(action)} Trả lời tiếng Việt rõ ràng, ngắn gọn, có hành động cụ thể.`,
        schema:grounded?FENG_SCHEMA:RESULT_SCHEMA,
        maxOutputTokens:grounded?3200:2200,
        thinkingLevel:grounded?'medium':(action==='review'||action==='cost'?'medium':'low'),
        timeoutMs:grounded?80000:65000,
        tools:grounded?[{type:'google_search'}]:[]
      });
      return send(res,200,{ok:true,provider:'gemini',model,apiVersion,autoUpgrade:geminiEnv().auto,usage,result,citations:citations||[],grounded});
    }
    const out=await openAIFallback({action,prompt,project,image});return send(res,200,{ok:true,...out});
  }catch(err){apiError(res,err);}
}
