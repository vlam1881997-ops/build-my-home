/* Additive repairs for media, parcel, drawings and the product showroom. */
BMH.HOUSE_STYLES.push(...[
 ['french','Pháp tỉnh lẻ','Mái dốc, cửa cao, tường sáng và sân vườn.','classic','#e5dfcf','#566154'],
 ['spanish','Thuộc địa Tây Ban Nha','Mái ngói, sân trong và hiên vòm.','arch','#ede1cd','#a45637'],
 ['tuscan','Tuscan · Ý','Đá tự nhiên, mái ngói đất nung, hiên có bóng râm.','arch','#d1b591','#87704d'],
 ['craftsman','Craftsman','Hiên rộng, cột chắc, gỗ và đá phối hợp.','gable','#d9d2bf','#646a4d'],
 ['tudor','Tudor','Mái dốc cao, nhịp gỗ tối trên tường sáng.','gable','#e3d7c3','#493b31'],
 ['barn','Modern Barn','Khối mái hai dốc gọn, tôn và gỗ, cửa kính lớn.','gable','#dad8ce','#343832'],
 ['midcentury','Mid-century Modern','Mái thấp, đường ngang và kết nối sân vườn.','flat','#e2dbc9','#7c6347'],
 ['industrial','Industrial','Gạch, thép và kính theo nhịp kết cấu.','flat','#a7856b','#353b3c'],
 ['brutalist','Brutalist','Khối bê tông rõ ràng, bóng đổ sâu và sân trong.','flat','#bcbab2','#66695f'],
 ['coastal','Coastal','Màu sáng, hiên thoáng và mái dốc nhẹ.','gable','#edf0e9','#75999c'],
 ['vietnamese','Việt Nam đương đại','Hiên, mái ngói và sân gợi nhà truyền thống Việt.','wide','#dfd2b6','#82523c'],
 ['balinese','Bali','Mái rộng, vật liệu tự nhiên và sân nhiệt đới.','wide','#d1c2a6','#71644c']
].map(([id,name,description,form,wall,accent])=>({id,name,description,form,wall,accent,materials:description+' Chọn quy cách vật liệu phù hợp khí hậu và ngân sách ở Bước 5.'})));
BMH.styleIllustration=s=>{const i=BMH.HOUSE_STYLES.findIndex(x=>x.id===s.id);return '<div class="style-concept" role="img" aria-label="'+BMH.v6Esc('Ảnh concept '+s.name)+'" style="background-position:'+(i%4/3*100)+'% '+(Math.floor(i/4)/5*100)+'%"></div>';};
const completionStylePanel=BMH.houseStylePanel;
BMH.houseStylePanel=()=>completionStylePanel().replace('Khám phá 12 phong cách','Khám phá 24 phong cách').replace('Hình dưới là minh họa ý tưởng','Ảnh dưới là concept kiến trúc do AI tạo');

// Change the SVG coordinate system, rather than rotating a large CSS rectangle.
const completionPlanSvg=BMH.planSvg;
BMH.planSvg=options=>{
  const markup=completionPlanSvg(options),doc=new DOMParser().parseFromString(markup,'image/svg+xml'),svg=doc.documentElement;
  if(svg.getAttribute('data-auto-rotate')==='1'){
    const [x,y,w,h]=svg.getAttribute('viewBox').split(/\s+/).map(Number),W=Number(BMH.state.project.site.width),g=doc.createElementNS('http://www.w3.org/2000/svg','g');
    g.setAttribute('id','planDrawing');g.setAttribute('transform','matrix(0 -1 1 0 0 '+W+')');
    for(const node of [...svg.children])if(node.tagName!=='defs')g.appendChild(node);
    svg.appendChild(g);svg.setAttribute('viewBox',[y,W-x-w,h,w].join(' '));svg.setAttribute('data-auto-rotate','0');
    for(const label of g.querySelectorAll('.room-label')){const t=label.querySelector('text');if(t){const cx=Number(t.getAttribute('x')),cy=Number(t.getAttribute('y'))+.07;label.setAttribute('transform','rotate(90 '+cx+' '+cy+')');}}
    for(const t of g.querySelectorAll('text'))if(!t.closest('.room-label')){const tx=Number(t.getAttribute('x')||0),ty=Number(t.getAttribute('y')||0);t.setAttribute('transform','rotate(90 '+tx+' '+ty+')');}
  }
  const v=svg.getAttribute('viewBox').split(/\s+/).map(Number),z=BMH.clamp(Number(BMH.state.ui.planner.zoom)||1,.75,2.5);
  svg.setAttribute('data-base-viewbox',[v[0]+v[2]/2-v[2]*z/2,v[1]+v[3]/2-v[3]*z/2,v[2]*z,v[3]*z].join(' '));
  return new XMLSerializer().serializeToString(svg);
};
BMH.v61OrientPlanner=()=>{const box=document.querySelector('.v6-plan-canvas');box?.classList.remove('v61-landscape-plan');};
BMH.zoomPlanner=(factor,event)=>{
  const svg=document.querySelector('#plannerSvg');if(!svg)return;
  const old=Number(BMH.state.ui.planner.zoom)||1,z=BMH.clamp(old*factor,.75,2.5),v=svg.getAttribute('viewBox').split(/\s+/).map(Number);if(z===old)return;
  let cx=v[0]+v[2]/2,cy=v[1]+v[3]/2;
  if(event&&svg.getScreenCTM()){const pt=svg.createSVGPoint();pt.x=event.clientX;pt.y=event.clientY;const at=pt.matrixTransform(svg.getScreenCTM().inverse());cx=at.x;cy=at.y;}
  const ratio=old/z;svg.setAttribute('viewBox',[cx+(v[0]-cx)*ratio,cy+(v[1]-cy)*ratio,v[2]*ratio,v[3]*ratio].join(' '));BMH.state.ui.planner.zoom=z;
  clearTimeout(BMH.plannerZoomSave);BMH.plannerZoomSave=setTimeout(()=>BMH.save(),250);
};
BMH.fitPlanner=()=>{const svg=document.querySelector('#plannerSvg');if(!svg)return;svg.setAttribute('viewBox',svg.getAttribute('data-base-viewbox'));BMH.state.ui.planner.zoom=1;BMH.save();};
let planPan=null;
document.addEventListener('pointerdown',e=>{const svg=e.target.closest?.('#plannerSvg');if(!svg||e.button!==1)return;e.preventDefault();e.stopImmediatePropagation();planPan={svg,x:e.clientX,y:e.clientY,v:svg.getAttribute('viewBox').split(/\s+/).map(Number),matrix:svg.getScreenCTM().inverse()};svg.setPointerCapture?.(e.pointerId);},true);
document.addEventListener('pointermove',e=>{if(!planPan)return;const p=planPan,dx=e.clientX-p.x,dy=e.clientY-p.y;p.svg.setAttribute('viewBox',[p.v[0]-dx*p.matrix.a-dy*p.matrix.c,p.v[1]-dx*p.matrix.b-dy*p.matrix.d,p.v[2],p.v[3]].join(' '));},true);
document.addEventListener('pointerup',()=>{planPan=null;},true);

// Restore verified product selections from the existing dynamic state container.
BMH.restoreWebMaterials=()=>{for(const [id,q] of Object.entries(BMH.dataEngineState().materialOverrides||{})){if(!q.product||!BMH.v6MatMeta[q.product.category])continue;const cat=q.product.category;BMH.MATERIALS[cat]??=[];if(!BMH.MATERIALS[cat].some(x=>x.id===id))BMH.MATERIALS[cat].push({id,name:q.product.name,sub:q.product.spec||'',price:0,score:70});}};
BMH.restoreWebMaterials();
BMH.materialResearch={busy:false,products:[],query:'',error:'',summary:''};
BMH.adoptWebMaterial=x=>{if(!x?.id||!BMH.v6MatMeta[x.category])return;const de=BMH.dataEngineState();de.materialOverrides[x.id]={sku:x.sku,productUrl:x.productUrl,imageUrl:x.imageUrl,value:Number(x.price)||0,unit:x.unit||'',source:x.supplier||x.productUrl,date:x.priceDate||'',checkedAt:x.verifiedAt,product:x};BMH.restoreWebMaterials();BMH.state.project.materials.choices[x.category]=x.id;BMH.save();BMH.render({preserveScroll:true});};
BMH.searchMaterials=async(catalog=false)=>{
  const m=BMH.materialResearch;if(m.busy)return;const query=document.querySelector('#materialSearchQuery')?.value||m.query;m.query=query;m.busy=true;m.error='';BMH.render({preserveScroll:true});
  const cat=BMH.state.ui.materialCategory||'floor',s=BMH.state.project.site,local=BMH.state.ui.materialSearchLocal===true;
  try{const res=await fetch(catalog?'/api/material-catalog?category='+encodeURIComponent(cat):'/api/material-search',{method:catalog?'GET':'POST',headers:{'Content-Type':'application/json'},...(catalog?{}:{body:JSON.stringify({query,category:cat,province:local?s.province:'',district:local?s.district:''})})});const d=await res.json();if(!res.ok)throw Error(d.error||'Tìm vật liệu thất bại');m.products=[...new Map([...m.products.filter(x=>x.category!==cat),...(d.products||[])].map(x=>[x.id,x])).values()];m.summary=d.summary||'';}catch(e){m.error=e.message;}finally{m.busy=false;BMH.render({preserveScroll:true});}
};
BMH.webProductCard=x=>{const esc=BMH.v6Esc,image=BMH.v71SafeHttps(x.imageUrl),url=BMH.v71SafeHttps(x.productUrl),phone=String(x.phone||'').replace(/[^+\d]/g,'');return '<article class="web-product">'+(image?'<img src="'+esc(image)+'" alt="'+esc(x.name+' '+x.sku)+'" loading="lazy" referrerpolicy="no-referrer">':'<div class="product-no-image">Chưa lấy được ảnh đúng mã</div>')+'<div><small>'+esc(x.brand||'')+' · '+esc(x.sku)+'</small><h3>'+esc(x.name)+'</h3><p>'+esc(x.spec)+'</p><b>'+(Number(x.price)>0?Number(x.price).toLocaleString('vi-VN')+' đ / '+esc(x.unit):'Liên hệ báo giá')+'</b><p>'+esc(x.supplier||'')+(x.address?'<br>'+esc(x.address):'')+'</p>'+(phone?'<a href="tel:'+phone+'">'+esc(x.phone)+'</a>':'<small>Nguồn chưa có số điện thoại xác minh</small>')+'<p><a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">Đối chiếu sản phẩm ↗</a></p><small>'+(x.priceDate?'Ngày giá: '+esc(x.priceDate):'Nguồn chưa ghi ngày giá')+' · Kiểm tra '+esc((x.verifiedAt||'').slice(0,10))+'</small><button data-web-product="'+esc(x.id)+'">Chọn mã hàng này</button></div></article>';};
const completionScreen6=BMH.screen6;
BMH.screen6=()=>{BMH.restoreWebMaterials();const m=BMH.materialResearch,esc=BMH.v6Esc,category=BMH.state.ui.materialCategory||'floor';if(!m.busy&&!m.query&&!(m.loadedCategories||new Set()).has(category)){(m.loadedCategories??=new Set()).add(category);queueMicrotask(()=>BMH.searchMaterials(true));}return completionScreen6().replace('<section class="v6-card v6-showroom">','<section class="v6-card v6-showroom"><div class="material-research"><h3>Tìm sản phẩm & nhà cung cấp thực tế</h3><div class="material-search-row"><input id="materialSearchQuery" value="'+esc(m.query)+'" placeholder="Tên hãng, mã gạch, loại sơn, thiết bị…"><button data-material-research '+(m.busy?'disabled':'')+'>'+ (m.busy?'Đang đối chiếu nguồn…':'Tìm trên web')+'</button><button data-material-catalog '+(m.busy?'disabled':'')+'>Sản phẩm chính hãng</button></div><label><input type="checkbox" data-material-local '+(BMH.state.ui.materialSearchLocal?'checked':'')+'> Ưu tiên nhà cung cấp tại khu đất</label><p>'+esc(m.error||m.summary||'Tìm toàn quốc theo nhóm đang chọn. Ảnh lấy từ trang sản phẩm; giá công bố cần xác nhận với người bán trước khi đặt hàng.')+'</p><div class="web-products">'+m.products.filter(x=>x.category===(BMH.state.ui.materialCategory||'floor')).map(BMH.webProductCard).join('')+'</div></div>');};

// Parcel presets are editable reference shapes using the user-entered dimensions.
BMH.parcelPreset=kind=>{const s=BMH.state.project.site,W=Number(s.width),D=Number(s.depth),angle=BMH.directionAngle(s.frontDirection||'Nam')*Math.PI/180;const shape=kind==='l'?[[0,0],[W,0],[W,D*.55],[W*.55,D*.55],[W*.55,D],[0,D]]:kind==='trapezoid'?[[0,0],[W,0],[W*.85,D],[W*.15,D]]:[[0,0],[W,0],[W,D],[0,D]];s.lotPoints=shape.map(([x,y])=>{const e=(x-W/2)*Math.cos(angle)- (y-D/2)*Math.sin(angle),n=-(x-W/2)*Math.sin(angle)-(y-D/2)*Math.cos(angle);return BMH.meterOffset(s.lat,s.lng,e,n);});s.lotMode='custom';s.lotSource='dimensions-preset';s.showLotOverlay=true;s.shape=kind==='l'?'Chữ L':kind==='trapezoid'?'Hình thang':'Chữ nhật';BMH.state.ui.location.drawingLot=false;BMH.save();BMH.render({preserveScroll:true});};
const completionScreen3=BMH.screen3;
BMH.screen3=()=>completionScreen3().replace('<div class="v70-parcel-tools">','<div class="parcel-presets"><span>Mẫu ranh tham khảo:</span><button data-parcel-preset="rect">Chữ nhật</button><button data-parcel-preset="trapezoid">Hình thang</button><button data-parcel-preset="l">Chữ L</button><button data-parcel-undo>↶ Bỏ điểm cuối</button><small>Kéo các đỉnh để khớp ranh trong hồ sơ.</small></div><div class="v70-parcel-tools">').replace('<div class="v67-map-legend">','<p class="map-resolution-note">Ảnh vệ tinh phóng lớn từ mức chi tiết sẵn có. Chuyển sang Bản đồ để đọc đường khi ảnh nền mờ.</p><div class="v67-map-legend">');
const completionUpdateContext=BMH.updateMapContext;
BMH.updateMapContext=()=>{completionUpdateContext();const s=BMH.state.project.site;if(s.lotMode!=='custom'||BMH.state.ui.location?.drawingLot)return;const edit=(i,pt)=>{const next=s.lotPoints.map((p,n)=>n===i?pt:p);if(!BMH.polygonIsSimple(next)){BMH.toast('Các cạnh ranh không được cắt nhau.');BMH.updateLotOverlay();return;}s.lotPoints=next;BMH.save();BMH.updateLotOverlay();BMH.updateLotDrawStatus();};
 if(BMH.mapEngine==='leaflet'&&window.L&&BMH.map){(BMH.mapLotPoints||[]).forEach(x=>BMH.map.removeLayer(x));BMH.mapLotPoints=s.lotPoints.map((pt,i)=>L.marker([pt.lat,pt.lng],{draggable:true,icon:L.divIcon({className:'parcel-vertex',html:String(i+1),iconSize:[24,24],iconAnchor:[12,12]})}).on('dragend',e=>{const p=e.target.getLatLng();edit(i,{lat:p.lat,lng:p.lng});}).addTo(BMH.map));}
 if(BMH.mapEngine==='google'&&window.google?.maps){(BMH.mapLotPoints||[]).forEach(x=>x.setMap(null));BMH.mapLotPoints=s.lotPoints.map((pt,i)=>{const m=new google.maps.Marker({position:pt,map:BMH.map,draggable:true,label:String(i+1)});m.addListener('dragend',e=>edit(i,{lat:e.latLng.lat(),lng:e.latLng.lng()}));return m;});}
};
const completionPlaceCard=BMH.v67PlaceCard;
BMH.v67PlaceCard=(x,type)=>{const phone=String(x.phone||'').replace(/[^+\d]/g,''),href=BMH.v71SafeHttps(x.mapsUrl)||'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(Number.isFinite(Number(x.lat))&&Number.isFinite(Number(x.lng))?x.lat+','+x.lng:[x.name,x.address].filter(Boolean).join(' '));return completionPlaceCard(x,type).replace('</article>','<div class="supplier-contact">'+(x.address?'<small>'+BMH.v6Esc(x.address)+'</small>':'')+(phone?'<a href="tel:'+phone+'">'+BMH.v6Esc(x.phone)+'</a>':'')+'<a href="'+BMH.v6Esc(href)+'" target="_blank" rel="noopener noreferrer">'+(Number.isFinite(x.lat)?'Chỉ đường':'Tìm địa chỉ trên Maps')+' ↗</a></div></article>');};
document.addEventListener('click',e=>{if(e.target.closest('[data-material-research]'))BMH.searchMaterials();if(e.target.closest('[data-material-catalog]'))BMH.searchMaterials(true);const p=e.target.closest('[data-web-product]');if(p)BMH.adoptWebMaterial(BMH.materialResearch.products.find(x=>x.id===p.dataset.webProduct));const shape=e.target.closest('[data-parcel-preset]');if(shape)BMH.parcelPreset(shape.dataset.parcelPreset);if(e.target.closest('[data-parcel-undo]')){BMH.state.project.site.lotPoints?.pop();BMH.save();BMH.updateLotOverlay();BMH.updateLotDrawStatus();}});
document.addEventListener('change',e=>{if(e.target.matches('[data-material-local]')){BMH.state.ui.materialSearchLocal=e.target.checked;BMH.save();}});
BMH.render({preserveScroll:true});
BMH.capturePlanReference=async()=>{
 if(!BMH.state.project.plan.rooms.length)throw Error('Hãy thêm mặt bằng trước khi tạo phối cảnh.');
 const svg=BMH.planSvg({interactive:false,floor:BMH.state.ui.sceneFocus?.startsWith('room:')?(BMH.state.project.plan.rooms.find(r=>r.id===BMH.state.ui.sceneFocus.slice(5))?.floor||0):(Number(BMH.state.ui.sceneFocus?.split(':')[1])||0)}),doc=new DOMParser().parseFromString(svg,'image/svg+xml');doc.documentElement.setAttribute('width','1280');doc.documentElement.setAttribute('height','800');const style=doc.createElementNS('http://www.w3.org/2000/svg','style');style.textContent=[...document.querySelectorAll('style')].map(x=>x.textContent).join('\n'); // Add the same technical drafting styles without external resources.
 style.textContent+='text{font-family:Arial;font-size:.20px;fill:#303b32;text-anchor:middle}.wall-layer path,.wall-layer rect{fill:#555}.room-interior{fill:#eeeee4;stroke:#555;stroke-width:.02}.sheet-bg,.paper{fill:white}.plot-boundary{fill:none;stroke:#555;stroke-width:.04}.minor-grid,.major-grid{fill:none}.room-name{font-size:.22px}.room-area{font-size:.17px}';doc.documentElement.appendChild(style);
 const blob=new Blob([new XMLSerializer().serializeToString(doc)],{type:'image/svg+xml'}),url=URL.createObjectURL(blob);try{const img=new Image();img.src=url;await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('Không chụp được mặt bằng tham chiếu.'));});const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=800;const ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,1280,800);ctx.drawImage(img,0,0,1280,800);return canvas.toDataURL('image/jpeg',.85);}finally{URL.revokeObjectURL(url);}
};
BMH.aiHealth={busy:false,message:''};
const completionScanDrop=BMH.scanDropHtml;
BMH.scanDropHtml=()=>completionScanDrop()+'<div class="ai-health-check"><button data-ai-health '+(BMH.aiHealth.busy?'disabled':'')+'>'+(BMH.aiHealth.busy?'Đang kiểm tra key server…':'Kiểm tra kết nối Gemini')+'</button><span>'+BMH.v6Esc(BMH.aiHealth.message||'Kiểm tra key thực sự được Google chấp nhận, không chỉ kiểm tra có biến môi trường.')+'</span></div>';
document.addEventListener('click',async e=>{if(!e.target.closest('[data-ai-health]')||BMH.aiHealth.busy)return;BMH.aiHealth.busy=true;BMH.render({preserveScroll:true});try{const r=await fetch('/api/ai-health',{method:'POST'}),d=await r.json();BMH.aiHealth.message=d.message||d.error||'Chưa kiểm tra được kết nối.';}catch{BMH.aiHealth.message='Không kết nối được server.';}finally{BMH.aiHealth.busy=false;BMH.render({preserveScroll:true});}});
// The roof envelope must cover occupied rooms, not the whole plot.
BMH.sceneFootprintBounds=rooms=>{if(!rooms.length)return null;const x=Math.min(...rooms.map(r=>r.x)),y=Math.min(...rooms.map(r=>r.y)),right=Math.max(...rooms.map(r=>r.x+r.w)),bottom=Math.max(...rooms.map(r=>r.y+r.h)),width=right-x,depth=bottom-y;const xs=[...new Set(rooms.flatMap(r=>[r.x,r.x+r.w]))].sort((a,b)=>a-b),ys=[...new Set(rooms.flatMap(r=>[r.y,r.y+r.h]))].sort((a,b)=>a-b);let rectangular=true;for(let i=1;i<xs.length;i++)for(let j=1;j<ys.length;j++){const cx=(xs[i]+xs[i-1])/2,cy=(ys[j]+ys[j-1])/2;if(!rooms.some(r=>cx>=r.x&&cx<=r.x+r.w&&cy>=r.y&&cy<=r.y+r.h))rectangular=false;}return {x,y,width,depth,cx:x+width/2,cy:y+depth/2,rectangular};};
BMH.technicalProjection=(kind='elevation')=>{
 const p=BMH.state.project,W=Number(p.site.width),D=Number(p.site.depth),levels=BMH.projectLevels(),fh=levels.floorHeight,span=kind==='elevation'?W:D,total=p.site.floors*fh,cut=W/2,esc=BMH.esc;
 let marks='';for(let f=0;f<p.site.floors;f++){
  const rooms=BMH.floorRooms(f),front=Math.min(...rooms.map(r=>r.y));
  for(const r of rooms){if(kind==='elevation'&&Math.abs(r.y-front)>.015)continue;if(kind==='section'&&(cut<r.x||cut>r.x+r.w))continue;const x=kind==='elevation'?r.x:r.y,w=kind==='elevation'?r.w:r.h,y=total-(f+1)*fh;
   marks+='<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+fh+'" fill="'+(kind==='elevation'?'#ece9df':'#fff')+'" stroke="#414a40" stroke-width=".04"/><rect x="'+x+'" y="'+(y+fh-.14)+'" width="'+w+'" height=".14" fill="#777f72"/>';
   if(kind==='section'){marks+='<text x="'+(x+w/2)+'" y="'+(y+fh*.53)+'">'+esc(r.name)+'</text>';continue;}
   for(const o of p.plan.openings.filter(o=>Number(o.floor)===f&&o.roomId===r.id&&o.side==='north')){const ow=Math.min(r.w-.12,Math.max(.45,Number(o.width)||.9)),ox=x+(r.w-ow)*BMH.clamp(Number(o.offset)||0,0,1),oh=o.kind==='door'?2.12:1.38,sill=o.kind==='door'?0:.86,oy=total-f*fh-sill-oh;marks+='<rect data-opening-id="'+esc(o.id||'')+'" x="'+ox+'" y="'+oy+'" width="'+ow+'" height="'+oh+'" fill="'+(o.kind==='door'?'#a58b68':'#c4dce0')+'" stroke="#414a40" stroke-width=".04"/><line x1="'+(ox+ow/2)+'" x2="'+(ox+ow/2)+'" y1="'+oy+'" y2="'+(oy+oh)+'" stroke="#414a40" stroke-width=".025"/>';}
  }
 }
 for(let f=0;f<=p.site.floors;f++)marks+='<line x1="-1" x2="'+(span+.3)+'" y1="'+(total-f*fh)+'" y2="'+(total-f*fh)+'" stroke="#72826d" stroke-width=".02" stroke-dasharray=".1 .1"/><text x="-.9" y="'+(total-f*fh-.08)+'" text-anchor="end">'+(f?'+'+(f*fh).toFixed(3):'±0.000')+'</text>';
 return '<svg class="technical-view-svg" viewBox="-2 -1 '+(span+4)+' '+(total+3)+'" aria-label="'+(kind==='elevation'?'Mặt đứng từ ô mở thực tế':'Mặt cắt giữa khu đất')+'"><style>text{font-family:Arial;font-size:.22px;fill:#364332;text-anchor:middle}</style><rect x="-2" y="-1" width="'+(span+4)+'" height="'+(total+3)+'" fill="#fff"/>'+marks+'<text x="'+(span/2)+'" y="'+(total+1)+'">'+(kind==='elevation'?'MẶT ĐỨNG PHÍA TRƯỚC':'MẶT CẮT A–A · x = '+cut+' m')+' · KIẾN TRÚC SƠ BỘ</text><text x="'+(span/2)+'" y="'+(total+1.45)+'">'+span+' m · '+p.site.floors+' tầng · cao tầng '+fh+' m</text></svg>';
};
BMH.elevationSvg=()=>BMH.technicalProjection('elevation');BMH.sectionSvg=()=>BMH.technicalProjection('section');

// Studio renders from this registry; replacing a function alone leaves stale screens.
const completionScreen1=BMH.screen1;
BMH.screen1=()=>completionScreen1().replace('<button class="step01-analyze ', '<div class="ai-health-check"><button data-ai-health '+(BMH.aiHealth.busy?'disabled':'')+'>'+(BMH.aiHealth.busy?'Đang kiểm tra kết nối…':'Kiểm tra kết nối Gemini')+'</button><span>'+BMH.v6Esc(BMH.aiHealth.message||'')+'</span></div><button class="step01-analyze ');
BMH.SCREENS=[BMH.screen1,BMH.screen3,BMH.screen4,BMH.screen5,BMH.screen6,BMH.screen7,BMH.screen8,BMH.screen2,BMH.screen9,BMH.screen10];

BMH.render({preserveScroll:true});

// Keep the drawing toolbar available so fullscreen can be exited on touch devices.
const completionScreen5=BMH.screen5;
BMH.screen5=()=>completionScreen5()+'<style>.v6-plan-main:fullscreen{background:#fff;padding:16px;overflow:auto;border-radius:0;display:flex;flex-direction:column;height:100vh}.v6-plan-main:fullscreen .v72-plan-intro{display:none}.v6-plan-main:fullscreen .v6-plan-canvas{height:calc(100vh - 150px);min-height:0;flex:1}.v6-plan-main:fullscreen .planner-svg{height:100%;width:100%}</style>';
BMH.SCREENS[3]=BMH.screen5;
document.addEventListener('click',e=>{if(!e.target.closest('[data-planner-fullscreen]'))return;e.stopImmediatePropagation();if(document.fullscreenElement){document.exitFullscreen?.();return;}const card=document.querySelector('.v6-plan-main');card?.requestFullscreen?.().catch(()=>BMH.toast('Trình duyệt không cho phép toàn màn hình.'));},true);
