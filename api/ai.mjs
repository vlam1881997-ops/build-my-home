import {send,jsonBody,apiError} from './_lib.mjs';

const DEFAULT_MODEL=String(process.env.OPENAI_MODEL||'gpt-6-astra').trim();
const OPENAI_URL='https://api.openai.com/v1/responses';
const AI_WINDOW_MS=10*60*1000,AI_MAX_PER_WINDOW=12;
const aiBuckets=globalThis.__BMH_AI_BUCKETS__||(globalThis.__BMH_AI_BUCKETS__=new Map());
function rateLimit(req){
  const ip=String(req.headers?.['x-forwarded-for']||req.headers?.['x-real-ip']||'unknown').split(',')[0].trim();
  const now=Date.now(),row=aiBuckets.get(ip);
  if(!row||now-row.start>AI_WINDOW_MS){aiBuckets.set(ip,{start:now,count:1});return;}
  row.count+=1;if(row.count>AI_MAX_PER_WINDOW)throw Object.assign(new Error('AI đang nhận quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.'),{statusCode:429});
  if(aiBuckets.size>500)for(const [k,v] of aiBuckets)if(now-v.start>AI_WINDOW_MS)aiBuckets.delete(k);
}

const RESULT_SCHEMA={
  type:'object',additionalProperties:false,
  properties:{
    headline:{type:'string'},
    summary:{type:'string'},
    confidence:{type:'integer',minimum:0,maximum:100},
    brief:{type:'object',additionalProperties:false,properties:{
      budget_vnd:{type:['number','null']},province:{type:['string','null']},floors:{type:['integer','null']},style:{type:['string','null']},bedrooms:{type:['integer','null']},priorities:{type:'array',items:{type:'string'},maxItems:8}
    },required:['budget_vnd','province','floors','style','bedrooms','priorities']},
    metrics:{type:'object',additionalProperties:false,properties:{
      current_cost_vnd:{type:'number'},target_saving_vnd:{type:'number'},comfort_risk:{type:'string'},safety_note:{type:'string'}
    },required:['current_cost_vnd','target_saving_vnd','comfort_risk','safety_note']},
    findings:{type:'array',maxItems:8,items:{type:'object',additionalProperties:false,properties:{category:{type:'string'},severity:{type:'string',enum:['low','medium','high']},title:{type:'string'},detail:{type:'string'}},required:['category','severity','title','detail']}},
    recommendations:{type:'array',maxItems:8,items:{type:'object',additionalProperties:false,properties:{title:{type:'string'},detail:{type:'string'},benefit:{type:'string'},estimated_saving_vnd:{type:'number'},step:{type:'integer',minimum:1,maximum:10},safe_to_apply:{type:'boolean'}},required:['title','detail','benefit','estimated_saving_vnd','step','safe_to_apply']}},
    questions:{type:'array',maxItems:5,items:{type:'string'}}
  },
  required:['headline','summary','confidence','brief','metrics','findings','recommendations','questions']
};

function cleanProject(p={}){
  const out={
    name:String(p.name||'').slice(0,120),style:String(p.style||'').slice(0,80),
    site:p.site&&typeof p.site==='object'?{
      province:String(p.site.province||'').slice(0,80),district:String(p.site.district||'').slice(0,120),frontDirection:String(p.site.frontDirection||'').slice(0,24),width:Number(p.site.width)||0,depth:Number(p.site.depth)||0,floors:Number(p.site.floors)||0,road:Number(p.site.road)||0,soil:String(p.site.soil||'').slice(0,120),shape:String(p.site.shape||'').slice(0,80),targetCoverage:Number(p.site.targetCoverage)||0
    }:null,
    finance:p.finance&&typeof p.finance==='object'?{
      cash:Number(p.finance.cash)||0,income:Number(p.finance.income)||0,living:Number(p.finance.living)||0,reserve:Number(p.finance.reserve)||0,existingDebt:Number(p.finance.existingDebt)||0,loan:Number(p.finance.loan)||0,years:Number(p.finance.years)||0,introRate:Number(p.finance.introRate)||0,postRate:Number(p.finance.postRate)||0
    }:null,
    household:p.household&&typeof p.household==='object'?{
      ownerBirth:Number(p.household.ownerBirth)||0,partnerEnabled:p.household.partnerEnabled!==false,partnerBirth:Number(p.household.partnerBirth)||0,
      children:Array.isArray(p.household.children)?p.household.children.slice(0,8).map(x=>({birth:Number(x.birth)||0,room:String(x.room||'').slice(0,40)})):[],
      relatives:Array.isArray(p.household.relatives)?p.household.relatives.slice(0,8).map(x=>({birth:Number(x.birth)||0,mobility:String(x.mobility||'').slice(0,60)})):[]
    }:null,
    plan:p.plan&&typeof p.plan==='object'?{
      rooms:Array.isArray(p.plan.rooms)?p.plan.rooms.slice(0,40).map(r=>({floor:Number(r.floor)||0,name:String(r.name||'').slice(0,80),type:String(r.type||'').slice(0,30),x:Number(r.x)||0,y:Number(r.y)||0,w:Number(r.w)||0,h:Number(r.h)||0})):[],
      openings:Array.isArray(p.plan.openings)?p.plan.openings.slice(0,80).map(o=>({floor:Number(o.floor)||0,kind:String(o.kind||'').slice(0,30),side:String(o.side||'').slice(0,20),width:Number(o.width)||0})):[]
    }:null,
    materials:p.materials&&typeof p.materials==='object'?{tier:String(p.materials.tier||''),climatePackage:String(p.materials.climatePackage||''),choices:p.materials.choices||{}}:null,
    performance:p.performance&&typeof p.performance==='object'?p.performance:null,
    computed:p.computed&&typeof p.computed==='object'?p.computed:null
  };
  return out;
}

function actionInstruction(action){
  const common='Ưu tiên sự hữu ích cho chủ nhà Việt Nam. Không bịa số liệu chưa có. Dữ liệu computed do engine cung cấp là nguồn sự thật cho chi phí/điểm số. Tuyệt đối không khuyên cắt giảm thép, bê tông, móng, chống thấm, bảo vệ điện, PCCC hay hạng mục an toàn chỉ để tiết kiệm. Mọi kết luận về kết cấu, pháp lý, MEP và khả năng thi công phải ghi là cần KTS/kỹ sư/đơn vị có chuyên môn xác nhận.';
  const map={
    brief:'Đọc mô tả tự nhiên của người dùng, trích xuất brief xây nhà, nhận diện nhu cầu gia đình, ngân sách, số tầng/phòng và ưu tiên. Đưa ra 3-6 bước tiếp theo thực tế.',
    review:'Đánh giá phương án hiện tại theo công năng, lưu thông, ánh sáng, thông gió, người già/trẻ em, khí hậu, chi phí và khả năng trao đổi với KTS. Chỉ ra vấn đề cụ thể, không khen chung chung.',
    cost:'Tìm cơ hội tiết kiệm chi phí mà vẫn giữ tiện nghi và an toàn. Ưu tiên giảm diện tích lãng phí, chuẩn hóa cửa/kích thước, gom khu ướt, lựa chọn hoàn thiện, thiết bị và tối ưu vận hành. estimated_saving_vnd phải thận trọng và tổng target_saving_vnd không vượt tổng các khoản có cơ sở.',
    whatif:'Phân tích câu hỏi giả định của người dùng. So sánh tác động lên chi phí, công năng, tiện nghi, khí hậu và rủi ro; nêu rõ giả định nào cần engine/KTS kiểm tra lại.',
    vision:'Phân tích ảnh nhà mẫu/bản vẽ tham khảo. Nhận diện phong cách, tổ chức không gian hoặc chi tiết đáng học hỏi; không suy đoán kích thước chính xác nếu ảnh không có tỷ lệ.',
    chat:'Trả lời như AI Copilot xuyên suốt dự án, dựa trên toàn bộ context; hướng người dùng đến bước phù hợp và luôn phân biệt dữ liệu tính toán với gợi ý AI.'
  };
  return `${map[action]||map.chat} ${common}`;
}

function extractText(data){
  if(typeof data?.output_text==='string'&&data.output_text.trim())return data.output_text;
  for(const item of data?.output||[])for(const c of item?.content||[])if(c?.type==='output_text'&&typeof c.text==='string')return c.text;
  return '';
}

export default async function handler(req,res){
  try{
    if(req.method==='OPTIONS')return send(res,200,{ok:true});
    if(req.method!=='POST')return send(res,405,{ok:false,error:'Method not allowed'});
    const apiKey=String(process.env.OPENAI_API_KEY||'').trim();
    if(!apiKey)throw Object.assign(new Error('AI chưa cấu hình OPENAI_API_KEY trên server.'),{statusCode:503});
    rateLimit(req);
    const body=await jsonBody(req),action=String(body.action||'chat').toLowerCase();
    if(!['brief','review','cost','whatif','vision','chat'].includes(action))return send(res,400,{ok:false,error:'AI action không hợp lệ.'});
    const prompt=String(body.prompt||'').trim().slice(0,6000);
    const project=cleanProject(body.project||{});
    const userText=`Yêu cầu: ${prompt||'(không có câu hỏi bổ sung)'}\n\nDữ liệu dự án JSON:\n${JSON.stringify(project)}`;
    const content=[{type:'input_text',text:userText}];
    const image=String(body.image_data_url||'');
    if(action==='vision'&&/^data:image\/(png|jpe?g|webp);base64,/i.test(image)&&image.length<12_000_000)content.push({type:'input_image',image_url:image,detail:'auto'});
    const payload={
      model:DEFAULT_MODEL,store:false,max_output_tokens:1800,
      input:[
        {role:'system',content:[{type:'input_text',text:`Bạn là Build My Home AI Copilot. ${actionInstruction(action)} Trả lời tiếng Việt rõ ràng, ngắn gọn, có hành động cụ thể.`}]},
        {role:'user',content}
      ],
      text:{format:{type:'json_schema',name:'build_my_home_ai_result',strict:true,schema:RESULT_SCHEMA}}
    };
    const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),45000);
    let r,data;
    try{r=await fetch(OPENAI_URL,{method:'POST',signal:ctl.signal,headers:{'Content-Type':'application/json','Authorization':`Bearer ${apiKey}`},body:JSON.stringify(payload)});data=await r.json();}finally{clearTimeout(timer);}
    if(!r.ok){const msg=data?.error?.message||`OpenAI HTTP ${r.status}`;throw Object.assign(new Error(msg),{statusCode:r.status>=400&&r.status<500?r.status:502});}
    const raw=extractText(data);if(!raw)throw Object.assign(new Error('AI không trả về nội dung có thể đọc.'),{statusCode:502});
    let result;try{result=JSON.parse(raw);}catch{throw Object.assign(new Error('AI trả về dữ liệu không đúng JSON schema.'),{statusCode:502});}
    return send(res,200,{ok:true,model:DEFAULT_MODEL,result});
  }catch(err){apiError(res,err);}
}
