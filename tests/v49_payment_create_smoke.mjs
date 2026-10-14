import assert from 'node:assert/strict';
import createPayment from '../api/payment-create.mjs';
import {canonical,hmacHex} from '../api/_lib.mjs';

process.env.SUPABASE_URL='https://unit-test.supabase.co';
process.env.SUPABASE_PUBLISHABLE_KEY='sb_publishable_unit_test';
process.env.SUPABASE_SECRET_KEY='sb_secret_unit_test';
process.env.PAYOS_CLIENT_ID='client-test';
process.env.PAYOS_API_KEY='api-test-secret';
process.env.PAYOS_CHECKSUM_KEY='checksum-test-secret';
process.env.BMH_PUBLIC_URL='https://bmh.example';

function responseJson(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json'}});}
function makeRes(){return {statusCode:200,headers:{},body:'',status(n){this.statusCode=n;return this;},setHeader(k,v){this.headers[k]=v;return this;},end(v=''){this.body=String(v);return this;}};}
const calls=[];
globalThis.fetch=async (url,opts={})=>{
  calls.push({url:String(url),method:opts.method||'GET',headers:opts.headers||{},body:opts.body});
  const u=String(url);
  if(u.endsWith('/auth/v1/user'))return responseJson({id:'11111111-1111-4111-8111-111111111111',email:'user@example.com'});
  if(u.includes('/rest/v1/bmh_payments?on_conflict=order_code'))return responseJson([],201);
  if(u==='https://api-merchant.payos.vn/v2/payment-requests')return responseJson({code:'00',desc:'success',data:{paymentLinkId:'pl_1',checkoutUrl:'https://pay.payos.vn/web/pl_1',qrCode:'QRDATA'}});
  if(u.includes('/rest/v1/bmh_payments?order_code=eq.')&&opts.method==='PATCH')return responseJson([],200);
  throw new Error(`Unexpected fetch ${u}`);
};
const req={method:'POST',headers:{authorization:'Bearer user-jwt'},body:{product:'bmh-premium'}};
const res=makeRes();await createPayment(req,res);const out=JSON.parse(res.body);
assert.equal(res.statusCode,200);assert.equal(out.amount,99000);assert.equal(out.checkoutUrl,'https://pay.payos.vn/web/pl_1');assert.ok(Number.isSafeInteger(out.orderCode));
const payCall=calls.find(c=>c.url==='https://api-merchant.payos.vn/v2/payment-requests');assert.ok(payCall,'payOS API not called');assert.equal(payCall.headers['x-client-id'],'client-test');assert.equal(payCall.headers['x-api-key'],'api-test-secret');const body=JSON.parse(payCall.body);const expected=hmacHex(canonical({amount:body.amount,cancelUrl:body.cancelUrl,description:body.description,orderCode:body.orderCode,returnUrl:body.returnUrl}),process.env.PAYOS_CHECKSUM_KEY);assert.equal(body.signature,expected);assert.equal(body.returnUrl.startsWith('https://bmh.example/?payment=success&orderCode='),true);assert.equal(body.cancelUrl.startsWith('https://bmh.example/?payment=cancel&orderCode='),true);
assert.equal(JSON.stringify(out).includes(process.env.PAYOS_API_KEY),false);assert.equal(JSON.stringify(out).includes(process.env.PAYOS_CHECKSUM_KEY),false);
console.log('V4.9 payment-create handler smoke: PASS');
