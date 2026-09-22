import assert from 'node:assert/strict';
import {canonical,hmacHex,payosCreateSignature,payosWebhookValid,PAYMENT_AMOUNT} from '../api/_lib.mjs';
assert.equal(PAYMENT_AMOUNT,99000);
assert.equal(canonical({b:2,a:1}),'a=1&b=2');
const key='test-checksum-key';
const req={orderCode:123,amount:99000,description:'BMH00000123',returnUrl:'https://example.com/?payment=success',cancelUrl:'https://example.com/?payment=cancel'};
assert.equal(payosCreateSignature(req,key),hmacHex('amount=99000&cancelUrl=https://example.com/?payment=cancel&description=BMH00000123&orderCode=123&returnUrl=https://example.com/?payment=success',key));
const data={orderCode:123,amount:99000,description:'BMH00000123',code:'00'};const body={data,signature:hmacHex(canonical(data),key)};assert.equal(payosWebhookValid(body,key),true);body.data.amount=1;assert.equal(payosWebhookValid(body,key),false);

const officialKey='1a54716c8f0efb2744fb28b6e38b25da7f67a925d98bc1c18bd8faaecadd7675';
const officialData={orderCode:123,amount:3000,description:'VQRIO123',accountNumber:'12345678',reference:'TF230204212323',transactionDateTime:'2023-02-04 18:25:00',currency:'VND',paymentLinkId:'124c33293c43417ab7879e14c8d9eb18',code:'00',desc:'Thành công',counterAccountBankId:'',counterAccountBankName:'',counterAccountName:'',counterAccountNumber:'',virtualAccountName:'',virtualAccountNumber:''};
assert.equal(hmacHex(canonical(officialData),officialKey),'412e915d2871504ed31be63c8f62a149a4410d34c4c42affc9006ef9917eaa03','Must match payOS official webhook signature sample');

console.log('V4.9 API crypto smoke: PASS');
