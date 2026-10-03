import {send,jsonBody,authUser,supabaseFetch,apiError} from '../server/_lib.mjs';
import {requireCustomerCloud} from '../server/_customer_config.mjs';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const fields='id,name,version,revision,created_at,updated_at';
const validRevision=n=>Number.isSafeInteger(n)&&n>=1;
export default async function handler(req,res){try{
 if(req.method==='OPTIONS')return send(res,200,{ok:true});
 if(!['GET','POST','DELETE'].includes(req.method))return send(res,405,{ok:false,error:'Method not allowed'});
 requireCustomerCloud();const {user,token}=await authUser(req);
 const url=new URL(req.url||'/', 'https://buildmyhome.local'),id=String(req.query?.id||url.searchParams.get('id')||'');
 if(req.method==='GET'){
  if(id&&!UUID.test(id))return send(res,400,{ok:false,error:'Mã dự án không hợp lệ.'});
  const filter=`&user_id=eq.${encodeURIComponent(user.id)}`+(id?`&id=eq.${encodeURIComponent(id)}&limit=1`:'&order=updated_at.desc&limit=100');
  const rows=await supabaseFetch(`/rest/v1/bmh_projects?select=${fields}${id?',state':''}${filter}`,{token});
  return send(res,200,id?{ok:true,project:rows?.[0]||null}:{ok:true,projects:Array.isArray(rows)?rows:[]});
 }
 if(req.method==='DELETE'){
  const revision=Number(req.query?.revision||url.searchParams.get('revision'));
  if(!UUID.test(id)||!validRevision(revision))return send(res,400,{ok:false,error:'Cần mã dự án và phiên bản trước khi xóa.'});
  const result=await supabaseFetch('/rest/v1/rpc/bmh_delete_project',{method:'POST',token,body:{p_id:id,p_revision:revision}});
  return send(res,result.deleted?200:409,{ok:!!result.deleted,...result,...(!result.deleted?{code:'PROJECT_CONFLICT',error:'Bản trên máy chủ đã thay đổi. Hãy tải danh sách mới trước khi xóa.'}:{})});
 }
 const b=await jsonBody(req),projectId=String(b.id||''),requestId=String(b.requestId||''),revision=b.expectedRevision;
 if(!UUID.test(projectId)||!UUID.test(requestId)||!(revision===null||validRevision(revision)))return send(res,400,{ok:false,error:'Cần mã dự án, mã lần lưu và phiên bản hợp lệ.'});
 if(!b.state||typeof b.state!=='object'||Array.isArray(b.state)||!b.state.project||typeof b.state.project!=='object'||Array.isArray(b.state.project))return send(res,400,{ok:false,error:'Dữ liệu thiết kế không hợp lệ.'});
 if(Buffer.byteLength(JSON.stringify(b.state),'utf8')>4*1024*1024)return send(res,413,{ok:false,error:'Thiết kế quá lớn để đồng bộ. Hãy tải bản sao JSON.'});
 const state=structuredClone(b.state);state.access={paid:false,source:'server-required',paidAt:null,verifiedAt:null,orderCode:null};
 state.meta={createdAt:state.meta?.createdAt||null,savedAt:state.meta?.savedAt||null};
 const result=await supabaseFetch('/rest/v1/rpc/bmh_save_project',{method:'POST',token,body:{p_id:projectId,p_request_id:requestId,p_revision:revision,p_name:String(b.name||'Ngôi nhà của mình').trim().slice(0,120)||'Ngôi nhà của mình',p_version:String(b.version||'6.2.0').slice(0,40),p_state:state}});
 if(!result.saved)return send(res,409,{ok:false,code:'PROJECT_CONFLICT',error:'Dự án đã được sửa trên thiết bị khác. Bản trên máy này vẫn được giữ.',project:result.project||null});
 return send(res,200,{ok:true,project:result.project,replayed:!!result.replayed});
}catch(err){apiError(res,err);}}
