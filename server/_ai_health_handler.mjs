import {send,apiError} from './_lib.mjs';
import {geminiEnv,geminiRateLimit} from './_gemini.mjs';
export const maxDuration=15;
export default async function handler(req,res){
 try{if(req.method!=='POST')return send(res,405,{ok:false,error:'Method not allowed'});geminiRateLimit(req,{bucket:'ai-health',max:12});const e=geminiEnv();if(!e.key)return send(res,503,{ok:false,error:'Server chưa có GEMINI_API_KEY. .env.local chỉ áp dụng khi chạy local; Vercel cần biến môi trường riêng.'});const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),10000);try{const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=100',{headers:{'x-goog-api-key':e.key},signal:ctl.signal});if(!r.ok)return send(res,r.status===401||r.status===403?403:502,{ok:false,error:'Gemini chưa chấp nhận kết nối (HTTP '+r.status+'). Kiểm tra key, quyền API và dự án Google.'});send(res,200,{ok:true,keyAccepted:true,message:'Google đã chấp nhận key server. Quét tệp và tạo ảnh vẫn cần kiểm tra riêng về model và quota.'});}finally{clearTimeout(timer);}}catch(e){apiError(res,e.name==='AbortError'?Object.assign(Error('Kiểm tra Gemini hết thời gian.'),{statusCode:504}):e);}
}
