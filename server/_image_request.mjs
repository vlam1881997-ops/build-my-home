export const IMAGE_BODY_LIMIT=1_800_000;

export async function imageRequestBody(req){
  if(req.body&&typeof req.body==='object'){
    if(Buffer.byteLength(JSON.stringify(req.body))>IMAGE_BODY_LIMIT)throw Object.assign(new Error('Ảnh quá lớn. Hãy chọn ảnh dung lượng nhỏ hơn.'),{statusCode:413});
    return req.body;
  }
  const chunks=[];let size=0;
  for await(const chunk of req){size+=Buffer.byteLength(chunk);if(size>IMAGE_BODY_LIMIT)throw Object.assign(new Error('Ảnh quá lớn. Hãy chọn ảnh dung lượng nhỏ hơn.'),{statusCode:413});chunks.push(Buffer.from(chunk));}
  try{return req.body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}
  catch{throw Object.assign(new Error('JSON không hợp lệ.'),{statusCode:400});}
}

export function inlinePhoto(value){
  const m=/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(String(value||''));
  if(!m||m[2].length<100||m[2].length>1_500_000)throw Object.assign(new Error('Cần ảnh JPEG, PNG hoặc WEBP hợp lệ.'),{statusCode:400});
  return {mimeType:m[1],image:m[2]};
}
