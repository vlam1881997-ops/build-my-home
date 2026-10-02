import crypto from 'node:crypto';

// Provider adapter only. Checkout remains disabled until the guest order store,
// fulfillment and merchant sandbox transaction have been verified together.
// Contracts: developers.momo.vn/v3/docs/payment/api/wallet/onetime/ and
// developers.momo.vn/v3/docs/payment/api/result-handling/notification/.
const GATEWAYS={sandbox:'https://test-payment.momo.vn',production:'https://payment.momo.vn'};
const CREATE_KEYS=['accessKey','amount','extraData','ipnUrl','orderId','orderInfo','partnerCode','redirectUrl','requestId','requestType'];
const RESULT_KEYS=['accessKey','amount','extraData','message','orderId','orderInfo','orderType','partnerCode','payType','requestId','responseTime','resultCode','transId'];
const RESPONSE_KEYS=['accessKey','amount','orderId','partnerCode','payUrl','requestId','responseTime','resultCode'];
const QUERY_KEYS=['accessKey','orderId','partnerCode','requestId'];
const error=(message,statusCode=400)=>Object.assign(new Error(message),{statusCode});
const amountValid=value=>(typeof value==='number'||typeof value==='string'&&/^\d+$/.test(value))&&Number.isSafeInteger(Number(value))&&Number(value)>=1000&&Number(value)<=50000000;
const identifier=(value,max)=>typeof value==='string'&&value.length<=max&&/^[0-9a-zA-Z]([-_.]*[0-9a-zA-Z]+)*$/.test(value);
function requireConfig(config){
 if(!GATEWAYS[config?.environment]||!config.partnerCode||!config.accessKey||!config.secretKey)throw error('MoMo chưa được cấu hình cho môi trường này.',503);
}
export function momoEnv(env=process.env){
 const environment=String(env.MOMO_ENVIRONMENT||'sandbox');
 return {environment,partnerCode:String(env.MOMO_PARTNER_CODE||'').trim(),accessKey:String(env.MOMO_ACCESS_KEY||'').trim(),secretKey:String(env.MOMO_SECRET_KEY||'').trim()};
}
export function momoSignature(payload,keys,config){
 requireConfig(config);
 const raw=keys.map(key=>key+'='+String(key==='accessKey'?config.accessKey:payload[key]??'')).join('&');
 return crypto.createHmac('sha256',config.secretKey).update(raw,'utf8').digest('hex');
}
function signatureMatches(payload,keys,config){
 if(typeof payload?.signature!=='string'||!/^[a-fA-F0-9]{64}$/.test(payload.signature))return false;
 const expected=Buffer.from(momoSignature(payload,keys,config),'hex'),actual=Buffer.from(payload.signature,'hex');return crypto.timingSafeEqual(expected,actual);
}
export function momoCreatePayload(order,config){
 requireConfig(config);
 if(!identifier(order?.orderId,200)||!identifier(order?.requestId,50)||!amountValid(order.amount))throw error('Mã đơn hoặc số tiền dịch vụ không hợp lệ.');
 if(typeof order.orderInfo!=='string'||!order.orderInfo.trim()||order.orderInfo.length>255)throw error('Nội dung đơn dịch vụ không hợp lệ.');
 let origin;try{origin=new URL(order.publicOrigin);}catch{throw error('Chưa cấu hình URL công khai của BMH.',503);}
 if(origin.protocol!=='https:'||origin.username||origin.password||origin.pathname!=='/'||origin.search||origin.hash)throw error('URL công khai của BMH cần là HTTPS và không chứa tham số.',503);
 const payload={partnerCode:config.partnerCode,requestId:order.requestId,orderId:order.orderId,amount:Number(order.amount),orderInfo:order.orderInfo,redirectUrl:origin.origin+'/?momoReturn='+encodeURIComponent(order.orderId),ipnUrl:origin.origin+'/api/momo/notify',requestType:'captureWallet',extraData:'',autoCapture:true,lang:'vi'};
 payload.signature=momoSignature(payload,CREATE_KEYS,config);return payload;
}
export function momoQueryPayload(orderId,requestId,config){
 requireConfig(config);if(!identifier(orderId,200)||!identifier(requestId,50))throw error('Mã tra cứu không hợp lệ.');
 const payload={partnerCode:config.partnerCode,orderId,requestId,lang:'vi'};payload.signature=momoSignature(payload,QUERY_KEYS,config);return payload;
}
export function momoNotificationOutcome(notification,order,config){
 requireConfig(config);
 if(!signatureMatches(notification,RESULT_KEYS,config))throw error('Chữ ký kết quả MoMo không hợp lệ.');
 if(!order||notification.partnerCode!==config.partnerCode||notification.partnerCode!==order.partnerCode||notification.orderId!==order.orderId||notification.requestId!==order.requestId||notification.orderInfo!==order.orderInfo||String(notification.extraData??'')!==String(order.extraData??'')||!amountValid(notification.amount)||Number(notification.amount)!==Number(order.amount))throw error('Kết quả MoMo không khớp với đơn đã lưu.');
 if(!Number.isInteger(notification.resultCode)||notification.orderType!=='momo_wallet'||!Number.isSafeInteger(notification.responseTime)||notification.responseTime<=0)throw error('Kết quả MoMo thiếu dữ liệu xác nhận.');
 const paid=notification.resultCode===0;
 if(paid&&!/^[1-9]\d{0,22}$/.test(String(notification.transId)))throw error('Kết quả thành công thiếu mã giao dịch MoMo.');
 return {paid,resultCode:notification.resultCode,transId:paid?String(notification.transId):null,authorized:notification.resultCode===9000};
}
export async function createMomoPayment(order,config=momoEnv(),fetcher=fetch){
 const payload=momoCreatePayload(order,config);let response,data;
 try{response=await fetcher(GATEWAYS[config.environment]+'/v2/gateway/api/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(35000),redirect:'error'});data=await response.json();}
 catch{throw error('Chưa nhận được phản hồi MoMo. Giữ nguyên mã đơn để kiểm tra trạng thái trước khi thử lại.',502);}
 if(!response.ok||data?.resultCode!==0)throw error('MoMo chưa tạo được phiên thanh toán. Đơn dịch vụ chưa được xác nhận thanh toán.',502);
 if(data.partnerCode!==payload.partnerCode||data.orderId!==payload.orderId||data.requestId!==payload.requestId||Number(data.amount)!==payload.amount||!signatureMatches(data,RESPONSE_KEYS,config))throw error('Phản hồi tạo đơn MoMo không hợp lệ.',502);
 let payUrl;try{payUrl=new URL(data.payUrl);}catch{throw error('MoMo không trả về đường dẫn thanh toán hợp lệ.',502);}
 if(payUrl.origin!==GATEWAYS[config.environment]||payUrl.username||payUrl.password)throw error('Đường dẫn thanh toán không thuộc môi trường MoMo đã chọn.',502);
 // An accepted create request is still unpaid. Only a verified result can
 // advance a persisted order; redirect query parameters cannot grant access.
 return {orderId:payload.orderId,requestId:payload.requestId,amount:payload.amount,payUrl:payUrl.href,paid:false};
}

export async function queryMomoPayment(order,config=momoEnv(),fetcher=fetch){
 const payload=momoQueryPayload(order.orderId,crypto.randomUUID(),config);let response,data;
 try{response=await fetcher(GATEWAYS[config.environment]+'/v2/gateway/api/query',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(35000),redirect:'error'});data=await response.json();}catch{throw error('Chưa kiểm tra được giao dịch MoMo. Vui lòng thử lại sau.',502);}
 if(!response.ok||data?.partnerCode!==config.partnerCode||data.orderId!==order.orderId||data.requestId!==payload.requestId||!amountValid(data.amount)||Number(data.amount)!==Number(order.amount)||!Number.isInteger(data.resultCode))throw error('Kết quả tra cứu MoMo không khớp với đơn dịch vụ.',502);
 if(data.resultCode===0&&!/^[1-9]\d{0,22}$/.test(String(data.transId)))throw error('Tra cứu MoMo thiếu mã giao dịch thành công.',502);
 return {paid:data.resultCode===0,resultCode:data.resultCode,transId:data.resultCode===0?String(data.transId):null,authorized:data.resultCode===9000};
}
