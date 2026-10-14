/* Private project media. User token + project ownership + Storage RLS, never
 * service-role/public bucket. Bytes upload first; caller must save metadata
 * with the existing revision-checked project API before another device reads it. */
import {createHash} from 'node:crypto';
import {send,jsonBody,authUser,supabaseFetch,supabaseEnv,apiError} from './_lib.mjs';
import {requireCustomerCloud} from './_customer_config.mjs';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const id=/^[a-zA-Z0-9_-]{1,100}$/,bucket='bmh-project-media',MAX=2*1024*1024;
const extensions={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','application/pdf':'pdf'};
const fail=(message,statusCode=400,code)=>{throw Object.assign(new Error(message),{statusCode,code});};
export function decodeProjectMedia(base64,type){
 if(!extensions[type]||typeof base64!=='string'||base64.length>Math.ceil(MAX/3)*4||base64.length%4||!/^[A-Za-z0-9+/]+={0,2}$/.test(base64))fail('Chỉ nhận JPG, PNG, WebP hoặc PDF, tối đa 2 MB.',413);
 const bytes=Buffer.from(base64,'base64');if(!bytes.length||bytes.length>MAX||bytes.toString('base64')!==base64)fail('Nội dung tệp không hợp lệ.');
 const valid=type==='image/jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:type==='image/png'?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):type==='image/webp'?bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP':bytes.subarray(0,5).toString()==='%PDF-';
 if(!valid)fail('Loại tệp không khớp nội dung.');return bytes;
}
async function storage(path,{token,method='POST',body,type='application/json'}={}){
 const cfg=supabaseEnv(),ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),20000);
 try{const response=await fetch(cfg.url+'/storage/v1/'+path,{method,signal:ctl.signal,headers:{apikey:cfg.publishable,Authorization:'Bearer '+token,'Content-Type':type,'x-upsert':'false'},body:body===undefined?undefined:Buffer.isBuffer(body)?body:JSON.stringify(body)});
 const data=await response.json().catch(()=>({}));if(!response.ok&&!(response.status===409&&path.startsWith('object/'+bucket+'/')))fail('Kho tệp chưa xử lý được. Bản trên máy được giữ.',response.status>=500?502:response.status);return data;
 }finally{clearTimeout(timer);}
}
export async function projectMediaHandler(req,res){try{
 if(!['GET','POST'].includes(req.method))return send(res,405,{ok:false,error:'Method not allowed'});
 requireCustomerCloud();if(process.env.BMH_MEDIA_READY!=='true')fail('Kho tệp nhiều thiết bị chưa được mở.',503);
 const {user,token}=await authUser(req),url=new URL(req.url||'/', 'https://bmh.local'),body=req.method==='POST'?await jsonBody(req):{},projectId=String(body.projectId||url.searchParams.get('projectId')||''),evidenceId=String(body.evidenceId||url.searchParams.get('evidenceId')||'');
 if(!uuid.test(projectId)||!uuid.test(user.id)||!id.test(evidenceId))fail('Mã dự án / tệp không hợp lệ.');
 const rows=await supabaseFetch('/rest/v1/bmh_projects?select=id,revision,state&user_id=eq.'+encodeURIComponent(user.id)+'&id=eq.'+encodeURIComponent(projectId)+'&limit=1',{token}),project=rows?.[0];
 if(!project)fail('Không tìm thấy dự án thuộc tài khoản này.',404);
 const records=[...(project.state?.project?.dossier?.evidence||[]),...(project.state?.project?.sourceRefs||[])];
 if(req.method==='POST'){
  if(!Number.isSafeInteger(body.expectedRevision)||body.expectedRevision!==project.revision)fail('Dự án đã thay đổi trên thiết bị khác. Đồng bộ trước khi tải tệp.',409,'PROJECT_CONFLICT');
  const record=records.find(r=>r.id===evidenceId);
  if(!record)fail('Lưu tham chiếu tệp vào hồ sơ trước khi tải nội dung.',400,'MEDIA_REFERENCE_REQUIRED');
  const bytes=decodeProjectMedia(body.base64,body.type),sha256=createHash('sha256').update(bytes).digest('hex'),key=user.id+'/'+projectId+'/'+evidenceId+'-'+sha256+'.'+extensions[body.type];
  if(record.cloudSha256&&record.cloudSha256!==sha256)fail('Tệp đã đồng bộ gắn với nội dung cũ. Thêm tệp mới nếu đổi bản gốc.',409,'MEDIA_CONTENT_CHANGED');
  await storage('object/'+bucket+'/'+key,{token,body:bytes,type:body.type});
  return send(res,200,{ok:true,file:{evidenceId,cloudKey:key,cloudProjectId:projectId,cloudSha256:sha256,size:bytes.length,type:body.type,uploadedAt:new Date().toISOString()},requiresProjectSave:true});
 }
 const record=records.find(r=>r.id===evidenceId&&r.cloudProjectId===projectId),key=record?.cloudKey,prefix=user.id+'/'+projectId+'/';
 if(typeof key!=='string'||!key.startsWith(prefix)||!new RegExp('^'+evidenceId+'-[a-f0-9]{64}\\.(jpg|png|webp|pdf)$').test(key.slice(prefix.length)))fail('Tệp chưa có bản đồng bộ hợp lệ.',404);
 const signed=await storage('object/sign/'+bucket+'/'+key,{token,body:{expiresIn:120}}),path=signed.signedURL||signed.signedUrl;
 if(typeof path!=='string'||!path.startsWith('/object/sign/'+bucket+'/'+key+'?'))fail('Kho tệp chưa cấp đường dẫn đọc hợp lệ.',502);
 return send(res,200,{ok:true,url:supabaseEnv().url+'/storage/v1'+path,expiresIn:120,sha256:record.cloudSha256||null});
}catch(error){apiError(res,error);}}
