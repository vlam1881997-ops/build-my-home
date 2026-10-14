import {send,jsonBody,supabaseEnv,bearer,authUser,apiError} from '../server/_lib.mjs';
import {requireCustomerCloud} from '../server/_customer_config.mjs';
import {geminiRateLimit} from '../server/_gemini.mjs';
async function authCall(path,{method='POST',body,token=''}={}){
 const cfg=supabaseEnv(),headers={'Content-Type':'application/json',apikey:cfg.publishable};if(token)headers.Authorization=`Bearer ${token}`;
 const r=await fetch(`${cfg.url}${path}`,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
 const raw=await r.text();let data={};try{data=raw?JSON.parse(raw):{};}catch{}
 if(!r.ok)throw Object.assign(new Error(r.status===429?'Yêu cầu tài khoản quá nhiều. Hãy thử lại sau.':r.status>=500?'Dịch vụ tài khoản đang bận. Hãy thử lại.':data.msg||data.message||data.error_description||'Chưa xác nhận được tài khoản. Kiểm tra email và mật khẩu.'),{statusCode:r.status});
 return data;
}
function returnUrl(){
 try{const u=new URL(process.env.BMH_PUBLIC_URL||'https://www.huiminhbach.id.vn/');if(u.protocol==='https:'||(u.protocol==='http:'&&u.hostname==='localhost'))return u.origin+'/';}catch{}
 return 'https://www.huiminhbach.id.vn/';
}
export default async function handler(req,res){try{
 if(req.method==='OPTIONS')return send(res,200,{ok:true});if(req.method!=='POST')return send(res,405,{ok:false,error:'Method not allowed'});
 requireCustomerCloud();const body=await jsonBody(req),action=String(body.action||'');
 if(action==='session'){const {user}=await authUser(req);return send(res,200,{ok:true,user});}
 if(action==='logout'){const token=bearer(req);if(token)await authCall('/auth/v1/logout',{token});return send(res,200,{ok:true});}
 geminiRateLimit(req,{bucket:'customer-auth',max:12,windowMs:60000});
 if(['signup','signin','recover'].includes(action)){
  const email=String(body.email||'').trim().toLowerCase(),password=String(body.password||'');
  if(email.length>254||!/^\S+@\S+\.\S+$/.test(email))return send(res,400,{ok:false,error:'Email không hợp lệ.'});
  if(action==='recover'){
   // A generic response does not reveal whether this email has an account.
   try{await authCall('/auth/v1/recover?redirect_to='+encodeURIComponent(returnUrl()),{body:{email}});}catch(err){if(err.statusCode>=500||err.statusCode===429)throw err;}
   return send(res,200,{ok:true,message:'Nếu email có tài khoản, bạn sẽ nhận được liên kết đặt lại mật khẩu.'});
  }
  if(password.length<8||password.length>128)return send(res,400,{ok:false,error:'Mật khẩu cần từ 8 đến 128 ký tự.'});
  const data=action==='signup'?await authCall('/auth/v1/signup?redirect_to='+encodeURIComponent(returnUrl()),{body:{email,password}}):await authCall('/auth/v1/token?grant_type=password',{body:{email,password}});
  return send(res,200,{ok:true,data});
 }
 if(action==='password'){
  const {token}=await authUser(req),password=String(body.password||'');
  if(password.length<8||password.length>128)return send(res,400,{ok:false,error:'Mật khẩu cần từ 8 đến 128 ký tự.'});
  const user=await authCall('/auth/v1/user',{method:'PUT',token,body:{password}});return send(res,200,{ok:true,user});
 }
 if(action==='refresh'){
  const refresh_token=String(body.refresh_token||'');if(!refresh_token||refresh_token.length>8192)return send(res,400,{ok:false,error:'Phiên đăng nhập không hợp lệ.'});
  const data=await authCall('/auth/v1/token?grant_type=refresh_token',{body:{refresh_token}});return send(res,200,{ok:true,data});
 }
 return send(res,400,{ok:false,error:'Yêu cầu tài khoản không hợp lệ.'});
}catch(err){apiError(res,err);}}
