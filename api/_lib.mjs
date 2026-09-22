import crypto from 'node:crypto';

export const PRODUCT_CODE='bmh-premium';
export const PAYMENT_AMOUNT=99000;

export function send(res,status,payload){res.status(status).setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(payload));}
export function allow(res){res.setHeader('Allow','GET,POST,DELETE,OPTIONS');}
export async function jsonBody(req){if(req.body&&typeof req.body==='object')return req.body;let raw='';for await(const chunk of req)raw+=chunk; if(!raw)return {};try{return JSON.parse(raw);}catch{throw Object.assign(new Error('JSON không hợp lệ.'),{statusCode:400});}}
export function supabaseEnv(){return {url:String(process.env.SUPABASE_URL||'').replace(/\/$/,''),publishable:String(process.env.SUPABASE_PUBLISHABLE_KEY||process.env.SUPABASE_ANON_KEY||''),secret:String(process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY||'')};}
export function payosEnv(){return {clientId:String(process.env.PAYOS_CLIENT_ID||''),apiKey:String(process.env.PAYOS_API_KEY||''),checksumKey:String(process.env.PAYOS_CHECKSUM_KEY||'')};}
export function bearer(req){const h=String(req.headers?.authorization||'');return h.toLowerCase().startsWith('bearer ')?h.slice(7).trim():'';}
function keyHeaders(key,token=''){const h={'Content-Type':'application/json','apikey':key};if(token)h.Authorization=`Bearer ${token}`;else if(key&&key.startsWith('eyJ'))h.Authorization=`Bearer ${key}`;return h;}
export async function supabaseFetch(path,{method='GET',body,token='',admin=false,headers={}}={}){const cfg=supabaseEnv(),key=admin?cfg.secret:cfg.publishable;if(!cfg.url||!key)throw Object.assign(new Error(admin?'Cloud backend chưa cấu hình SUPABASE_SECRET_KEY.':'Cloud backend chưa cấu hình Supabase URL/key.'),{statusCode:503});const r=await fetch(`${cfg.url}${path}`,{method,headers:{...keyHeaders(key,token),...headers},body:body===undefined?undefined:JSON.stringify(body)});let data=null;const text=await r.text();if(text){try{data=JSON.parse(text);}catch{data={message:text};}}if(!r.ok){const message=data?.msg||data?.message||data?.error_description||data?.error||`Supabase HTTP ${r.status}`;throw Object.assign(new Error(message),{statusCode:r.status,details:data});}return data;}
export async function authUser(req){const token=bearer(req);if(!token)throw Object.assign(new Error('Bạn cần đăng nhập.'),{statusCode:401});const user=await supabaseFetch('/auth/v1/user',{token});if(!user?.id)throw Object.assign(new Error('Phiên đăng nhập không hợp lệ.'),{statusCode:401});return {user,token};}
export function requestOrigin(req){const configured=String(process.env.BMH_PUBLIC_URL||'').replace(/\/$/,'');if(/^https?:\/\//i.test(configured))return configured;const origin=String(req.headers?.origin||'');if(/^https?:\/\//i.test(origin))return origin.replace(/\/$/,'');const proto=String(req.headers?.['x-forwarded-proto']||'https').split(',')[0];const host=String(req.headers?.['x-forwarded-host']||req.headers?.host||'').split(',')[0];return host?`${proto}://${host}`:'';}
export function canonical(obj){return Object.keys(obj||{}).sort().map(k=>`${k}=${valueString(obj[k])}`).join('&');}
function valueString(v){if(v===null||v===undefined)return '';if(typeof v==='object')return JSON.stringify(v);return String(v);}
export function hmacHex(data,key){return crypto.createHmac('sha256',key).update(data,'utf8').digest('hex');}
export function safeHexEqual(a,b){const aa=Buffer.from(String(a||'').toLowerCase(),'utf8'),bb=Buffer.from(String(b||'').toLowerCase(),'utf8');return aa.length===bb.length&&crypto.timingSafeEqual(aa,bb);}
export function payosCreateSignature(payload,checksumKey){const signed={amount:payload.amount,cancelUrl:payload.cancelUrl,description:payload.description,orderCode:payload.orderCode,returnUrl:payload.returnUrl};return hmacHex(canonical(signed),checksumKey);}
export function payosWebhookValid(payload,checksumKey){return !!payload?.data&&safeHexEqual(hmacHex(canonical(payload.data),checksumKey),payload.signature);}
export function apiError(res,err){const status=Number(err?.statusCode)||500;send(res,status,{ok:false,error:err?.message||'Lỗi máy chủ.',details:status<500?err?.details||undefined:undefined});}
