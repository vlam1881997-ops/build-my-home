import {send,jsonBody,apiError} from '../server/_lib.mjs';
import {geminiGenerate,geminiDeleteFile,geminiEnv,geminiRateLimit,validGeminiFileUri} from '../server/_gemini.mjs';

export const maxDuration=180;
export const SCAN_SCHEMA={
  type:'object',additionalProperties:false,
  properties:{
    headline:{type:'string'},summary:{type:'string'},confidence:{type:'integer',minimum:0,maximum:100},
    drawing_dimensions:{type:'array',maxItems:32,items:{type:'object',properties:{label:{type:'string'},value_m:{type:'number'},evidence:{type:'string'},confidence:{type:'integer'}},required:['label','value_m','evidence','confidence']}},
    source_type:{type:'string',enum:['image','video','drawing','document','unknown']},
    location_hint:{type:'string'},
    building:{type:'object',additionalProperties:false,properties:{
      building_type:{type:'string'},style:{type:'string'},finish_level:{type:'string'},estimated_floors:{type:'integer',minimum:0,maximum:30},estimated_width_m:{type:'number',minimum:0,maximum:100},estimated_depth_m:{type:'number',minimum:0,maximum:200},estimated_floor_area_m2:{type:'number',minimum:0,maximum:20000},estimated_total_floor_area_m2:{type:'number',minimum:0,maximum:100000},roof_type:{type:'string'},balcony:{type:'boolean'},elevator_detected:{type:'boolean'}
    },required:['building_type','style','finish_level','estimated_floors','estimated_width_m','estimated_depth_m','estimated_floor_area_m2','estimated_total_floor_area_m2','roof_type','balcony','elevator_detected']},
    facade_materials:{type:'array',maxItems:12,items:{type:'string'}},
    rooms_detected:{type:'array',maxItems:30,items:{type:'object',additionalProperties:false,properties:{name:{type:'string'},floor:{type:'integer',minimum:0,maximum:30},confidence:{type:'integer',minimum:0,maximum:100}},required:['name','floor','confidence']}},
    spoken_facts:{type:'array',maxItems:20,items:{type:'object',additionalProperties:false,properties:{label:{type:'string'},value:{type:'string'},unit:{type:'string'},timestamp:{type:'string'},confidence:{type:'integer',minimum:0,maximum:100}},required:['label','value','unit','timestamp','confidence']}},
    observations:{type:'array',maxItems:20,items:{type:'object',additionalProperties:false,properties:{category:{type:'string'},detail:{type:'string'},source:{type:'string',enum:['visual','audio','document','inference']},confidence:{type:'integer',minimum:0,maximum:100}},required:['category','detail','source','confidence']}},
    evidence:{type:'array',maxItems:20,items:{type:'object',additionalProperties:false,properties:{where:{type:'string'},detail:{type:'string'},source:{type:'string',enum:['visual','audio','document']},confidence:{type:'integer',minimum:0,maximum:100}},required:['where','detail','source','confidence']}},
    assumptions:{type:'array',maxItems:12,items:{type:'string'}},questions:{type:'array',maxItems:8,items:{type:'string'}},
    safe_auto_apply:{type:'object',additionalProperties:false,properties:{floors:{type:'boolean'},width:{type:'boolean'},depth:{type:'boolean'},style:{type:'boolean'}},required:['floors','width','depth','style']}
  },required:['headline','summary','confidence','source_type','location_hint','building','facade_materials','rooms_detected','spoken_facts','observations','evidence','assumptions','questions','safe_auto_apply']
};

function cleanProject(p={}){return {style:String(p.style||'').slice(0,80),site:{province:String(p.site?.province||'').slice(0,80),district:String(p.site?.district||'').slice(0,100),width:Number(p.site?.width)||0,depth:Number(p.site?.depth)||0,floors:Number(p.site?.floors)||0,frontDirection:String(p.site?.frontDirection||'').slice(0,30)},materials:{tier:String(p.materials?.tier||''),choices:p.materials?.choices||{}},finance:{cash:Number(p.finance?.cash)||0,loan:Number(p.finance?.loan)||0}};}

export default async function handler(req,res){
  let fileName='';
  try{
    if(req.method==='OPTIONS')return send(res,200,{ok:true});
    if(req.method!=='POST')return send(res,405,{ok:false,error:'Method not allowed'});
    geminiRateLimit(req,{bucket:'scan',max:6});
    const body=await jsonBody(req);fileName=String(body.file_name||'');
    const fileUri=String(body.file_uri||''),mime=String(body.mime_type||'').toLowerCase();
    if(!validGeminiFileUri(fileUri,fileName))return send(res,400,{ok:false,error:'Thiếu Gemini file URI hợp lệ.'});
    const isVideo=mime.startsWith('video/'),isImage=mime.startsWith('image/'),isPdf=mime==='application/pdf';
    if(!isVideo&&!isImage&&!isPdf)return send(res,400,{ok:false,error:'Loại tệp không hỗ trợ cho AI Scan.'});
    const userIntent=String(body.intent||'reference').slice(0,30);
    const project=cleanProject(body.project||{});
    const mediaPart={file_data:{file_uri:fileUri,mime_type:mime}};
    if(isVideo)mediaPart.media_processing={type:'static',fps:1};
    const prompt=`Phân tích tệp này cho Build My Home, một ứng dụng hỗ trợ chủ nhà Việt Nam lập phương án xây nhà. Mục đích người dùng: ${userIntent==='my_home'?'đây là nhà/khu đất của họ cần bóc tách dữ liệu':'đây là nhà/bản vẽ tham khảo để lấy ý tưởng'}.

YÊU CẦU BẮT BUỘC:
1) Tách rõ dữ kiện QUAN SÁT/NGHE/ĐỌC được với SUY LUẬN. Không biến suy luận thành sự thật.
2) Với video, ưu tiên cả hình ảnh và lời nói; spoken_facts phải ghi timestamp nếu có thể.
3) Không bịa kích thước khi không có tỷ lệ. Nếu chỉ ước lượng, confidence thấp và ghi assumptions.
4) Không kết luận kích thước móng/cọc, thép, kết cấu chịu lực hay an toàn thi công từ video/ảnh. Chỉ nêu điều cần khảo sát/xác minh.
5) Nếu nhận diện phong cách/vật liệu, mô tả ở mức đủ để engine 3D/vật liệu dùng làm brief.
6) Với bản vẽ/PDF: đọc tên phòng, số tầng, chuỗi kích thước, đơn vị mm/m, số trang. drawing_dimensions chỉ chứa kích thước đọc được, đổi mm sang m; nếu không đọc được để rỗng. Không lấy kích thước dự án hiện tại để điền cho bản vẽ.
7) Trả JSON đúng schema, tiếng Việt.

Dữ liệu dự án hiện tại để đối chiếu, KHÔNG được coi là dữ kiện nhìn thấy trong media: ${JSON.stringify(project)}`;
    const {result,model,apiVersion,usage,interactionId}=await geminiGenerate({parts:[mediaPart,{text:prompt}],systemInstruction:'Bạn là Gemini Visual Scan Engine của Build My Home. Ưu tiên bằng chứng, mức tin cậy và sự an toàn kỹ thuật hơn sự tự tin giả.',schema:SCAN_SCHEMA,maxOutputTokens:3200,thinkingLevel:'medium',timeoutMs:isVideo?120000:70000});
    return send(res,200,{ok:true,provider:'gemini',model,apiVersion,autoUpgrade:geminiEnv().auto,usage,interactionId,result});
  }catch(err){apiError(res,err);}
  finally{if(fileName&&geminiEnv().deleteUploads)await geminiDeleteFile(fileName);}
}
