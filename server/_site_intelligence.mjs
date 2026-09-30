import {geminiGenerate,geminiEnv} from './_gemini.mjs';
import {nearbyMaterialPlaces} from './_places.mjs';
import {publicPage,visibleText} from './_public_web.mjs';

const CACHE_TTL=12*60*60*1000;
const cache=globalThis.__BMH_SITE_INTELLIGENCE__||(globalThis.__BMH_SITE_INTELLIGENCE__=new Map());

const SCHEMA={
  type:'object',additionalProperties:false,
  properties:{
    summary:{type:'string'},
    flood:{type:'object',additionalProperties:false,properties:{level:{type:'string',enum:['low','medium','high','unknown']},reason:{type:'string'},source_date:{type:'string'}},required:['level','reason','source_date']},
    access:{type:'object',additionalProperties:false,properties:{level:{type:'string',enum:['good','medium','difficult','unknown']},reason:{type:'string'}},required:['level','reason']},
    transport:{type:'object',additionalProperties:false,properties:{level:{type:'string',enum:['low','medium','high']},surcharge_pct:{type:'number',minimum:0,maximum:25},reason:{type:'string'}},required:['level','surcharge_pct','reason']},
    supplier_recommendations:{type:'array',maxItems:8,items:{type:'object',additionalProperties:false,properties:{name:{type:'string'},category:{type:'string'},reason:{type:'string'},website:{type:'string'},address:{type:'string'},phone:{type:'string'}},required:['name','category','reason','website','address','phone']}},
    builder_recommendations:{type:'array',maxItems:6,items:{type:'object',additionalProperties:false,properties:{name:{type:'string'},reason:{type:'string'},website:{type:'string'}},required:['name','reason','website']}},
    warnings:{type:'array',maxItems:8,items:{type:'string'}}
  },
  required:['summary','flood','access','transport','supplier_recommendations','builder_recommendations','warnings']
};

const rad=x=>x*Math.PI/180;
const hav=(a,b)=>{const R=6371,dlat=rad(b.lat-a.lat),dlng=rad(b.lng-a.lng),q=Math.sin(dlat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dlng/2)**2;return 2*R*Math.asin(Math.sqrt(q));};
const safe=(v,n=220)=>String(v||'').replace(/[\u0000-\u001f]/g,' ').trim().slice(0,n);
const centerOf=e=>{const lat=Number(e?.lat??e?.center?.lat),lng=Number(e?.lon??e?.center?.lon);return Number.isFinite(lat)&&Number.isFinite(lng)?{lat,lng}:null;};
const placeName=e=>safe(e?.tags?.name||e?.tags?.brand||e?.tags?.operator||'',140);
const webUrl=e=>{const t=e?.tags||{},u=String(t.website||t['contact:website']||'').trim();return /^https?:\/\//i.test(u)?u.slice(0,500):'';};
const addr=e=>{const t=e?.tags||{},parts=[t['addr:housenumber'],t['addr:street'],t['addr:suburb'],t['addr:city']].filter(Boolean);return safe(parts.join(' '),220);};

async function overpass(lat,lng){
  const q='[out:json][timeout:18];('+
    'nwr(around:12000,'+lat+','+lng+')["shop"="building_materials"];'+
    'nwr(around:12000,'+lat+','+lng+')["shop"="hardware"];'+
    'nwr(around:12000,'+lat+','+lng+')["trade"="building_supplies"];'+
    'nwr(around:12000,'+lat+','+lng+')["craft"="builder"];'+
    'nwr(around:12000,'+lat+','+lng+')["office"="construction_company"];'+
    ');out center tags 90;('+
    'nwr(around:7000,'+lat+','+lng+')["highway"~"motorway|trunk|primary|secondary|tertiary"];'+
    'nwr(around:4000,'+lat+','+lng+')["waterway"~"river|canal|stream|drain"];'+
    'nwr(around:4000,'+lat+','+lng+')["natural"="water"];'+
    ');out center tags 60;';
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),22000);
  try{
    const r=await fetch('https://overpass-api.de/api/interpreter',{method:'POST',signal:ctl.signal,headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8','User-Agent':'BuildMyHome/1.0'},body:'data='+encodeURIComponent(q)});
    if(!r.ok)throw new Error('Overpass HTTP '+r.status);
    const data=await r.json();return Array.isArray(data?.elements)?data.elements:[];
  }finally{clearTimeout(timer);}
}

async function elevation(lat,lng){
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),9000);
  try{
    const url='https://api.open-meteo.com/v1/elevation?latitude='+encodeURIComponent(lat)+'&longitude='+encodeURIComponent(lng);
    const r=await fetch(url,{signal:ctl.signal});
    if(!r.ok)return null;const d=await r.json(),n=Number(d?.elevation?.[0]);return Number.isFinite(n)?n:null;
  }catch{return null;}finally{clearTimeout(timer);}
}

function classify(elements,lat,lng){
  const origin={lat,lng},suppliers=[],builders=[],roads=[],waters=[];
  for(const e of elements){
    const p=centerOf(e);if(!p)continue;const t=e.tags||{},km=hav(origin,p),name=placeName(e);
    if(t.shop==='building_materials'||t.shop==='hardware'||t.trade==='building_supplies'){
      if(name)suppliers.push({name,category:t.shop==='hardware'?'Kim khí / hardware':'Vật liệu xây dựng',lat:p.lat,lng:p.lng,distanceKm:+km.toFixed(2),address:addr(e),phone:safe(t.phone||t['contact:phone']||'',40),website:webUrl(e)});
    }
    if(t.craft==='builder'||t.office==='construction_company'){
      if(name)builders.push({name,category:'Đơn vị xây dựng',lat:p.lat,lng:p.lng,distanceKm:+km.toFixed(2),address:addr(e),phone:safe(t.phone||t['contact:phone']||'',40),website:webUrl(e)});
    }
    if(t.highway)roads.push({name:name||safe(t.ref||t.highway,100),type:safe(t.highway,40),distanceKm:+km.toFixed(2)});
    if(t.waterway||t.natural==='water')waters.push({name:name||safe(t.waterway||'Mặt nước',100),type:safe(t.waterway||t.natural,40),distanceKm:+km.toFixed(2)});
  }
  const uniq=a=>{const seen=new Set();return a.sort((x,y)=>x.distanceKm-y.distanceKm).filter(x=>{const k=x.name.toLowerCase();if(seen.has(k))return false;seen.add(k);return true;});};
  return {suppliers:uniq(suppliers).slice(0,12),builders:uniq(builders).slice(0,10),roads:uniq(roads).slice(0,12),waters:uniq(waters).slice(0,12)};
}

function deterministic(site,places,elev){
  const roadWidth=Math.max(0,Number(site.road_width_m)||0),major=places.roads[0]||null,water=places.waters[0]||null,supplier=places.suppliers[0]||null;
  let surcharge=roadWidth>0?(roadWidth<3?12:roadWidth<5?5:2):5;
  if(major?.distanceKm>5)surcharge+=3;else if(major?.distanceKm>2)surcharge+=1;
  if(supplier?.distanceKm>20)surcharge+=4;else if(supplier?.distanceKm>10)surcharge+=2;
  surcharge=Math.min(18,Math.max(2,surcharge));
  const accessScore=roadWidth>=5?85:roadWidth>=3?68:roadWidth>0?45:60;
  const accessLevel=accessScore>=80?'Tốt':accessScore>=60?'Trung bình':'Khó';
  let floodScore=0;
  if(Number.isFinite(elev)){if(elev<3)floodScore+=3;else if(elev<8)floodScore+=2;else if(elev<15)floodScore+=1;}
  if(water?.distanceKm<.3)floodScore+=3;else if(water?.distanceKm<1)floodScore+=2;else if(water?.distanceKm<2)floodScore+=1;
  const floodLevel=floodScore>=5?'Cao':floodScore>=3?'Trung bình':floodScore>=1?'Cần kiểm tra thêm':'Chưa đủ dữ liệu';
  return {
    access:{level:accessLevel,score:accessScore,note:roadWidth?'Đường tiếp cận khai báo '+roadWidth+' m'+(major?' · đường chính gần nhất ~'+major.distanceKm+' km':'')+'.':'Chưa có bề rộng đường tiếp cận; đánh giá đang dùng dữ liệu đường lân cận.',majorRoadDistanceKm:major?.distanceKm??null,majorRoadName:major?.name||'',majorRoadType:major?.type||''},
    transport:{level:surcharge<=4?'Thấp':surcharge<=8?'Trung bình':'Cao',surchargePct:surcharge,note:'Hệ số sàng lọc vận chuyển '+surcharge+'% dựa trên bề rộng đường, khoảng cách đường chính và nhà cung cấp gần nhất.'},
    flood:{level:floodLevel,score:floodScore,note:'Sàng lọc sơ bộ theo cao độ'+(Number.isFinite(elev)?' ~'+elev+' m':'')+(water?' và mặt nước/kênh gần nhất ~'+water.distanceKm+' km':'')+'; không thay thế bản đồ ngập chính thức.',waterwayDistanceKm:water?.distanceKm??null}
  };
}

export async function runSiteIntelligence(body={}){
  const lat=Number(body.lat),lng=Number(body.lng);
  if(!Number.isFinite(lat)||!Number.isFinite(lng)||lat<-90||lat>90||lng<-180||lng>180)throw Object.assign(new Error('Tọa độ khu đất không hợp lệ.'),{statusCode:400});
  const key=lat.toFixed(4)+','+lng.toFixed(4)+':'+(Number(body.road_width_m)||0),now=Date.now(),cached=cache.get(key);
  if(body.force!==true&&cached&&now-cached.at<CACHE_TTL)return {cached:true,...cached.payload};
  const [osm,elev,googlePlaces]=await Promise.all([overpass(lat,lng).then(elements=>({ok:true,elements})).catch(()=>({ok:false,elements:[]})),elevation(lat,lng),nearbyMaterialPlaces(lat,lng)]);
  const elements=osm.elements;
  const places=classify(elements,lat,lng),screen=deterministic({road_width_m:body.road_width_m},places,elev);
  let ai=null,citations=[],aiError='';
  if(geminiEnv().key){
    const loc=[safe(body.address,220),safe(body.district,120),safe(body.province,120),'Việt Nam'].filter(Boolean).join(', ');
    const prompt=[
      'Đánh giá sơ bộ khu đất phục vụ xây nhà tại Việt Nam dựa trên dữ liệu dưới đây và Google Search.',
      'Vị trí khai báo (nếu đã xác nhận): '+loc,'Tọa độ ghim ưu tiên: '+lat+', '+lng,'Cao độ Open-Meteo: '+(elev==null?'không có':elev+' m'),
      'Tọa độ ghim là nguồn vị trí chính. Chỉ dùng địa chỉ khi đối chiếu được với tọa độ; không suy diễn rủi ro hay nhà cung cấp ở địa danh khác.',
      'Đường tiếp cận do người dùng khai báo: '+(Number(body.road_width_m)||0)+' m',
      'Đường chính OSM gần nhất: '+(places.roads[0]?JSON.stringify(places.roads[0]):'không có dữ liệu'),
      'Sông/kênh/mặt nước OSM gần nhất: '+(places.waters[0]?JSON.stringify(places.waters[0]):'không có dữ liệu'),
      'Nhà cung cấp OSM: '+JSON.stringify(places.suppliers.slice(0,8)),
      'Đơn vị xây dựng OSM: '+JSON.stringify(places.builders.slice(0,6)),
      'Hãy dùng Google Search để kiểm tra thêm thông tin công khai gần khu vực: ngập/thoát nước, tiếp cận giao thông, nhà cung cấp vật liệu xây dựng và nhà thầu/đơn vị xây dựng.',
      'Ưu tiên nguồn chính quyền địa phương, báo chí chính thống, website doanh nghiệp chính thức và hồ sơ địa điểm có địa chỉ rõ.',
      'Không khẳng định chắc chắn một lô đất có ngập hay không nếu không có bản đồ ngập chính thức; hãy ghi mức sàng lọc và cảnh báo cần khảo sát tại chỗ.',
      'Nhà cung cấp cần địa chỉ và số điện thoại ghi trên trang nguồn; nếu không có dùng chuỗi rỗng. Không bịa tên nhà cung cấp hay nhà thầu. Nếu không đủ bằng chứng web thì để danh sách ngắn hoặc rỗng.',
      'Mức phụ phí vận chuyển sàng lọc từ engine hiện tại: '+screen.transport.surchargePct+'% — chỉ điều chỉnh nếu có lý do rõ và giữ trong 0-18%.'
    ].join('\n');
    try{
      const g=await geminiGenerate({parts:[{text:prompt}],systemInstruction:'Bạn là Site Intelligence của Build My Home. Đánh giá có nguồn, thận trọng với rủi ro ngập và chỉ đề xuất doanh nghiệp có bằng chứng công khai.',schema:SCHEMA,maxOutputTokens:2600,thinkingLevel:'medium',timeoutMs:85000,tools:[{type:'google_search'}]});
      ai=g.result;citations=(g.citations||[]).slice(0,10);
    }catch(err){aiError=err?.statusCode===401||err?.statusCode===403?'Gemini từ chối key hoặc quyền dự án; kiểm tra key server trên Vercel.':err?.message||'Quét web chưa hoàn tất.';}
  }
  const citedDomains=new Set(citations.flatMap(c=>{try{return [new URL(c.url).hostname.replace(/^www\./,'')];}catch{return [];}}));
  const citedPlaces=items=>(items||[]).filter(x=>{
    try{const host=new URL(x.website).hostname.replace(/^www\./,'');return /^https:\/\//i.test(x.website)&&[...citedDomains].some(d=>host===d||host.endsWith('.'+d));}catch{return false;}
  }).map(x=>({...x,sourceUrl:x.website}));
  const verifiedWebSuppliers=await Promise.all(citedPlaces(ai?.supplier_recommendations).slice(0,8).map(async x=>{try{const p=await publicPage(x.website),text=visibleText(p.html),digits=s=>String(s||'').replace(/\D/g,'');const phone=digits(x.phone);return {...x,phone:phone.length>=8&&digits(text).includes(phone)?x.phone:'',address:x.address&&text.toLowerCase().includes(x.address.toLowerCase())?x.address:'',sourceUrl:p.url};}catch{return {...x,phone:'',address:''};}}));
  const payload={
    fetchedAt:new Date().toISOString(),key,elevation_m:elev,
    flood:{...screen.flood,aiLevel:citations.length&&['medium','high'].includes(ai?.flood?.level)?ai.flood.level:'',aiReason:citations.length&&['medium','high'].includes(ai?.flood?.level)?safe(ai.flood.reason,500):'',sourceDate:citations.length?safe(ai?.flood?.source_date,40):''},
    access:{...screen.access,aiLevel:citations.length?ai?.access?.level||'':'',aiReason:citations.length?safe(ai?.access?.reason,500):''},
    transport:{...screen.transport,aiLevel:citations.length?ai?.transport?.level||'':'',aiReason:citations.length?safe(ai?.transport?.reason,500):'',aiSurchargePct:citations.length?Number(ai?.transport?.surcharge_pct)||0:0},
    suppliers:[...googlePlaces.places,...places.suppliers.filter(x=>!googlePlaces.places.some(p=>p.name.toLowerCase()===x.name.toLowerCase()))].sort((a,b)=>a.distanceKm-b.distanceKm).slice(0,20),builders:places.builders,
    webSuppliers:verifiedWebSuppliers,webBuilders:citedPlaces(ai?.builder_recommendations).slice(0,6),
    citations,sources:[...(googlePlaces.places.length?['Google Places']:[]),...(osm.ok?['OpenStreetMap / Overpass']:[]),...(elev!=null?['Open-Meteo Elevation']:[]),...(ai&&citations.length?['Gemini + Google Search grounding']:[])],
    sourceStatus:{osm:osm.ok?'verified':'unavailable',elevation:elev!=null?'verified':'unavailable',web:ai&&citations.length?'cited':'unverified'},
    aiSummary:citations.length?safe(ai?.summary,1200):'',warnings:[...(googlePlaces.error?[googlePlaces.error]:[]),...(aiError?[aiError]:[]),...(!osm.ok?['Không lấy được dữ liệu OpenStreetMap; danh sách đường và nhà cung cấp chưa đầy đủ.']:[]),...(citations.length?ai?.warnings||[]:[]).map(x=>safe(x,300))].slice(0,8)
  };
  cache.set(key,{at:now,payload});return {cached:false,...payload};
}
