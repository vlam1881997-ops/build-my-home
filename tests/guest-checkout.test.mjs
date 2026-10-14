import test from 'node:test';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {createGuestCheckoutHandler,guestCheckoutConfig,approvedServiceDesign} from '../server/_guest_checkout.mjs';
const token='a'.repeat(64),momo={environment:'sandbox',partnerCode:'BMHTEST',accessKey:'test-access',secretKey:'test-secret'},config={enabled:true,price:120000,title:'Dịch vụ BMH',publicOrigin:'https://bmh.example',momo};
const design={version:'test',access:{paid:true},project:{name:'Nhà đã chốt',site:{width:5,depth:20,floors:2},plan:{rooms:[{id:'living',floor:0,x:0,y:0,w:5,h:4,name:'Khách'}]},materials:{}}};
const request={action:'create',accepted:true,design,customer:{name:'Khách thử',phone:'0901234567'}};
function setup(overrides={}){
 const rows=new Map();let calls=0;
 const store={findByToken:async hash=>structuredClone([...rows.values()].find(r=>r.token_hash===hash)),get:async id=>structuredClone(rows.get(id)),insert:async row=>{if([...rows.values()].some(r=>r.token_hash===row.token_hash))throw Object.assign(Error('Conflict'),{statusCode:409});const value={...structuredClone(row),created_at:'2026-10-02T07:00:00Z'};rows.set(row.id,value);return structuredClone(value);},link:async(id,url)=>{const r=rows.get(id);if(r.status==='creating'){r.pay_url=url;r.status='pending';}},result:async(order,result)=>{const r=rows.get(order.id);if(r.status!=='paid'){r.status=result.paid?'paid':result.authorized?'authorized':'unpaid';r.trans_id=result.transId;r.paid_at=result.paid?'2026-10-02T07:01:00Z':null;}return structuredClone(r);}};
 const handler=createGuestCheckoutHandler({getConfig:()=>config,store,createPayment:async order=>{calls++;assert.ok(rows.has(order.orderId),'order is persisted before provider traffic');return {payUrl:'https://test-payment.momo.vn/v2/gateway/pay?t=test'};},queryPayment:async()=>({paid:false,resultCode:1006,transId:null,authorized:false}),...overrides});
 return {handler,rows,store,calls:()=>calls};
}
async function invoke(handler,body,owner=token,url='/api/ai?operation=checkout'){
 const res={statusCode:200,headers:{},status(n){this.statusCode=n;return this;},setHeader(k,v){this.headers[k]=v;return this;},end(text){this.text=text;}};await handler({method:'POST',url,headers:{authorization:owner?'Bearer '+owner:'','x-forwarded-for':crypto.randomUUID()},body},res);return {status:res.statusCode,body:res.text?JSON.parse(res.text):null,headers:res.headers};
}
test('guest service stays disabled until merchant, price, database migration and launch flags are all configured',()=>{
 const env={MOMO_PARTNER_CODE:'test',MOMO_ACCESS_KEY:'access',MOMO_SECRET_KEY:'secret',BMH_SERVICE_PRICE_VND:'120000',BMH_PUBLIC_URL:'https://bmh.example',SUPABASE_URL:'https://db.example',SUPABASE_SECRET_KEY:'db-secret',BMH_CHECKOUT_ENABLED:'true',BMH_GUEST_ORDERS_READY:'true'};assert.equal(guestCheckoutConfig(env).enabled,true);for(const key of ['MOMO_SECRET_KEY','BMH_SERVICE_PRICE_VND','BMH_PUBLIC_URL','SUPABASE_SECRET_KEY','BMH_CHECKOUT_ENABLED','BMH_GUEST_ORDERS_READY']){const copy={...env};delete copy[key];assert.equal(guestCheckoutConfig(copy).enabled,false,key);}assert.equal(guestCheckoutConfig({...env,BMH_PUBLIC_URL:'https://user:secret@bmh.example'}).enabled,false);
});
test('service creation stores an immutable approved design before payment and preserves guest ownership privately',async()=>{
 const c=setup(),result=await invoke(c.handler,request);assert.equal(result.status,200);assert.equal(result.body.order.paid,false);assert.equal(result.body.order.amount,config.price);assert.equal(result.body.order.sandbox,true);assert.equal(result.headers['Cache-Control'],'no-store');const row=c.rows.get(result.body.order.id);assert.equal('access'in row.design_snapshot,false);assert.notEqual(row.token_hash,token);assert.equal(JSON.stringify(result.body).includes('token_hash'),false);const original=structuredClone(row.design_snapshot);design.project.name='Nhà đã sửa sau khi chốt';assert.deepEqual(row.design_snapshot,original);design.project.name='Nhà đã chốt';assert.equal(c.calls(),1);
});
test('repeated and simultaneous creates share one stored order and one provider request',async()=>{
 const c=setup(),[a,b]=await Promise.all([invoke(c.handler,request),invoke(c.handler,request)]);assert.equal(a.body.order.id,b.body.order.id);assert.equal(c.rows.size,1);assert.equal(c.calls(),1);const again=await invoke(c.handler,request);assert.equal(again.body.order.id,a.body.order.id);assert.equal(c.calls(),1);const changed=structuredClone(request);changed.design.project.name='Changed';assert.equal((await invoke(c.handler,changed)).status,409);
});
test('uncertain provider results remain recoverable without creating or charging another order',async()=>{
 let calls=0;const c=setup({createPayment:async()=>{calls++;throw Error('timeout');}}),first=await invoke(c.handler,request);assert.equal(first.status,202);assert.equal(first.body.order.paid,false);const recovered=await invoke(c.handler,{action:'recover'});assert.equal(recovered.body.order.id,first.body.order.id);const retry=await invoke(c.handler,request);assert.equal(retry.body.order.id,first.body.order.id);assert.equal(calls,1);
});
test('another guest cannot inspect, reconcile or download a service order',async()=>{
 let query=0;const c=setup({queryPayment:async()=>{query++;return {paid:true};}}),first=await invoke(c.handler,request);for(const action of ['status','receipt'])assert.equal((await invoke(c.handler,{action,orderId:first.body.order.id},'b'.repeat(64))).status,404);assert.equal(query,0);assert.equal((await invoke(c.handler,{action:'receipt',orderId:first.body.order.id})).status,409);assert.equal((await invoke(c.handler,request,'')).status,401);
});
test('a trusted provider reconciliation confirms the saved order while unsigned redirect fields cannot grant access',async()=>{
 const c=setup({queryPayment:async()=>({paid:true,resultCode:0,transId:'123456',authorized:false})}),first=await invoke(c.handler,request),id=first.body.order.id;assert.equal((await invoke(c.handler,{action:'receipt',orderId:id,paid:true,resultCode:0})).status,409);const status=await invoke(c.handler,{action:'status',orderId:id});assert.equal(status.body.order.paid,true);const receipt=await invoke(c.handler,{action:'receipt',orderId:id});assert.equal(receipt.status,200);assert.equal(receipt.body.design.project.name,'Nhà đã chốt');assert.equal('access'in receipt.body.design,false);
});
function signedNotification(row,changes={}){const n={partnerCode:row.partner_code,orderId:row.id,requestId:row.request_id,amount:row.amount,orderInfo:row.order_info,extraData:'',orderType:'momo_wallet',payType:'qr',resultCode:0,transId:123456,responseTime:1790910000000,message:'Successful.',...changes};const raw=['accessKey','amount','extraData','message','orderId','orderInfo','orderType','partnerCode','payType','requestId','responseTime','resultCode','transId'].map(k=>k+'='+String(k==='accessKey'?momo.accessKey:n[k])).join('&');n.signature=crypto.createHmac('sha256',momo.secretKey).update(raw).digest('hex');return n;}
test('IPN verifies stored order fields, acknowledges committed results with 204 and preserves paid state on retries',async()=>{
 const c=setup(),created=await invoke(c.handler,request),id=created.body.order.id,row=c.rows.get(id),url='/api/ai?operation=checkout-notify';assert.equal((await invoke(c.handler,{...signedNotification(row),amount:1000},'',url)).status,400);assert.equal((await invoke(c.handler,signedNotification(row,{amount:1000}),'',url)).status,400);assert.equal(row.status,'pending');const paid=await invoke(c.handler,signedNotification(row),'',url);assert.equal(paid.status,204);assert.equal(paid.body,null);assert.equal(row.status,'paid');assert.equal((await invoke(c.handler,signedNotification(row),'',url)).status,204);assert.equal((await invoke(c.handler,signedNotification(row,{resultCode:1006}),'',url)).status,204);assert.equal(row.status,'paid');
});
test('turning off new checkout preserves access to already paid guest receipts',async()=>{
 let enabled=true;const c=setup({getConfig:()=>({...config,enabled}),queryPayment:async()=>({paid:true,resultCode:0,transId:'123456',authorized:false})}),created=await invoke(c.handler,request),id=created.body.order.id;await invoke(c.handler,{action:'status',orderId:id});enabled=false;assert.equal((await invoke(c.handler,{action:'receipt',orderId:id})).status,200);assert.equal((await invoke(c.handler,request,'c'.repeat(64))).status,503);
});
test('pausing new checkout still reconciles and accepts delayed notifications for existing orders',async()=>{
 let enabled=true;const c=setup({getConfig:()=>({...config,enabled}),queryPayment:async()=>({paid:true,resultCode:0,transId:'123456',authorized:false})});
 const first=await invoke(c.handler,request),second=await invoke(c.handler,request,'b'.repeat(64));enabled=false;
 assert.equal((await invoke(c.handler,{action:'status',orderId:first.body.order.id})).body.order.paid,true);
 assert.equal((await invoke(c.handler,signedNotification(c.rows.get(second.body.order.id)),'','/api/ai?operation=checkout-notify')).status,204);
 assert.equal((await invoke(c.handler,{action:'receipt',orderId:second.body.order.id},'b'.repeat(64))).status,200);
 assert.equal((await invoke(c.handler,request,'c'.repeat(64))).status,503);
});
test('guest checkout validates approval, contact data and measured geometry before any provider call',async()=>{
 const c=setup();for(const changes of [{accepted:false},{customer:{name:'',phone:'wrong'}},{design:{project:{site:{width:0}}}}])assert.equal((await invoke(c.handler,{...request,...changes})).status,400);assert.equal(c.calls(),0);assert.throws(()=>approvedServiceDesign({...design,project:{...design.project,plan:{rooms:[{floor:0,x:0,y:0,w:-1,h:1}]}}}));
});
