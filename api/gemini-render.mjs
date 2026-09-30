import {send,apiError} from '../server/_lib.mjs';
import {geminiEnv,geminiRateLimit} from '../server/_gemini.mjs';
import {resolveGeminiModels} from '../server/_gemini_models.mjs';

export const maxDuration=60;
const MAX_BODY=1_800_000;
const cut=(value,max=80)=>String(value||'').replace(/[\r\n\t]+/g,' ').trim().slice(0,max);

async function limitedBody(req){
  if(req.body&&typeof req.body==='object'){
    if(Buffer.byteLength(JSON.stringify(req.body))>MAX_BODY)throw Object.assign(new Error('Ảnh tham chiếu quá lớn.'),{statusCode:413});
    return req.body;
  }
  const chunks=[];let size=0;
  for await(const chunk of req){size+=chunk.length;if(size>MAX_BODY)throw Object.assign(new Error('Ảnh tham chiếu quá lớn.'),{statusCode:413});chunks.push(chunk);}
  try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}
  catch{throw Object.assign(new Error('JSON không hợp lệ.'),{statusCode:400});}
}

export function renderRequestPayload(body={}){
  const match=/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(String(body.image||''));
  if(!match||match[2].length<100||match[2].length>1_500_000)throw Object.assign(new Error('Cần ảnh chụp mô hình 3D JPEG/PNG/WEBP hợp lệ.'),{statusCode:400});
  const project=body.project&&typeof body.project==='object'?body.project:{},site=project.site||{},materials=project.materials||{};
  const floors=Math.max(1,Math.min(8,Math.round(Number(site.floors)||1))),width=Math.max(2,Math.min(30,Number(site.width)||5)),depth=Math.max(4,Math.min(80,Number(site.depth)||20));
  const selected=Object.entries(materials.choices||{}).slice(0,16).map(([type,id])=>`${cut(type,30)}: ${cut(id,60)}`);
  const rooms=(Array.isArray(project.rooms)?project.rooms:[]).slice(0,40).map(x=>`${cut(x.name,40)} tầng ${Math.max(1,Math.min(floors,(Number(x.floor)||0)+1))}, vị trí (${Number(x.x)||0},${Number(x.y)||0}), ${Number(x.w)||0}m x ${Number(x.h)||0}m`).join('; ');
  const openings=(project.openings||[]).slice(0,80).map(o=>`${cut(o.roomId,40)}: ${cut(o.kind,12)} ${cut(o.side,12)}, vị trí ${Number(o.offset)||0}, rộng ${Number(o.width)||0}m, cao ${Number(o.height)||2.1}m`).join('; ');
  const style=cut(project.style,100)||'modern';
  const classical=/tân cổ điển|tan co dien|neoclassic|classical|cổ điển|co dien/i.test(style);
  const styleDetail=classical?'If consistent with the actual plot and chosen materials, use restrained Vietnamese neoclassical villa details: light stucco, articulated columns, dark tiled hip roof, realistic eaves, balcony railings, framed windows, entry steps and planting. Keep all details proportionate to the plot; never copy a different house or invent space outside the lot.':'Use the architectural language described by the project style, without applying a generic villa facade.';
  const view=project.view||{},kind=['room','floor','house'].includes(view.kind)?view.kind:'house';
  const subject=kind==='room'?`interior of ${cut(view.roomName,40)||'the selected room'} (${cut(view.roomType,30)||'room'}) on floor ${Math.max(1,(Number(view.floor)||0)+1)}`:kind==='floor'?`cutaway interior view of floor ${Math.max(1,(Number(view.floor)||0)+1)}`:`exterior and overall massing of the home`;
  const prompt=`Create ONE photorealistic architectural visualization of the ${subject} shown in the reference image. The project has ${floors} floors. ${project.referenceKind==='drawing'?'Use the architectural floor plan as a layout guide. Choose a front exterior camera for house views or a clear interior camera for room views.':'Use the 3D screenshot as the camera and geometry guide.'} Keep room positions, openings, dimensions and floor count consistent with the plan; do not add rooms, doors, windows or floors. Plot ${width}m x ${depth}m. Style: ${style}; design language: ${cut(project.styleDescription,240)}; facade orientation: ${cut(site.frontDirection,30)||'unspecified'}. ${styleDetail} Selected material choices: ${selected.join('; ')||'not specified'}. Rooms in the plan: ${rooms||'not yet planned'}. Openings: ${openings||'not specified'}. Floor-to-floor height: ${Number(site.floorHeight)||3.4} m. Realistic material textures and natural daylight; show furniture and landscaping only when appropriate to this view. Do not claim an exact manufacturer's product texture from a generic material name. No text, labels, logos, watermarks or measurement marks. This is an illustrative concept; do not imply construction accuracy.`;
  return {mimeType:match[1],image:match[2],prompt};
}

export function extractRenderedImage(result){
  for(const part of result?.outputs||[])if(part?.type==='image'&&/^image\/(?:png|jpeg|webp)$/.test(part.mime_type||'')&&typeof part.data==='string'&&part.data.length>100)return {image:part.data,mimeType:part.mime_type};
  for(const step of result?.steps||[])for(const part of step?.content||[]){
    if(part?.type==='image'&&/^image\/(?:png|jpeg|webp)$/.test(part.mime_type||'')&&typeof part.data==='string'&&part.data.length>100)return {image:part.data,mimeType:part.mime_type};
  }
  for(const candidate of result?.candidates||[])for(const part of candidate?.content?.parts||[]){
    const image=part?.inlineData||part?.inline_data,mime=image?.mimeType||image?.mime_type;
    if(/^image\/(?:png|jpeg|webp)$/.test(mime||'')&&typeof image?.data==='string'&&image.data.length>100)return {image:image.data,mimeType:mime};
  }
  throw Object.assign(new Error('Gemini không trả về ảnh phối cảnh.'),{statusCode:502});
}

export default async function handler(req,res){
  try{
    if(req.method!=='POST')return send(res,405,{ok:false,error:'Method not allowed'});
    if(process.env.GEMINI_IMAGE_ENABLED==='false')return send(res,503,{ok:false,error:'Chưa bật dịch vụ ảnh AI. Mô hình 3D tương tác vẫn dùng miễn phí; chủ dự án có thể bật GEMINI_IMAGE_ENABLED=true khi đã cấu hình tài khoản Gemini có tính phí.'});
    const key=geminiEnv().key;if(!key)return send(res,503,{ok:false,error:'Chưa cấu hình GEMINI_API_KEY trên server.'});
    const {mimeType,image,prompt}=renderRequestPayload(await limitedBody(req));
    geminiRateLimit(req,{bucket:'image-render',max:12,windowMs:60*60*1000});
    const models=await resolveGeminiModels(geminiEnv(),{kind:'image'});
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),55_000);
    try{
      for(const model of models){
      let response=await fetch('https://generativelanguage.googleapis.com/v1beta/interactions',{
        method:'POST',signal:controller.signal,headers:{'x-goog-api-key':key,'Content-Type':'application/json'},
        body:JSON.stringify({model,store:false,input:[{type:'text',text:prompt},{type:'image',mime_type:mimeType,data:image}],response_format:{type:'image',aspect_ratio:'16:9',image_size:'1K'}})
      });
      let data=await response.json().catch(()=>({}));
      // A listed image model may expose generateContent before Interactions.
      if([400,404].includes(response.status)){
        response=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':generateContent',{method:'POST',signal:controller.signal,headers:{'x-goog-api-key':key,'Content-Type':'application/json'},body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt},{inlineData:{mimeType,data:image}}]}],generationConfig:{responseModalities:['TEXT','IMAGE']}})});
        data=await response.json().catch(()=>({}));
      }
      if([400,404].includes(response.status)&&model!==models.at(-1))continue;
      if(!response.ok)throw Object.assign(new Error(response.status===429?'Giới hạn tạo ảnh hoặc tài khoản Gemini chưa có quota ảnh.':`Gemini trả về lỗi ${response.status}. Kiểm tra cấu hình và quota ảnh.`),{statusCode:response.status===429?429:502});
      const rendered=extractRenderedImage(data);
      return send(res,200,{ok:true,...rendered,model,generatedAt:new Date().toISOString()});
      }
    }finally{clearTimeout(timer);}
  }catch(error){
    apiError(res,error?.name==='AbortError'?Object.assign(new Error('Tạo phối cảnh quá thời gian cho phép.'),{statusCode:504}):error);
  }
}
