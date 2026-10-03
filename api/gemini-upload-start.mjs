import {requireAiAccount} from '../server/_ai_usage.mjs';
import {aiFilePrefix} from '../server/_ai_files.mjs';
import {send,jsonBody,apiError} from '../server/_lib.mjs';
import {geminiStartUpload,geminiRateLimit} from '../server/_gemini.mjs';

const ALLOWED=/^(image\/(png|jpeg|webp|heic|heif)|video\/(mp4|quicktime|webm|mpeg)|application\/pdf)$/i;
const MAX_MEDIA_BYTES=250*1024*1024,MAX_PDF_BYTES=50*1024*1024;
export default async function handler(req,res){
  try{
    if(req.method==='OPTIONS')return send(res,200,{ok:true});
    if(req.method!=='POST')return send(res,405,{ok:false,error:'Method not allowed'});
    geminiRateLimit(req,{bucket:'upload-start',max:12});
    const account=await requireAiAccount(req);
    const body=await jsonBody(req),mimeType=String(body.mime_type||'').toLowerCase(),size=Number(body.size)||0;
    if(!ALLOWED.test(mimeType))return send(res,400,{ok:false,error:'Chỉ hỗ trợ ảnh, MP4/MOV/WebM/MPEG và PDF.'});
    const maxBytes=mimeType==='application/pdf'?MAX_PDF_BYTES:MAX_MEDIA_BYTES;
    if(size<=0||size>maxBytes)return send(res,400,{ok:false,error:mimeType==='application/pdf'?'PDF không vượt 50MB.':'Tệp media không vượt 250MB.'});
    const displayName=(account?aiFilePrefix(account.user):'')+String(body.name||'build-my-home-scan').replace(/[\r\n]/g,' ').slice(0,100);
    const uploadUrl=await geminiStartUpload({displayName,mimeType,size});
    return send(res,200,{ok:true,uploadUrl,maxBytes});
  }catch(err){apiError(res,err);}
}
