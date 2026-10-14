import crypto from 'node:crypto';
import {momoEnv,createMomoPayment,queryMomoPayment,momoNotificationOutcome} from './_momo.mjs';

const fail=(message,statusCode=400)=>Object.assign(new Error(message),{statusCode});
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const ID=/^bmh-[a-f0-9-]{36}$/;
const TOKEN=/^[a-f0-9]{64}$/;
export function guestCheckoutConfig(env=process.env){
 const momo=momoEnv(env),price=Number(env.BMH_SERVICE_PRICE_VND),title=String(env.BMH_SERVICE_TITLE||'Dịch vụ thiết kế BMH').slice(0,120),publicOrigin=String(env.BMH_PUBLIC_URL||'');let originValid=false,databaseValid=false;
 try{const u=new URL(publicOrigin);originValid=u.protocol==='https:'&&!u.username&&!u.password&&u.pathname==='/'&&!u.search&&!u.hash;}catch{}
 try{const u=new URL(env.SUPABASE_URL);databaseValid=u.protocol==='https:'&&!u.username&&!u.password&&u.pathname==='/'&&!u.search&&!u.hash;}catch{}
 const enabled=env.BMH_CHECKOUT_ENABLED==='true'&&env.BMH_GUEST_ORDERS_READY==='true'&&['sandbox','production'].includes(momo.environment)&&!!momo.partnerCode&&!!momo.accessKey&&!!momo.secretKey&&databaseValid&&!!(env.SUPABASE_SECRET_KEY||env.SUPABASE_SERVICE_ROLE_KEY)&&Number.isSafeInteger(price)&&price>=1000&&price<=50000000&&originValid;
 return {enabled,price,title,publicOrigin,momo};
}
export function approvedServiceDesign(design){
 const p=design?.project,s=p?.site,rooms=p?.plan?.rooms;
 if(!p||!s||!Array.isArray(rooms)||!rooms.length||rooms.length>300||![s.width,s.depth].every(n=>Number.isFinite(Number(n))&&Number(n)>0&&Number(n)<=1000)||!Number.isInteger(Number(s.floors))||Number(s.floors)<1||Number(s.floors)>10)throw fail('Thiết kế chưa có khu đất và bản vẽ hợp lệ để chốt dịch vụ.');
 if(rooms.some(r=>![r.x,r.y,r.w,r.h,r.floor].every(n=>Number.isFinite(Number(n)))||r.w<=0||r.h<=0||r.floor<0||r.floor>=s.floors))throw fail('Bản vẽ có phòng chưa hợp lệ.');
 // Access flags, account sessions and browser state never become entitlements.
 const snapshot={version:String(design.version||'').slice(0,40),project:structuredClone(p)};
 const serialized=JSON.stringify(snapshot);if(Buffer.byteLength(serialized)>1500000)throw fail('Thiết kế quá lớn. Hãy tải bản sao để gửi cho dịch vụ.');
 return {snapshot,digest:hash(serialized)};
}
const columns='id,request_id,token_hash,amount,title,partner_code,environment,order_info,design_hash,project_name,status,pay_url,trans_id,paid_at,created_at';
async function database(path,{method='GET',body,headers={}}={}){
 const env=process.env,url=String(env.SUPABASE_URL||'').replace(/\/$/,''),key=String(env.SUPABASE_SECRET_KEY||env.SUPABASE_SERVICE_ROLE_KEY||'');
 if(!url||!key)throw fail('Kho đơn dịch vụ chưa được cấu hình.',503);
 const response=await fetch(url+'/rest/v1/'+path,{method,redirect:'error',headers:{'Content-Type':'application/json',apikey:key,...(key.startsWith('eyJ')?{Authorization:'Bearer '+key}:{}),...headers},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(10000)});
 const text=await response.text();if(!response.ok)throw fail('Chưa lưu được đơn dịch vụ. Thiết kế trên thiết bị vẫn được giữ.',response.status===409?409:503);return text?JSON.parse(text):null;
}
const first=value=>Array.isArray(value)?value[0]:value;
export const guestOrderStore={
 findByToken:async tokenHash=>first(await database('bmh_service_orders?select='+columns+'&token_hash=eq.'+tokenHash+'&limit=1')),
 get:async(id,withDesign=false)=>first(await database('bmh_service_orders?select='+columns+(withDesign?',design_snapshot':'')+'&id=eq.'+id+'&limit=1')),
 insert:async row=>first(await database('bmh_service_orders',{method:'POST',body:row,headers:{Prefer:'return=representation'}})),
 link:async(id,payUrl)=>{await database('bmh_service_orders?id=eq.'+id+'&status=eq.creating',{method:'PATCH',body:{pay_url:payUrl,status:'pending'},headers:{Prefer:'return=minimal'}});},
 result:async(order,outcome)=>first(await database('rpc/bmh_record_momo_result',{method:'POST',body:{p_order_id:order.id,p_request_id:order.request_id,p_partner_code:order.partner_code,p_amount:order.amount,p_result_code:outcome.resultCode,p_trans_id:outcome.transId}}))
};
function publicOrder(row){return {id:row.id,amount:Number(row.amount),title:row.title,projectName:row.project_name,status:row.status,paid:row.status==='paid',payUrl:row.pay_url||'',paidAt:row.paid_at||null,createdAt:row.created_at,sandbox:row.environment==='sandbox',designHash:row.design_hash};}
function providerOrder(row,config){return {orderId:row.id,requestId:row.request_id,amount:Number(row.amount),orderInfo:row.order_info,partnerCode:row.partner_code,extraData:'',publicOrigin:config.publicOrigin};}
async function bodyOf(req){if(req.body&&typeof req.body==='object'){if(Buffer.byteLength(JSON.stringify(req.body))>1700000)throw fail('Dữ liệu gửi quá lớn.',413);return req.body;}const chunks=[];let size=0;for await(const chunk of req){const bytes=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk);size+=bytes.length;if(size>1700000)throw fail('Dữ liệu gửi quá lớn.',413);chunks.push(bytes);}try{return JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}');}catch{throw fail('Dữ liệu không hợp lệ.');}}
function reply(res,status,data){res.status(status).setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json; charset=utf-8');res.end(data===undefined?'':JSON.stringify(data));}
const limits=new Map();function limit(req){const ip=String(req.headers?.['x-forwarded-for']||req.headers?.['x-real-ip']||'unknown').split(',')[0].trim(),now=Date.now(),entry=limits.get(ip);if(entry&&now-entry.start<60000){if(++entry.count>8)throw fail('Đang tạo nhiều đơn liên tiếp. Hãy chờ một phút rồi thử lại.',429);}else limits.set(ip,{start:now,count:1});if(limits.size>1000)for(const [key,value]of limits)if(now-value.start>60000)limits.delete(key);}
export function createGuestCheckoutHandler({getConfig=guestCheckoutConfig,store=guestOrderStore,createPayment=createMomoPayment,queryPayment=queryMomoPayment}={}){
 return async(req,res)=>{try{
 const config=getConfig(),providerReady=['sandbox','production'].includes(config.momo?.environment)&&!!config.momo?.partnerCode&&!!config.momo?.accessKey&&!!config.momo?.secretKey;
  if(req.method!=='POST')return reply(res,405,{ok:false,error:'Method not allowed'});
  const body=await bodyOf(req),url=new URL(req.url||'/','https://bmh.local'),notify=(req.query?.operation||url.searchParams.get('operation'))==='checkout-notify';
  if(notify){
   if(!providerReady)throw fail('Chưa kiểm tra được xác nhận MoMo.',503);
   if(!ID.test(body.orderId||''))throw fail('Mã đơn không hợp lệ.');const order=await store.get(body.orderId);if(!order)throw fail('Không tìm thấy đơn dịch vụ.',404);
   if(order.environment!==config.momo.environment)throw fail('Đơn thuộc môi trường MoMo khác.');const outcome=momoNotificationOutcome(body,providerOrder(order,config),config.momo);await store.result(order,outcome);return reply(res,204);
  }
  const token=String(req.headers?.authorization||'').replace(/^Bearer /i,'');if(!TOKEN.test(token))throw fail('Thiếu mã truy cập đơn dịch vụ.',401);const tokenHash=hash(token);
  if(body.action==='create'){
   if(!config.enabled)throw fail('Dịch vụ thanh toán chưa được mở. Bạn vẫn có thể thiết kế và lưu dự án.',503);
   limit(req);if(body.accepted!==true)throw fail('Hãy xác nhận phương án và gửi thiết kế trước khi thanh toán.');const approved=approvedServiceDesign(body.design),customer=body.customer||{};
   const name=String(customer.name||'').trim().slice(0,120),phone=String(customer.phone||'').trim();if(!name||!/^\+?\d[\d\s.-]{7,18}$/.test(phone))throw fail('Hãy nhập tên và số điện thoại liên hệ hợp lệ.');
   let row=await store.findByToken(tokenHash);if(row){if(row.design_hash!==approved.digest)throw fail('Đơn trước đã gắn với phương án khác. Hãy kiểm tra đơn đó trước khi tạo đơn mới.',409);return reply(res,200,{ok:true,order:publicOrder(row)});}
   const id='bmh-'+crypto.randomUUID(),requestId=crypto.randomUUID();
   try{row=await store.insert({id,request_id:requestId,token_hash:tokenHash,amount:config.price,title:config.title,partner_code:config.momo.partnerCode,environment:config.momo.environment,order_info:config.title,design_hash:approved.digest,design_snapshot:approved.snapshot,project_name:String(approved.snapshot.project.name||'Ngôi nhà của mình').slice(0,120),customer_name:name,customer_phone:phone,status:'creating'});}catch(error){if(error.statusCode!==409)throw error;row=await store.findByToken(tokenHash);if(!row||row.design_hash!==approved.digest)throw fail('Đơn đang được tạo ở một cửa sổ khác.',409);return reply(res,200,{ok:true,order:publicOrder(row)});}
   // Persist ownership and the approved snapshot before contacting the provider.
   try{const result=await createPayment(providerOrder(row,config),config.momo);await store.link(row.id,result.payUrl);}catch{row=await store.get(row.id);return reply(res,202,{ok:true,order:publicOrder(row),notice:'Đã giữ mã đơn. Chưa xác nhận được phiên MoMo; hãy kiểm tra trạng thái trước khi tạo đơn khác.'});}
   return reply(res,200,{ok:true,order:publicOrder(await store.get(row.id))});
  }
  if(body.action==='recover'){const row=await store.findByToken(tokenHash);if(!row)throw fail('Chưa có đơn được lưu cho lần gửi này.',404);return reply(res,200,{ok:true,order:publicOrder(row)});}
  if(!ID.test(body.orderId||''))throw fail('Mã đơn không hợp lệ.');let row=await store.get(body.orderId,body.action==='receipt');if(!row||row.token_hash!==tokenHash)throw fail('Không tìm thấy đơn dịch vụ của bạn.',404);
  if(body.action==='status'){if(providerReady&&row.status!=='paid'&&row.environment===config.momo.environment){try{await store.result(row,await queryPayment(providerOrder(row,config),config.momo));row=await store.get(row.id);}catch{return reply(res,200,{ok:true,order:publicOrder(row),notice:'Chưa kiểm tra được MoMo. Trạng thái hiện tại được giữ nguyên.'});}}return reply(res,200,{ok:true,order:publicOrder(row)});}
  if(body.action==='receipt'){if(row.status!=='paid')throw fail('Đơn chưa được xác nhận thanh toán.',409);return reply(res,200,{ok:true,order:publicOrder(row),design:row.design_snapshot});}
  throw fail('Thao tác đơn dịch vụ không hợp lệ.');
 }catch(error){return reply(res,Number(error.statusCode)||500,{ok:false,error:error.statusCode?error.message:'Chưa xử lý được đơn dịch vụ. Vui lòng thử lại sau.'});}};
}
export default createGuestCheckoutHandler();
