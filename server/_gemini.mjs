const GEMINI_BASE='https://generativelanguage.googleapis.com';

export function geminiEnv(){
  const key=String(process.env.GEMINI_API_KEY||'').trim();
  const auto=String(process.env.GEMINI_AUTO_UPGRADE??'true').toLowerCase()!=='false';
  const configured=String(process.env.GEMINI_MODEL||'').trim();
  const primary=configured||(auto?'gemini-flash-latest':'gemini-3.8-flash');
  const fallback=String(process.env.GEMINI_FALLBACK_MODEL||'gemini-3.5-flash-lite').trim();
  const apiVersion=String(process.env.GEMINI_API_VERSION||'auto').trim().toLowerCase();
  return {key,auto,primary,fallback,apiVersion,deleteUploads:String(process.env.GEMINI_DELETE_UPLOADS??'true').toLowerCase()!=='false'};
}

export function geminiModelCandidates(){
  const e=geminiEnv(),list=[e.primary];
  if(e.fallback&&e.fallback!==e.primary)list.push(e.fallback);
  if(!list.includes('gemini-3.5-flash-lite'))list.push('gemini-3.5-flash-lite');
  return [...new Set(list.filter(Boolean))];
}

const LIMIT_WINDOW=60*60*1000;
const buckets=globalThis.__BMH_GEMINI_BUCKETS__||(globalThis.__BMH_GEMINI_BUCKETS__=new Map());
export function geminiRateLimit(req,{bucket='scan',max=8,windowMs=LIMIT_WINDOW}={}){
  const ip=String(req?.headers?.['x-forwarded-for']||req?.headers?.['x-real-ip']||'unknown').split(',')[0].trim();
  const key=`${bucket}:${ip}`,now=Date.now(),row=buckets.get(key);
  if(!row||now-row.start>windowMs){buckets.set(key,{start:now,count:1});return;}
  row.count+=1;
  if(row.count>max)throw Object.assign(new Error('AI Scan đang nhận quá nhiều yêu cầu từ thiết bị này. Vui lòng thử lại sau.'),{statusCode:429});
  if(buckets.size>1200)for(const [k,v] of buckets)if(now-v.start>windowMs)buckets.delete(k);
}

function apiVersions(){
  const v=geminiEnv().apiVersion;
  return v==='auto'?['v1','v1beta']:[/^v1(?:beta)?$/.test(v)?v:'v1beta'];
}

function mediaType(mime=''){
  const m=String(mime).toLowerCase();
  if(m.startsWith('image/'))return'image';
  if(m.startsWith('video/'))return'video';
  if(m.startsWith('audio/'))return'audio';
  if(m==='application/pdf'||m.startsWith('text/'))return'document';
  return'document';
}

function normalizeInput(parts=[]){
  const out=[];
  for(const p of parts||[]){
    if(typeof p?.text==='string'){out.push({type:'text',text:p.text});continue;}
    if(p?.inline_data?.data){out.push({type:mediaType(p.inline_data.mime_type),data:p.inline_data.data,mime_type:p.inline_data.mime_type});continue;}
    if(p?.file_data?.file_uri){
      const item={type:mediaType(p.file_data.mime_type),uri:p.file_data.file_uri,mime_type:p.file_data.mime_type};
      if(item.type==='video'&&p.media_processing)item.processing=String(p.media_processing).toLowerCase()==='agentic'?'agentic':p.media_processing;
      out.push(item);continue;
    }
    if(p?.type)out.push(p);
  }
  return out;
}

function extractInteractionText(data){
  if(typeof data?.output_text==='string'&&data.output_text.trim())return data.output_text.trim();
  for(const o of data?.outputs||[])if(o?.type==='text'&&typeof o.text==='string'&&o.text.trim())return o.text.trim();
  const steps=Array.isArray(data?.steps)?data.steps:[];
  for(let i=steps.length-1;i>=0;i--){
    const content=steps[i]?.content;
    if(Array.isArray(content))for(const c of content)if(typeof c?.text==='string'&&c.text.trim())return c.text.trim();
    if(typeof content?.text==='string'&&content.text.trim())return content.text.trim();
  }
  return'';
}

async function postInteraction(apiVersion,model,payload,key,signal){
  const url=`${GEMINI_BASE}/${apiVersion}/interactions`;
  const r=await fetch(url,{method:'POST',signal,headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify({...payload,model})});
  let data={};const raw=await r.text();if(raw){try{data=JSON.parse(raw);}catch{data={raw};}}
  return {r,data};
}

export async function geminiGenerate({parts,input,systemInstruction='',schema,maxOutputTokens=2200,thinkingLevel='low',timeoutMs=60000,tools=[]}){
  const env=geminiEnv();
  if(!env.key)throw Object.assign(new Error('Gemini chưa cấu hình GEMINI_API_KEY trên server.'),{statusCode:503});
  const normalized=Array.isArray(input)?input:normalizeInput(parts);
  if(!normalized.length)throw Object.assign(new Error('Gemini không có dữ liệu đầu vào.'),{statusCode:400});
  const combos=[];for(const model of geminiModelCandidates())for(const apiVersion of apiVersions())combos.push({model,apiVersion});
  let lastErr=null,quotaModel='';
  for(let i=0;i<combos.length;i++){
    const {model,apiVersion}=combos[i];
    if(quotaModel===model)continue;
    const payload={
      input:normalized,
      system_instruction:systemInstruction||undefined,
      store:false,
      generation_config:{max_output_tokens:maxOutputTokens},
      response_format:schema?{type:'text',mime_type:'application/json',schema}:undefined,
      tools:Array.isArray(tools)&&tools.length?tools:undefined
    };
    const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),timeoutMs);
    try{
      const {r,data}=await postInteraction(apiVersion,model,payload,env.key,ctl.signal);
      if(!r.ok){
        const err=Object.assign(new Error(data?.error?.message||`Gemini HTTP ${r.status}`),{statusCode:r.status>=400&&r.status<500?r.status:502,details:data,model,apiVersion});
        const msg=String(data?.error?.message||'').toLowerCase(),more=i<combos.length-1;
        if(more&&r.status===429){lastErr=err;quotaModel=model;continue;}
        if(more&&(r.status===408||r.status>=500||r.status===404||r.status===400||msg.includes('model')||msg.includes('unsupported')||msg.includes('api version'))){lastErr=err;continue;}
        throw err;
      }
      const text=extractInteractionText(data);if(!text)throw Object.assign(new Error('Gemini không trả về nội dung có thể đọc.'),{statusCode:502,model,apiVersion});
      let result;try{result=schema?JSON.parse(text):text;}catch{throw Object.assign(new Error('Gemini trả về dữ liệu không đúng JSON.'),{statusCode:502,model,apiVersion});}
      const citations=[];const seen=new Set();
      const walk=v=>{if(!v||typeof v!=='object')return;if(Array.isArray(v)){for(const x of v)walk(x);return;}if(v.type==='url_citation'&&v.url){const url=String(v.url),title=String(v.title||'Nguồn web');if(!seen.has(url)){seen.add(url);citations.push({url,title});}}for(const x of Object.values(v))walk(x);};
      walk(data);
      return {result,model,apiVersion,usage:data?.usage||data?.usage_metadata||data?.usageMetadata||null,citations,raw:data};
    }catch(err){
      lastErr=err?.name==='AbortError'?Object.assign(new Error('Gemini xử lý quá thời gian cho phép.'),{statusCode:504,model,apiVersion}):err;
      if(i===combos.length-1)throw lastErr;
    }finally{clearTimeout(timer);}
  }
  throw lastErr||Object.assign(new Error('Không tìm thấy model Gemini/API version khả dụng.'),{statusCode:503});
}

export async function geminiStartUpload({displayName,mimeType,size}){
  const env=geminiEnv();if(!env.key)throw Object.assign(new Error('Gemini chưa cấu hình GEMINI_API_KEY.'),{statusCode:503});
  const r=await fetch(`${GEMINI_BASE}/upload/v1beta/files`,{method:'POST',headers:{
    'x-goog-api-key':env.key,
    'X-Goog-Upload-Protocol':'resumable',
    'X-Goog-Upload-Command':'start',
    'X-Goog-Upload-Header-Content-Length':String(size),
    'X-Goog-Upload-Header-Content-Type':mimeType,
    'Content-Type':'application/json'
  },body:JSON.stringify({file:{display_name:displayName}})});
  if(!r.ok){let data={};try{data=await r.json();}catch{}throw Object.assign(new Error(data?.error?.message||`Gemini upload init HTTP ${r.status}`),{statusCode:r.status>=400&&r.status<500?r.status:502});}
  const uploadUrl=r.headers.get('x-goog-upload-url');if(!uploadUrl)throw Object.assign(new Error('Gemini không trả về resumable upload URL.'),{statusCode:502});
  return uploadUrl;
}

export function safeGeminiFileName(name){
  const safe=String(name||'').replace(/^\/+/, '');
  if(!/^files\/[A-Za-z0-9._-]+$/.test(safe))throw Object.assign(new Error('Gemini file name không hợp lệ.'),{statusCode:400});
  return safe;
}

export function validGeminiFileUri(uri,name=''){
  try{
    const u=new URL(String(uri||''));
    if(u.protocol!=='https:'||u.hostname!=='generativelanguage.googleapis.com')return false;
    if(!/^\/v1beta\/files\/[A-Za-z0-9._-]+$/.test(u.pathname))return false;
    if(name){const safe=safeGeminiFileName(name),id=safe.slice('files/'.length);return u.pathname.endsWith(`/files/${id}`);}
    return true;
  }catch{return false;}
}

export async function geminiFileInfo(name){
  const env=geminiEnv();if(!env.key)throw Object.assign(new Error('Gemini chưa cấu hình GEMINI_API_KEY.'),{statusCode:503});
  const safe=safeGeminiFileName(name);
  const r=await fetch(`${GEMINI_BASE}/v1beta/${safe}`,{headers:{'x-goog-api-key':env.key}});let data={};try{data=await r.json();}catch{}
  if(!r.ok)throw Object.assign(new Error(data?.error?.message||`Gemini file status HTTP ${r.status}`),{statusCode:r.status>=400&&r.status<500?r.status:502});
  return data;
}

export async function geminiDeleteFile(name){
  const env=geminiEnv();if(!env.key||!name)return false;
  let safe;try{safe=safeGeminiFileName(name);}catch{return false;}
  try{const r=await fetch(`${GEMINI_BASE}/v1beta/${safe}`,{method:'DELETE',headers:{'x-goog-api-key':env.key}});return r.ok;}catch{return false;}
}
