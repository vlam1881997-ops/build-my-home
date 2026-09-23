import {send,jsonBody,apiError} from '../server/_lib.mjs';
import {geminiGenerate,geminiEnv,geminiRateLimit} from '../server/_gemini.mjs';

const CACHE_TTL=12*60*60*1000;
const cache=globalThis.__BMH_SITE_INTELLIGENCE__||(globalThis.__BMH_SITE_INTELLIGENCE__=new Map());

const SCHEMA={
  type:'object',additionalProperties:false,
  properties:{
    summary:{type:'string'},
    flood:{type:'object',additionalProperties:false,properties:{
      level:{type:'string',enum:['low','medium','high','unknown']},
      reason:{type:'string'},source_date:{type:'string'}
    },required:['level','reason','source_date']},
    access:{type:'object',additionalProperties:false,properties:{
      level:{type:'string',enum:['good','medium','difficult','unknown']},
      reason:{type:'string'}
    },required:['level','reason']},
    transport:{type:'object',additionalProperties:false,properties:{
      level:{type:'string',enum:['low','medium','high']},
      surcharge_pct:{type:'number',minimum:0,maximum:25},
      reason:{type:'string'}
    },required:['level','surcharge_pct','reason']},
    supplier_recommendations:{type:'array',maxItems:8,items:{type:'object',additionalProperties:false,properties:{
      name:{type:'string'},category:{type:'string'},reason:{type:'string'},website:{type:'string'}
    },required:['name','category','reason','website']}},
    builder_recommendations:{type:'array',maxItems:6,items:{type:'object',additionalProperties:false,properties:{
      name:{type:'string'},reason:{type:'string'},website:{type:'string'}
    },required:['name','reason','website']}},
    warnings:{type:'array',maxItems:8,items:{type:'string'}}
  },
  required:['summary','flood','access','transport','supplier_recommendations','builder_recommendations','warnings']
};

const rad=x=>x*Math.PI/180;
const hav=(a,b)=>{
  const R=6371,dlat=rad(b.lat-a.lat),dlng=rad(b.lng-a.lng),q=Math.sin(dlat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dlng/2)**2;
  return 2*R*Math.asin(Math.sqrt(q));
};
const safe=(v,n=220)=>String(v||'').replace(/[\\u0000-\\u001f]/g,' ').trim().slice(0,n);
const centerOf=e=>{
  const lat=Number(e?.lat??e?.center?.lat),lng=Number(e?.lon??e?.center?.lon);
  return Number.isFinite(lat)&&Number.isFinite(lng)?{lat,lng}:null;
};
const placeName=e=>safe(e?.tags?.name||e?.tags?.brand||e?.tags?.operator||'',140);
const webUrl=e=>{
  const t=e?.tags||{},u=String(t.website||t['contact:website']||'').trim();
  return /^https?:\/\//i.test(u)?u.slice(0,500):'';
};
const addr=e=>{
  const t=e?.tags||{},parts=[t['addr:housenumber'],t['addr:street'],t['addr:suburb'],t['addr:city']].filter(Boolean);
  return safe(parts.join(' '),220);
};

async function overpass(lat,lng){
  const q='[out:json][timeout:18];('+
    'nwr(around:12000,'+lat+','+lng+')["shop"="building_materials"];'+
    'nwr(around:12000,'+lat+','+lng+')["shop"="hardware"];'+
    'nwr(around:12000,'+lat+','+lng+')["trade"="building_supplies"];'+
    'nwr(around:12000,'+lat+','+lng+')["craft"="builder"];'+
    'nwr(around:12000,'+lat+','+lng+')["office"="construction_company"];'+
    'nwr(around:7000,'+lat+','+lng+')["highway"~"motorway|trunk|primary|secondary|tertiary"];'+
    'nwr(around:4000,'+lat+','+lng+')["waterway"~"river|canal|stream|drain"];'+
    'nwr(around:4000,'+lat+','+lng+')["natural"="water"];'+
    ');out center tags 160;';
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
      if(name)suppliers.push({name,category:t.shop==='hardware'?'Kim khí / hardware':'Vật liệu xây dựng',lat:p.lat,lng:p.lng,distanceKm:+km.toFixed(2),address:addr(e),website:webUrl(e)});
    }
    if(t.craft==='builder'||t.office==='construction_company'){
      if(name)builders.push({name,category:'Đơn vị xây dựng',lat:p.lat,lng:p.lng,distanceKm:+km.toFixed(2),address:addr(e),website:webUrl(e)});
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
  const floodLevel=floodScore>=5?'Cao':floodScore>=3?'Trung bình':floodScore>=1?'Thấp - Trung bình':'Chưa thấy tín hiệu cao';
  return {
    access:{level:accessLevel,score:accessScore,note:roadWidth?'Đường tiếp cận khai báo '+roadWidth+' m'+(major?' · đường chính gần nhất ~'+major.distanceKm+' km':'')+'.':'Chưa có bề rộng đường tiếp cận; đánh giá đang dùng dữ liệu đường lân cận.',majorRoadDistanceKm:major?.distanceKm??null,majorRoadName:major?.name||'',majorRoadType:major?.type||''},
    transport:{level:surcharge<=4?'Thấp':surcharge<=8?'Trung bình':'Cao',surchargePct:surcharge,note:'Hệ số sàng lọc vận chuyển '+surcharge+'% dựa trên bề rộng đường, khoảng cách đường chính và nhà cung cấp gần nhất.'},
    flood:{level:floodLevel,score:floodScore,note:'Sàng lọc sơ bộ theo cao độ'+(Number.isFinite(elev)?' ~'+elev+' m':'')+(water?' và mặt nước/kênh gần nhất ~'+water.distanceKm+' km':'')+'; không thay thế bản đồ ngập chính thức.',waterwayDistanceKm:water?.distanceKm??null}
  };
}

export default async function handler(req,res){
  try{
    if(req.method==='OPTIONS')return send(res,200,{ok:true});
    if(req.method!=='POST')return send(res,405,{ok:false,error:'Method not allowed'});
    geminiRateLimit(req,{bucket:'site-intelligence',max:20,windowMs:60*60*1000});
    const body=await jsonBody(req),lat=Number(body.lat),lng=Number(body.lng);
    if(!Number.isFinite(lat)||!Number.isFinite(lng)||lat<-90||lat>90||lng<-180||lng>180)return send(res,400,{ok:false,error:'Tọa độ khu đất không hợp lệ.'});
    const key=lat.toFixed(4)+','+lng.toFixed(4)+':'+(Number(body.road_width_m)||0),now=Date.now();
    const cached=cache.get(key);if(body.force!==true&&cached&&now-cached.at<CACHE_TTL)return send(res,200,{ok:true,cached:true,...cached.payload});

    const [elements,elev]=await Promise.all([overpass(lat,lng).catch(()=>[]),elevation(lat,lng)]);
    const places=classify(elements,lat,lng),screen=deterministic({road_width_m:body.road_width_m},places,elev);
    let ai=null,citations=[];
    if(geminiEnv().key){
      const loc=[safe(body.address,220),safe(body.district,120),safe(body.province,120),'Việt Nam'].filter(Boolean).join(', ');
      const prompt=[
        'Đánh giá sơ bộ khu đất phục vụ xây nhà tại Việt Nam dựa trên dữ liệu dưới đây và Google Search.',
        'Vị trí: '+loc,
        'Tọa độ: '+lat+', '+lng,
        'Cao độ Open-Meteo: '+(elev==null?'không có':elev+' m'),
        'Đường tiếp cận do người dùng khai báo: '+(Number(body.road_width_m)||0)+' m',
        'Đường chính OSM gần nhất: '+(places.roads[0]?JSON.stringify(places.roads[0]):'không có dữ liệu'),
        'Sông/kênh/mặt nước OSM gần nhất: '+(places.waters[0]?JSON.stringify(places.waters[0]):'không có dữ liệu'),
        'Nhà cung cấp OSM: '+JSON.stringify(places.suppliers.slice(0,8)),
        'Đơn vị xây dựng OSM: '+JSON.stringify(places.builders.slice(0,6)),
        '',
        'Hãy dùng Google Search để kiểm tra thêm thông tin công khai gần khu vực: ngập/thoát nước, tiếp cận giao thông, nhà cung cấp vật liệu xây dựng và nhà thầu/đơn vị xây dựng.',
        'Ưu tiên nguồn chính quyền địa phương, báo chí chính thống, website doanh nghiệp chính thức và hồ sơ địa điểm có địa chỉ rõ.',
        'Không khẳng định chắc chắn một lô đất có ngập hay không nếu không có bản đồ ngập chính thức; hãy ghi mức sàng lọc và cảnh báo cần khảo sát tại chỗ.',
        'Không bịa tên nhà cung cấp hay nhà thầu. Nếu không đủ bằng chứng web thì để danh sách ngắn hoặc rỗng.',
        'Mức phụ phí vận chuyển sàng lọc từ engine hiện tại: '+screen.transport.surchargePct+'% — chỉ điều chỉnh nếu có lý do rõ và giữ trong 0-18%.'
      ].join('\n');
      try{
        const g=await geminiGenerate({parts:[{text:prompt}],systemInstruction:'Bạn là Site Intelligence của Build My Home. Đánh giá có nguồn, thận trọng với rủi ro ngập và chỉ đề xuất doanh nghiệp có bằng chứng công khai.',schema:SCHEMA,maxOutputTokens:2600,thinkingLevel:'medium',timeoutMs:85000,tools:[{type:'google_search'}]});
        ai=g.result;citations=(g.citations||[]).slice(0,10);
      }catch(_){}
    }

    const payload={
      fetchedAt:new Date().toISOString(),key,elevation_m:elev,
      flood:{...screen.flood,aiLevel:ai?.flood?.level||'',aiReason:safe(ai?.flood?.reason,500),sourceDate:safe(ai?.flood?.source_date,40)},
      access:{...screen.access,aiLevel:ai?.access?.level||'',aiReason:safe(ai?.access?.reason,500)},
      transport:{...screen.transport,aiLevel:ai?.transport?.level||'',aiReason:safe(ai?.transport?.reason,500),aiSurchargePct:Number(ai?.transport?.surcharge_pct)||0},
      suppliers:places.suppliers,builders:places.builders,
      webSuppliers:(ai?.supplier_recommendations||[]).slice(0,8),
      webBuilders:(ai?.builder_recommendations||[]).slice(0,6),
      citations,
      sources:['OpenStreetMap / Overpass','Open-Meteo Elevation'].concat(ai?['Gemini + Google Search grounding']:[]),
      aiSummary:safe(ai?.summary,1200),
      warnings:(ai?.warnings||[]).map(x=>safe(x,300)).slice(0,8)
    };
    cache.set(key,{at:now,payload});
    return send(res,200,{ok:true,cached:false,...payload});
  }catch(err){apiError(res,err);}
}
