import {AsyncLocalStorage} from 'node:async_hooks';
import {createHash} from 'node:crypto';
import {authUser,send,supabaseFetch} from './_lib.mjs';
import {customerConfig} from './_customer_config.mjs';
const contexts=new AsyncLocalStorage(),UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const failure=(message,statusCode,code)=>Object.assign(new Error(message),{statusCode,code});

export async function aiUsageHandler(req,res){
 if(req.method!=='GET')return send(res,405,{ok:false,error:'Method not allowed'});
 const cfg=customerConfig();if(!cfg.quota)return send(res,200,{ok:true,usage:null,mode:'public'});
 try{const {user}=await authUser(req),usage=await supabaseFetch('/rest/v1/rpc/bmh_ai_usage',{method:'POST',admin:true,body:{p_user:user.id,p_limit:cfg.dailyLimit}});return send(res,200,{ok:true,mode:'account',usage});}
 catch(err){return send(res,err.statusCode||503,{ok:false,error:err.statusCode===401?'Đăng nhập để xem lượt AI.':'Chưa đọc được lượt AI.'});}
}
export async function requireAiAccount(req){
 if(!customerConfig().quota)return null;
 const ctx=contexts.getStore();if(ctx?.req===req&&ctx.accountPromise)return ctx.accountPromise;
 const run=(async()=>{try{return await authUser(req);}catch(err){if([401,403].includes(err.statusCode))throw failure('Đăng nhập để sử dụng lượt AI của tài khoản.',401,'AI_LOGIN_REQUIRED');throw err;}})();
 if(ctx?.req===req)ctx.accountPromise=run;return run;
}

// Reserved exactly once per HTTP request, immediately before a billable provider call.
export async function reserveAiUsage(){
 const ctx=contexts.getStore();if(!ctx||!customerConfig().quota)return;
 if(ctx.reservation)return ctx.reservation;
 ctx.reservation=(async()=>{
  const {user}=await requireAiAccount(ctx.req),id=String(ctx.req.headers?.['x-bmh-ai-request-id']||'');
  if(!UUID.test(id))throw failure('Cần mã yêu cầu AI hợp lệ. Hãy tải lại trang và thử lại.',400,'AI_REQUEST_ID_REQUIRED');
  const hash=createHash('sha256').update(JSON.stringify({feature:ctx.feature,url:ctx.req.url||'',body:ctx.req.body||{}})).digest('hex');
  const receipt=await supabaseFetch('/rest/v1/rpc/bmh_ai_reserve',{method:'POST',admin:true,body:{p_user:user.id,p_request:id,p_feature:ctx.feature,p_hash:hash,p_limit:customerConfig().dailyLimit}});
  if(!receipt.accepted)throw failure(receipt.code==='AI_LIMIT_REACHED'?'Bạn đã dùng hết lượt AI hôm nay. Bản vẽ và mô hình 3D vẫn sử dụng được.':'Yêu cầu AI này đã được nhận. Không gửi lại để tránh tạo hai kết quả.',receipt.code==='AI_LIMIT_REACHED'?429:409,receipt.code||'AI_REQUEST_REPLAY');
  ctx.receipt={user:user.id,id};
 })();return ctx.reservation;
}
export function markAiProviderAccepted(){const ctx=contexts.getStore();if(ctx)ctx.accepted=true;}
export function beginAiProviderCall(){
 const ctx=contexts.getStore();if(ctx)ctx.uncertain++;
 let finished=false;return status=>{if(!ctx||finished)return;finished=true;ctx.uncertain--;if(status>=200&&status<300)ctx.accepted=true;};
}
export function withAiUsage(handler,feature){return async(req,res)=>{
 const ctx={req,feature,accepted:false,uncertain:0,receipt:null,reservation:null};
 let endArgs=null,response=res;
 if(customerConfig().quota){
  response=new Proxy(res,{get(target,key){
   if(key==='end')return (...args)=>{endArgs=args;return response;};
   if(key==='status')return status=>{target.status(status);return response;};
   const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;
  },set(target,key,value){return Reflect.set(target,key,value,target);}});
 }
 return contexts.run(ctx,async()=>{
  try{return await handler(req,response);}
  finally{if(ctx.receipt){try{await supabaseFetch('/rest/v1/rpc/bmh_ai_settle',{method:'POST',admin:true,signal:AbortSignal.timeout(5000),body:{p_user:ctx.receipt.user,p_request:ctx.receipt.id,p_used:ctx.accepted||ctx.uncertain>0}});}catch(_){
   // A lost settlement remains reserved and counts against the limit. SQL ages it
   // into a used attempt, rather than making a provider call free by a timeout.
  }}
  // Serverless runtimes can suspend work after res.end(). Finish the bounded
  // ledger write first, then deliver the existing JSON or binary response.
  if(endArgs)res.end(...endArgs);
  }
 });
};}
