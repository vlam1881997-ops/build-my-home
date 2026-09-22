import {send} from './_lib.mjs';
import {geminiEnv,geminiRateLimit} from './_gemini.mjs';

function extractImage(data){
  if(data?.output_image?.data)return {data:data.output_image.data,mimeType:data.output_image.mime_type||'image/jpeg'};
  for(const step of data?.steps||[])for(const c of step?.content||[])if(c?.type==='image'&&c?.data)return {data:c.data,mimeType:c.mime_type||'image/jpeg'};
  for(const out of data?.outputs||[])if(out?.type==='image'&&out?.data)return {data:out.data,mimeType:out.mime_type||'image/jpeg'};
  return null;
}
export default async function handler(req,res){
  if(req.method==='OPTIONS')return send(res,200,{ok:true});
  if(req.method!=='POST')return send(res,405,{ok:false,error:'Method not allowed'});
  try{
    geminiRateLimit(req,{bucket:'cinematic',max:10,windowMs:60*60*1000});
    const env=geminiEnv();if(!env.key)return send(res,503,{ok:false,error:'Chưa cấu hình GEMINI_API_KEY trên server.'});
    const image=String(req.body?.image||'');if(!image.startsWith('data:image/'))return send(res,400,{ok:false,error:'Thiếu ảnh chụp mô hình 3D.'});
    const m=image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);if(!m)return send(res,400,{ok:false,error:'Ảnh 3D không hợp lệ.'});
    const p=req.body?.project||{},model=String(process.env.GEMINI_IMAGE_MODEL||'gemini-3.1-flash-image').trim();
    const prompt=`Bạn là kiến trúc sư diễn họa cao cấp. Hãy biến ảnh chụp mô hình 3D kỹ thuật được cung cấp thành một phối cảnh kiến trúc điện ảnh nhưng PHẢI GIỮ bố cục khối, số tầng, tỷ lệ mặt tiền và vị trí các khối chính gần nhất có thể. Không tự thêm tầng. Không biến nhà phố thành biệt thự rộng.\nThông tin dự án: phong cách ${p.style||'Hiện đại'}, khu đất ${p.site?.width||5}m x ${p.site?.depth||20}m, ${p.site?.floors||2} tầng, mặt tiền hướng ${p.site?.frontDirection||'Nam'}, khu vực ${p.site?.province||'Việt Nam'}.\nVật liệu: ${JSON.stringify(p.materials||{})}.\nYêu cầu hình ảnh: nhà phố cao cấp, tỷ lệ thực tế, ánh sáng tự nhiên ấm, cây xanh vừa phải, vật liệu kính/đá/gỗ tinh tế, không chèn chữ, không watermark, không người, góc máy kiến trúc 3/4 ở tầm mắt, photorealistic. Đây chỉ là phối cảnh cảm xúc, không phải bản vẽ kỹ thuật.`;
    const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),90000);
    const r=await fetch('https://generativelanguage.googleapis.com/v1beta/interactions',{method:'POST',signal:ctl.signal,headers:{'Content-Type':'application/json','x-goog-api-key':env.key},body:JSON.stringify({model,input:[{type:'image',mime_type:m[1],data:m[2]},{type:'text',text:prompt}],store:false,response_format:{type:'image',mime_type:'image/jpeg',aspect_ratio:'16:9',image_size:'1K'}})}).finally(()=>clearTimeout(timer));
    const raw=await r.text();let data={};try{data=JSON.parse(raw);}catch{data={raw};}
    if(!r.ok)return send(res,r.status>=400&&r.status<500?r.status:502,{ok:false,error:data?.error?.message||`Gemini render HTTP ${r.status}`});
    const out=extractImage(data);if(!out)return send(res,502,{ok:false,error:'Gemini chưa trả về ảnh phối cảnh.'});
    return send(res,200,{ok:true,image:out.data,mimeType:out.mimeType,model});
  }catch(err){return send(res,err?.name==='AbortError'?504:(err?.statusCode||500),{ok:false,error:err?.name==='AbortError'?'Gemini render quá thời gian cho phép.':(err?.message||'Không thể tạo phối cảnh.')});}
}
