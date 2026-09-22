import assert from 'node:assert/strict';
import {hmacHex,canonical} from '../api/_lib.mjs';
import webhookHandler from '../api/payment-webhook.mjs';

process.env.SUPABASE_URL='https://unit-test.supabase.co';
process.env.SUPABASE_SECRET_KEY='sb_secret_unit_test';
process.env.PAYOS_CHECKSUM_KEY='unit-test-checksum';

function responseJson(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json'}});}
function makeRes(){return {statusCode:200,headers:{},body:'',status(n){this.statusCode=n;return this;},setHeader(k,v){this.headers[k]=v;return this;},end(v=''){this.body=String(v);return this;}};}
const calls=[];
globalThis.fetch=async (url,opts={})=>{calls.push({url:String(url),method:opts.method||'GET',body:opts.body});if(String(url).includes('/rest/v1/bmh_payments?select='))return responseJson([{order_code:987654,user_id:'11111111-1111-4111-8111-111111111111',amount:99000,status:'pending'}]);if(String(url).includes('/rest/v1/bmh_payments?order_code=eq.987654')&&opts.method==='PATCH')return responseJson([],200);if(String(url).includes('/rest/v1/bmh_entitlements?on_conflict='))return responseJson([],201);throw new Error(`Unexpected fetch ${url}`);};

const data={orderCode:987654,amount:99000,description:'BMH00987654',accountNumber:'12345678',reference:'REF001',transactionDateTime:'2026-09-22 08:00:00',currency:'VND',paymentLinkId:'link123',code:'00',desc:'Thành công',counterAccountBankId:'',counterAccountBankName:'',counterAccountName:'',counterAccountNumber:'',virtualAccountName:'',virtualAccountNumber:''};
const req={method:'POST',headers:{},body:{code:'00',desc:'success',success:true,data,signature:hmacHex(canonical(data),process.env.PAYOS_CHECKSUM_KEY)}};
const res=makeRes();await webhookHandler(req,res);const out=JSON.parse(res.body);assert.equal(res.statusCode,200);assert.equal(out.paid,true);assert.ok(calls.some(c=>c.url.includes('/bmh_entitlements?on_conflict=')),'Entitlement upsert missing');assert.ok(calls.some(c=>c.method==='PATCH'&&c.url.includes('/bmh_payments?order_code=eq.987654')),'Payment paid update missing');

calls.length=0;const badReq={...req,body:{...req.body,signature:'00'.repeat(32)}};const badRes=makeRes();await webhookHandler(badReq,badRes);assert.equal(badRes.statusCode,400);assert.equal(calls.length,0,'Invalid signature must be rejected before database access');
console.log('V4.9 webhook handler smoke: PASS');
