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
  const svg=document.querySelector('#plannerSvg')||document.querySelector('.v6-plan-canvas>svg');if(!svg)return;
  const old=Number(BMH.state.ui.planner.zoom)||1,z=BMH.clamp(old*factor,.75,2.5),v=svg.getAttribute('viewBox').split(/\s+/).map(Number);if(z===old)return;
  let cx=v[0]+v[2]/2,cy=v[1]+v[3]/2;
  if(event&&svg.getScreenCTM()){const pt=svg.createSVGPoint();pt.x=event.clientX;pt.y=event.clientY;const at=pt.matrixTransform(svg.getScreenCTM().inverse());cx=at.x;cy=at.y;}
  const ratio=old/z;svg.setAttribute('viewBox',[cx+(v[0]-cx)*ratio,cy+(v[1]-cy)*ratio,v[2]*ratio,v[3]*ratio].join(' '));BMH.state.ui.planner.zoom=z;
  clearTimeout(BMH.plannerZoomSave);BMH.plannerZoomSave=setTimeout(()=>BMH.save(),250);
};
BMH.fitPlanner=()=>{const svg=document.querySelector('#plannerSvg')||document.querySelector('.v6-plan-canvas>svg');if(!svg)return;svg.setAttribute('viewBox',svg.getAttribute('data-base-viewbox'));BMH.state.ui.planner.zoom=1;BMH.save();};
let planPan=null;
document.addEventListener('pointerdown',e=>{const svg=e.target.closest?.('#plannerSvg');if(!svg||e.button!==1)return;e.preventDefault();e.stopImmediatePropagation();planPan={svg,x:e.clientX,y:e.clientY,v:svg.getAttribute('viewBox').split(/\s+/).map(Number),matrix:svg.getScreenCTM().inverse()};svg.setPointerCapture?.(e.pointerId);},true);
document.addEventListener('pointermove',e=>{if(!planPan)return;const p=planPan,dx=e.clientX-p.x,dy=e.clientY-p.y;p.svg.setAttribute('viewBox',[p.v[0]-dx*p.matrix.a-dy*p.matrix.c,p.v[1]-dx*p.matrix.b-dy*p.matrix.d,p.v[2],p.v[3]].join(' '));},true);
document.addEventListener('pointerup',()=>{planPan=null;},true);

// Restore verified product selections from the existing dynamic state container.
BMH.materialUnit=v=>{const u=typeof v==='string'?v.trim():'';return ({m2:'m²',M2:'m²',MTK:'m²',LTR:'lít',KGM:'kg'})[u]||u||null;};
BMH.materialPriceEvidence=(x={})=>{
 const e=x.priceEvidence||{},finite=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0?v:null,date=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}(?:T[^\s]+)?$/.test(v)&&Number.isFinite(Date.parse(v))?v:null,candidate=Object.hasOwn(e,'amountVnd')?finite(e.amountVnd):finite(x.price)>0?x.price:null,raw=candidate===0&&!['verified-zero','project-quote'].includes(e.priceType)?null:candidate,until=date(e.validUntil),expired=until&&Date.parse(until.length===10?until+'T23:59:59.999Z':until)<Date.now();
 return {productId:x.id||null,sku:x.sku||null,specification:x.specification||x.spec||e.specification||null,quantityUnit:BMH.materialUnit(e.quantityUnit??x.unit),amountVnd:raw,priceType:expired?'expired':raw===null?'unknown':e.priceType||'unverified',sourceUrl:BMH.v71SafeHttps?.(e.sourceUrl||x.productUrl)||null,quotedAt:date(Object.hasOwn(e,'quotedAt')?e.quotedAt:x.priceDate),retrievedAt:date(Object.hasOwn(e,'retrievedAt')?e.retrievedAt:x.verifiedAt),locationScope:e.locationScope||null,includesVat:typeof e.includesVat==='boolean'?e.includesVat:null,includesLabour:typeof e.includesLabour==='boolean'?e.includesLabour:null,includesTransport:typeof e.includesTransport==='boolean'?e.includesTransport:null,validUntil:until,publisher:typeof e.publisher==='string'?e.publisher.slice(0,160):null,sourceType:e.sourceType==='supplier'?'supplier':'manufacturer',publishedPeriod:/^\d{4}(?:-\d{2})?$/.test(e.publishedPeriod||'')?e.publishedPeriod:null,notes:typeof e.notes==='string'?e.notes.slice(0,600):null};
};
BMH.materialPriceFreshness=(p,now=Date.now())=>{
 const at=p.quotedAt||p.retrievedAt,period=p.publishedPeriod,periodEnd=period?Date.UTC(Number(period.slice(0,4)),period.length===4?12:Number(period.slice(5)),0):null;
 const age=at&&Number.isFinite(Date.parse(at))?(now-Date.parse(at))/86400000:null;
 return p.priceType==='expired'?'expired':periodEnd&&now-periodEnd>30*86400000||age!==null&&age>30?'stale':age===null?'unknown':'checked';
};
BMH.materialIllustration=x=>{
 const category=['floor','paint','cabinetry','door','lighting','sanitary','cement','steel','roof','waterproof','mep','insulation','wall'].includes(x.category)?x.category:'wall';
 return 'assets/materials/illustrations/'+category+'.svg';
};
BMH.materialProductIdentity=x=>({productId:x?.id||'',sku:String(x?.sku||''),specification:String(x?.specification||x?.spec||''),quantityUnit:BMH.materialUnit(x?.priceEvidence?.quantityUnit??x?.unit)});
// Read-only display eligibility, never a supplier or commercial acceptance.
BMH.materialProductPhotoStatus=x=>{
 const text=v=>typeof v==='string'?v.trim():'',safe=v=>BMH.v71SafeHttps?.(v)||'',spec=text(x?.specification||x?.spec),missing=[];
 if(!text(x?.sku))missing.push('sku');
 if(!spec||/theo quy cách|xem quy cách|chưa (?:rõ|xác nhận)/i.test(spec))missing.push('specification');
 if(!safe(x?.productUrl))missing.push('product-source');
 if(!safe(x?.imageUrl))missing.push('image');
 if(x?.photoLicense?.verified!==true||x?.photoLicense?.commercialUse!==true||!safe(x?.photoLicense?.sourceUrl))missing.push('image-rights');
 return {displayable:missing.length===0,imageUrl:missing.length?null:safe(x.imageUrl),missing,status:missing.length?'needs-evidence':'source-photo-not-product-approval'};
};
BMH.restoreWebMaterials=()=>{for(const [id,q] of Object.entries(BMH.dataEngineState().materialOverrides||{})){if(!q.product||!BMH.v6MatMeta[q.product.category])continue;const cat=q.product.category;BMH.MATERIALS[cat]??=[];const item=BMH.MATERIALS[cat].find(x=>x.id===id);if(item)Object.assign(item,{name:q.product.name,sub:q.product.specification||q.product.spec||'',priceUnknown:true});else BMH.MATERIALS[cat].push({id,name:q.product.name,sub:q.product.specification||q.product.spec||'',price:0,priceUnknown:true,score:70});if(BMH.materialResearch&&!BMH.materialResearch.products.some(x=>x.id===id))BMH.materialResearch.products.push(q.product);}};
BMH.officialCatalog=typeof BMH_CATALOG_DATA==='undefined'?{products:[]}:BMH_CATALOG_DATA;
// Public source references are display-only. Pin to the shipped catalogue, never
// trust a review flag supplied by search, an import or a saved project.
const materialPhotoReferences=new Map(BMH.officialCatalog.products.filter(x=>x.photoReference).map(x=>[x.id,JSON.parse(JSON.stringify(x))]));
BMH.materialPhotoReference=x=>{
 const original=materialPhotoReferences.get(x?.id),r=original?.photoReference,safe=v=>BMH.v71SafeHttps?.(v)||'';
 if(!r||r.status!=='source-matched'||!['product-photo','surface-sample','product-range'].includes(r.kind)||!safe(r.imageUrl)||!safe(r.sourceUrl)||!r.checkedAt)return null;
 if(x.category!==original.category||x.productUrl!==original.productUrl||x.imageUrl!==original.imageUrl||JSON.stringify(BMH.materialProductIdentity(x))!==JSON.stringify(BMH.materialProductIdentity(original)))return null;
 if(r.sku!==x.sku||r.specification!==(x.specification||x.spec))return null;
 const origin=r.publisherType==='supplier'?'từ nhà cung cấp':'từ hãng';return {...r,label:(r.kind==='surface-sample'?'Ảnh mẫu bề mặt ':r.kind==='product-range'?'Ảnh dòng sản phẩm ':'Ảnh sản phẩm ')+origin};
};
const materialGeneratedIllustrations=new Map(BMH.officialCatalog.products.filter(x=>x.generatedIllustration).map(x=>[x.id,JSON.parse(JSON.stringify(x))]));
BMH.materialGeneratedIllustration=x=>{
 const original=materialGeneratedIllustrations.get(x?.id),r=original?.generatedIllustration;
 if(!r||r.kind!=='ai-illustration'||!/^assets\/materials\/ai\/(tile|latex|cement)\.webp$/.test(r.imageUrl))return null;
 if(x.category!==original.category||x.productUrl!==original.productUrl||JSON.stringify(BMH.materialProductIdentity(x))!==JSON.stringify(BMH.materialProductIdentity(original)))return null;
 return {...r};
};
BMH.materialGeneratedIllustrationHtml=(x,figureClass)=>{
 const r=BMH.materialGeneratedIllustration(x);if(!r)return '';const esc=BMH.v6Esc;
 return '<figure class="'+esc(figureClass)+'"><button type="button" class="material-reference-zoom" data-material-reference-open="'+esc(x.id)+'" aria-label="Xem lớn ảnh minh họa AI"><img data-material-ai-illustration src="'+esc(r.imageUrl)+'" alt="'+esc(r.label)+'" loading="lazy" decoding="async"><span>Xem lớn ↗</span></button><figcaption>'+esc(r.label)+'<small>'+esc(r.notes)+'</small></figcaption></figure>';
};
BMH.materialPhotoReferenceHtml=(x,figureClass='material-product-visual')=>{
 const r=BMH.materialPhotoReference(x);if(!r)return BMH.materialGeneratedIllustrationHtml(x,figureClass);const esc=BMH.v6Esc,title=x.sku||x.name;
 return '<figure class="'+esc(figureClass)+'"><button type="button" class="material-reference-zoom" data-material-reference-open="'+esc(x.id)+'" aria-label="Xem lớn '+esc(r.label.toLowerCase())+' '+esc(title)+'"><img data-material-reference-image src="'+esc(r.imageUrl)+'" alt="'+esc(r.label+' · '+title)+'" loading="lazy" decoding="async" referrerpolicy="no-referrer"><span>Xem lớn ↗</span></button><figcaption>'+esc(r.label)+' · '+esc(title)+(r.kind==='product-range'?'<small>Cần chốt mã, màu và quy cách; ảnh không đại diện mọi biến thể.</small>':'')+'<a href="'+esc(r.sourceUrl)+'" target="_blank" rel="noopener noreferrer">'+esc(r.publisher)+' · xem nguồn ↗</a></figcaption></figure>';
};
BMH.openMaterialReference=id=>{
 const x=BMH.materialResearch.products.find(p=>p.id===id),r=BMH.materialPhotoReference(x),ai=BMH.materialGeneratedIllustration(x);if(!r&&!ai)return false;
 const esc=BMH.v6Esc,focus=document.activeElement,dialog=document.createElement('dialog');dialog.className='material-sample-dialog material-reference-dialog';dialog.setAttribute('aria-label',(r||ai).label+' '+(x.sku||x.name));
 dialog.innerHTML=ai?'<form method="dialog"><button aria-label="Đóng ảnh minh họa">Đóng ×</button></form><h2>'+esc(ai.label)+'</h2><img data-material-ai-illustration src="'+esc(ai.imageUrl)+'" alt="'+esc(ai.label)+'"><p>'+esc(ai.notes)+'</p>':'<form method="dialog"><button aria-label="Đóng ảnh sản phẩm">Đóng ×</button></form><h2>'+esc(x.sku||x.name)+'</h2><p>'+esc(x.name)+'</p><img data-material-reference-image src="'+esc(r.imageUrl)+'" alt="'+esc(r.label+' · '+(x.sku||x.name))+'" referrerpolicy="no-referrer"><p>'+esc(r.specification)+'</p><p>'+esc(r.notes||'')+'</p><a href="'+esc(r.sourceUrl)+'" target="_blank" rel="noopener noreferrer">'+esc(r.publisher)+' · xem trang sản phẩm ↗</a><p><small>'+esc(r.label)+' · Đối chiếu '+esc(r.checkedAt)+'. Ảnh tham khảo liên kết từ nguồn; chưa xác nhận quyền tái sử dụng. Không dùng tự động làm texture 3D hoặc ảnh trong hồ sơ xuất. Đối chiếu mẫu thực trước khi đặt hàng.</small></p>';
 dialog.addEventListener('close',()=>{dialog.remove();if(focus?.isConnected)focus.focus();},{once:true});document.body.appendChild(dialog);dialog.showModal();return true;
};
BMH.materialResearch={busy:false,products:BMH.officialCatalog.products.map(x=>({...x})),query:'',filter:'',brand:'',styleOnly:false,photoOnly:false,priceFilter:'',error:'',summary:'',visible:12,attempts:{}};
BMH.restoreWebMaterials();
BMH.materialSourceKey=value=>{if(BMH.evidenceHash)return BMH.evidenceHash(value);let h=2166136261;for(const c of JSON.stringify(value))h=Math.imul(h^c.charCodeAt(0),16777619);return (h>>>0).toString(16);};
BMH.adoptWebMaterial=x=>{
 if(!x?.id||!BMH.v6MatMeta[x.category])return false;
 const de=BMH.dataEngineState(),old=de.materialOverrides[x.id]||{},next=BMH.materialProductIdentity(x),prior=BMH.materialProductIdentity(old.product),same=!!old.product&&!!next.sku&&!!next.specification&&!!next.quantityUnit&&JSON.stringify(prior)===JSON.stringify(next)&&BMH.materialUnit(old.unit)===next.quantityUnit&&(!old.sku||old.sku===next.sku),quote=same&&typeof old.value==='number'&&Number.isFinite(old.value)&&old.value>=0&&typeof old.source==='string'&&!!old.source.trim()&&typeof old.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(old.date)&&(!old.priceEvidence||old.priceEvidence.priceType==='project-quote'),priceEvidence=BMH.materialPriceEvidence(x),previousQuotes=[...(old.previousQuotes||[])];
 if(!quote&&typeof old.value==='number'&&Number.isFinite(old.value)&&old.source&&old.date)previousQuotes.push({value:old.value,unit:old.unit||null,source:old.source,date:old.date,sku:old.sku||old.product?.sku||null,specification:old.product?.specification||old.product?.spec||null,productId:x.id,reason:'product-identity-changed-or-unconfirmed'});
 const product={...x,price:priceEvidence.amountVnd,unit:priceEvidence.quantityUnit,priceEvidence};de.materialOverrides[x.id]={...old,sku:x.sku||null,productUrl:x.productUrl,imageUrl:BMH.materialProductPhotoStatus(x).imageUrl,value:quote?old.value:null,unit:quote?old.unit:priceEvidence.quantityUnit,source:quote?old.source:'',date:quote?old.date:'',checkedAt:priceEvidence.retrievedAt,priceEvidence:quote?{...old.priceEvidence,...priceEvidence,amountVnd:old.value,priceType:'project-quote',quantityUnit:BMH.materialUnit(old.unit),sourceUrl:BMH.v71SafeHttps?.(old.source)||null,quotedAt:old.date}:priceEvidence,previousQuotes:previousQuotes.slice(-10),product};
 const existingIndex=BMH.materialResearch.products.findIndex(row=>row.id===x.id);if(existingIndex>=0)BMH.materialResearch.products[existingIndex]=product;else BMH.materialResearch.products.push(product);
 const p=BMH.state.project;if(p.designEvidence){p.designEvidence.materialSources||=[];for(const row of p.designEvidence.materialSources)if(row.scope?.category===x.category&&(row.scope.productId!==next.productId||row.scope.sku!==next.sku||row.scope.specification!==next.specification||BMH.materialUnit(row.scope.quantityUnit)!==next.quantityUnit))row.verifiedState='stale';const scope={category:x.category,...next,locationScope:priceEvidence.locationScope},id='material-source-'+BMH.materialSourceKey([scope,priceEvidence]);if(!p.designEvidence.materialSources.some(row=>row.id===id))p.designEvidence.materialSources.push({id,kind:'material-price',sourceTitle:x.name||null,publisher:x.brand||null,sourceUrl:priceEvidence.sourceUrl,retrievedAt:priceEvidence.retrievedAt,effectiveAt:priceEvidence.quotedAt,unit:priceEvidence.quantityUnit,sourceType:priceEvidence.sourceType,verifiedState:priceEvidence.amountVnd===null?'unverified':'cited',scope,value:priceEvidence,notes:'Giá web tham khảo; không tự thành báo giá công trình.'});}
 BMH.restoreWebMaterials();p.materials.choices[x.category]=x.id;BMH.finishInvalidate?.();BMH.save();BMH.render({preserveScroll:true});BMH.toast('Đã chọn '+x.name+'. Giá web là tham khảo; nhập báo giá đúng quy cách và đơn vị cho công trình.');return true;
};
BMH.searchMaterials=async(catalog=false)=>{
 const m=BMH.materialResearch;if(m.busy)return;const cat=BMH.state.ui.materialCategory||'floor',query=document.querySelector('#materialSearchQuery')?.value||m.filter||'',s=BMH.state.project.site,local=BMH.state.ui.materialSearchLocal===true,key=JSON.stringify([catalog,cat,query,local?s.province:'',local?s.district:'']),at=Date.now();
 if(m.attempts[key]&&at-m.attempts[key]<(catalog?900000:60000)){m.error='Yêu cầu này vừa được gửi. Danh mục vẫn chọn được.';BMH.render({preserveScroll:true});return;}m.attempts[key]=at;if(Object.keys(m.attempts).length>40)delete m.attempts[Object.keys(m.attempts)[0]];
 m.query=query;m.busy=true;m.error='';BMH.render({preserveScroll:true});const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),catalog?12000:35000);
 try{const res=await (BMH.aiFetch||fetch)(catalog?'/api/material-catalog?category='+encodeURIComponent(cat)+'&refresh=1':'/api/material-search',{method:catalog?'GET':'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,...(catalog?{}:{body:JSON.stringify({query,category:cat,province:local?s.province:'',district:local?s.district:''})})});const d=await res.json();if(!res.ok)throw Error(d.error||'Tìm vật liệu thất bại');m.products=[...new Map([...m.products,...(d.products||[])].map(x=>[x.id,x])).values()];m.summary=d.summary||'';m.visible=12;}catch(e){m.error=(e.name==='AbortError'?'Nguồn phản hồi quá lâu':e.message)+' · Danh mục có sẵn vẫn sử dụng được.';}finally{clearTimeout(timer);m.busy=false;BMH.render({preserveScroll:true});}
};
BMH.prepareMaterialQuote=id=>{
 const x=BMH.materialResearch.products.find(p=>p.id===id);if(!x)return false;
 const p=BMH.materialPriceEvidence(x);BMH.navigateTo(7);
 const form=document.querySelector('[data-team-a-boq]');if(!form){BMH.toast('Mở Dự toán để nhập báo giá có nguồn.');return false;}
 form.reset();const role=form.elements.namedItem('roleId');if(role){role.selectedIndex=-1;role.required=true;}
 const values={name:x.name||'',sku:x.sku||'',specification:p.specification||'',unit:p.quantityUnit||'',sourceReference:p.sourceUrl||'',quotedAt:'',validUntil:'',region:p.locationScope||'',unitPrice:''};
 for(const [key,value] of Object.entries(values)){const input=form.elements.namedItem(key);if(!input)continue;if(!input.options||[...input.options].some(o=>o.value===value))input.value=value;else{input.selectedIndex=-1;input.required=true;}}
 form.querySelector('[data-material-quote-reference]')?.remove();
 const note=document.createElement('p');note.dataset.materialQuoteReference=id;note.textContent=p.amountVnd===null?'Nguồn chưa có giá. Nhập báo giá do nhà cung cấp xác nhận.':'Giá web tham khảo: '+p.amountVnd.toLocaleString('vi-VN')+' đ / '+(p.quantityUnit||'đơn vị chưa rõ')+'. Nhập giá và ngày báo giá công trình đã xác nhận; kiểm VAT, nhân công, vận chuyển và khu vực trước khi lưu.';
 form.prepend(note);for(let d=form.parentElement;d;d=d.parentElement)if(d.tagName==='DETAILS')d.open=true;form.scrollIntoView?.({block:'start',behavior:'smooth'});return true;
};
BMH.webProductCard=x=>{
 const esc=BMH.v6Esc,url=BMH.v71SafeHttps(x.productUrl),phone=String(x.phone||'').replace(/[^+\d]/g,''),selected=BMH.state.project.materials.choices[x.category]===x.id,p=BMH.materialPriceEvidence(x),known=p.amountVnd!==null,freshness=BMH.materialPriceFreshness(p),flag=v=>v===null?'Chưa rõ':v?'Đã gồm':'Chưa gồm',date=v=>v?String(v).slice(0,10).split('-').reverse().join('/'):'Chưa đối chiếu',image=BMH.materialProductPhotoStatus(x).imageUrl||'',source=BMH.v71SafeHttps(p.sourceUrl),status=p.priceType==='expired'?'Hết hiệu lực':p.priceType==='project-quote'?'Báo giá công trình':freshness==='stale'?'Nguồn giá cũ · cần cập nhật':p.priceType==='unverified'?'Chưa xác minh':known?'Giá web tham khảo':'Chờ báo giá';
 const visual=BMH.materialPhotoReferenceHtml(x)||'<figure class="material-product-visual"><img '+(image?'data-material-product-image':'data-material-illustration')+' src="'+esc(image||BMH.materialIllustration(x))+'" alt="'+esc(image?x.name:'Minh họa nhóm '+(BMH.v6MatMeta[x.category]?.[1]||x.category)+'; không phải ảnh đúng mã hàng')+'" loading="lazy" decoding="async" referrerpolicy="no-referrer"><figcaption>'+(image?'Ảnh sản phẩm có nguồn':'Minh họa BMH · đối chiếu ảnh hãng')+'</figcaption></figure>';
 return '<article class="web-product '+(selected?'selected':'')+'" data-product-id="'+esc(x.id)+'">'+visual+'<div><small>'+esc(x.brand||'')+' · '+esc(x.sku||'Chưa có mã cụ thể')+'</small><h3>'+esc(x.name)+'</h3><p>'+esc(p.specification||'Quy cách chưa xác nhận')+'</p><div class="material-price-summary" data-price-freshness="'+freshness+'"><b>'+esc(known?p.amountVnd.toLocaleString('vi-VN')+' đ / '+(p.quantityUnit||'đơn vị chưa xác nhận'):'Chưa có giá')+'</b><span>'+status+'</span><small>Đối chiếu '+date(p.retrievedAt)+(p.publishedPeriod?' · Nguồn '+esc(p.publishedPeriod):'')+'</small>'+(source?'<a href="'+esc(source)+'" target="_blank" rel="noopener noreferrer">'+esc(p.publisher||'Nguồn giá')+' ↗</a>':'')+'</div><details class="material-price-facts"><summary>Quy cách & phạm vi giá</summary><p>Ngày báo giá: '+esc(p.quotedAt||'Chưa công bố ngày cụ thể')+'<br>Khu vực: '+esc(p.locationScope||'Chưa xác nhận')+'<br>VAT: '+flag(p.includesVat)+' · Nhân công: '+flag(p.includesLabour)+' · Vận chuyển: '+flag(p.includesTransport)+(p.validUntil?'<br>Hiệu lực đến: '+esc(p.validUntil):'')+'</p>'+(p.notes?'<p>'+esc(p.notes)+'</p>':'')+'<small>Chỉ so cùng mã, quy cách và đơn vị. Giá web cần xác nhận lại khi đặt hàng; chưa tự đưa vào báo giá nhà bạn.</small></details>'+(phone?'<p><a href="tel:'+phone+'">'+esc(x.phone)+'</a></p>':'')+(url?'<a class="material-source-link" href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">Xem sản phẩm & ảnh tại nguồn ↗</a>':'')+'<button data-web-product="'+esc(x.id)+'" aria-pressed="'+selected+'">'+(selected?'✓ Đang chọn':'Chọn sản phẩm')+'</button><button data-material-quote="'+esc(x.id)+'">Nhập báo giá cho vật liệu này →</button></div></article>';
};
BMH.materialStyleFits=x=>{if(Array.isArray(x.styleIds)&&x.styleIds.length)return x.styleIds.includes(BMH.houseStyle?.()?.id);const text=[x.name,x.spec,x.specification].join(' '),style=BMH.state.project.style||'';if(/Japandi|Nhật|Bắc Âu/i.test(style))return !/bóng|marble|cổ điển/i.test(text);if(/cổ điển|Art Deco/i.test(style))return !/bê tông|concrete/i.test(text);return true;};
BMH.materialCatalogHtml=category=>{
 const m=BMH.materialResearch,esc=BMH.v6Esc,all=m.products.filter(x=>x.category===category),brands=[...new Set(all.map(x=>x.brand).filter(Boolean))].sort(),brand=brands.includes(m.brand)?m.brand:'',normalize=t=>String(t).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase(),q=normalize(m.filter),products=all.filter(x=>(!brand||x.brand===brand)&&(!m.photoOnly||BMH.materialPhotoReference(x))&&(!q||normalize([x.brand,x.name,x.sku,x.specification,x.spec].join(' ')).includes(q))&&(!m.styleOnly||BMH.materialStyleFits(x))&&(!m.priceFilter||(m.priceFilter==='known'?BMH.materialPriceEvidence(x).amountVnd!==null&&BMH.materialPriceFreshness(BMH.materialPriceEvidence(x))==='checked':BMH.materialPriceEvidence(x).amountVnd===null))),selected=all.find(x=>x.id===BMH.state.project.materials.choices[category]);
 const rank=x=>{const p=BMH.materialPriceEvidence(x);return p.amountVnd===null?2:BMH.materialPriceFreshness(p)==='checked'?0:1;};products.sort((a,b)=>Number(!!BMH.materialPhotoReference(b))-Number(!!BMH.materialPhotoReference(a))||rank(a)-rank(b));
 return '<div class="material-research"><h3>Vật liệu có nguồn · '+esc(BMH.state.project?.style||'phong cách của bạn')+'</h3><div class="material-search-row"><input id="materialSearchQuery" data-material-filter value="'+esc(m.filter)+'" placeholder="Tên hãng, SKU hoặc loại vật liệu…" aria-label="Lọc vật liệu"><select data-material-brand aria-label="Lọc hãng"><option value="">Tất cả hãng</option>'+brands.map(b=>'<option '+(brand===b?'selected':'')+'>'+esc(b)+'</option>').join('')+'</select></div><details class="material-search-options"><summary>Bộ lọc và cập nhật nguồn</summary><div class="material-search-row"><label><input type="checkbox" data-material-photo '+(m.photoOnly?'checked':'')+'> Có ảnh từ nguồn</label><label><input type="checkbox" data-material-style '+(m.styleOnly?'checked':'')+'> Gợi ý BMH theo phong cách</label><label>Tình trạng giá<select data-material-price><option value="">Tất cả</option><option value="known" '+(m.priceFilter==='known'?'selected':'')+'>Có giá mới đối chiếu</option><option value="unknown" '+(m.priceFilter==='unknown'?'selected':'')+'>Chờ báo giá</option></select></label></div><div class="material-search-row"><button data-material-research '+(m.busy?'disabled':'')+'>'+(m.busy?'Đang đối chiếu nguồn…':'Tìm thêm trên web')+'</button><button data-material-catalog '+(m.busy?'disabled':'')+'>Cập nhật từ hãng</button><label><input type="checkbox" data-material-local '+(BMH.state.ui.materialSearchLocal?'checked':'')+'> Quanh khu đất</label></div><small>Search cần quyền hạn mức server. Danh mục vẫn dùng được khi mạng hoặc quota lỗi.</small></details><p>'+esc(m.error||m.summary||'Chọn mã và quy cách. Giá thiếu được giữ chờ báo giá; ảnh và bề mặt mô phỏng cần đối chiếu mẫu hãng.')+'</p>'+(selected?'<p class="material-chosen">✓ Đang chọn: <b>'+esc(selected.name)+'</b></p>':'')+'<p>'+products.filter(x=>BMH.materialPhotoReference(x)).length+' lựa chọn có ảnh đối chiếu từ nguồn · '+products.length+' lựa chọn · hiển thị '+Math.min(products.length,m.visible)+'</p><div class="web-products">'+products.slice(0,m.visible).map(BMH.webProductCard).join('')+'</div>'+(products.length>m.visible?'<button data-material-more>Xem thêm '+Math.min(12,products.length-m.visible)+' sản phẩm</button>':'')+(!products.length?'<p>Không có sản phẩm khớp. Xóa bộ lọc hoặc mở tùy chọn tìm thêm.</p>':'')+'</div>';
};
const completionScreen6=BMH.screen6;
BMH.screen6=()=>{BMH.restoreWebMaterials();return completionScreen6();};

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
document.addEventListener('click',e=>{const photo=e.target.closest('[data-material-reference-open]');if(photo){BMH.openMaterialReference(photo.dataset.materialReferenceOpen);return;}const quote=e.target.closest('[data-material-quote]');if(quote){BMH.prepareMaterialQuote(quote.dataset.materialQuote);return;}if(e.target.closest('[data-material-research]'))BMH.searchMaterials();if(e.target.closest('[data-material-catalog]'))BMH.searchMaterials(true);const p=e.target.closest('[data-web-product]');if(p)BMH.adoptWebMaterial(BMH.materialResearch.products.find(x=>x.id===p.dataset.webProduct));const shape=e.target.closest('[data-parcel-preset]');if(shape)BMH.parcelPreset(shape.dataset.parcelPreset);if(e.target.closest('[data-parcel-undo]')){BMH.state.project.site.lotPoints?.pop();BMH.save();BMH.updateLotOverlay();BMH.updateLotDrawStatus();}});
document.addEventListener('change',e=>{if(e.target.matches('[data-material-local]')){BMH.state.ui.materialSearchLocal=e.target.checked;BMH.save();}});
BMH.render({preserveScroll:true});
BMH.capturePlanReference=async()=>{
 if(!BMH.state.project.plan.rooms.length)throw Error('Hãy thêm mặt bằng trước khi tạo phối cảnh.');
 const svg=(BMH.lightPreviewSvg&&BMH.state.ui.step===6?BMH.lightPreviewSvg():BMH.planSvg({interactive:false,floor:BMH.state.ui.sceneFocus?.startsWith('room:')?(BMH.state.project.plan.rooms.find(r=>r.id===BMH.state.ui.sceneFocus.slice(5))?.floor||0):(Number(BMH.state.ui.sceneFocus?.split(':')[1])||0)})).replace(/<svg(?![^>]*xmlns=)/,'<svg xmlns="http://www.w3.org/2000/svg"'),doc=new DOMParser().parseFromString(svg,'image/svg+xml');doc.documentElement.setAttribute('width','1280');doc.documentElement.setAttribute('height','800');const style=doc.createElementNS('http://www.w3.org/2000/svg','style');style.textContent=[...document.querySelectorAll('style')].map(x=>x.textContent).join('\n'); // Add the same technical drafting styles without external resources.
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
 const p=BMH.state.project,W=Number(p.site.width),D=Number(p.site.depth),levels=BMH.resolvedProjectLevels(),fh=levels.floorHeight,span=kind==='elevation'?W:D,roof=BMH.sceneRoofSpec?.(),total=Math.max(levels.roofBase+levels.slab,roof?roof.eave+roof.rise:0),cut=BMH.sectionCutX?.()??W/2,esc=BMH.esc,scale=BMH.drawingScale(span+4,total+2),font=scale*.0025;
 let marks='',stairs=[];const line=(x,y,a,b,extra='')=>'<line x1="'+x+'" y1="'+y+'" x2="'+a+'" y2="'+b+'" stroke="#647369" stroke-width=".02" '+extra+'/>';
 const rect=(x,z,w,h,fill='#fff',extra='')=>'<rect x="'+x+'" y="'+(total-z-h)+'" width="'+w+'" height="'+h+'" fill="'+fill+'" stroke="#39453e" stroke-width=".025" '+extra+'/>';
 const label=(x,z,text,extra='')=>'<text x="'+x+'" y="'+(total-z)+'" '+extra+'>'+esc(text)+'</text>';
 for(let f=0;f<p.site.floors;f++){
  const rooms=BMH.floorRooms(f),level=BMH.floorLevel(f),base=level.base,fh=level.height;
  if(kind==='elevation'){
   const geometry=BMH.scenePlanGeometry?.(p.plan,f);
   if(geometry){const front=geometry.walls.filter(w=>w.horizontal&&w.roomIds.length===1&&rooms.some(r=>r.id===w.roomIds[0]&&Math.abs(r.y-w.axis)<.001)),xs=[...new Set(front.flatMap(w=>[w.a,w.b]))].sort((a,b)=>a-b);
    for(let i=1;i<xs.length;i++){const a=xs[i-1],b=xs[i],mid=(a+b)/2,w=front.filter(w=>mid>w.a-.0001&&mid<w.b+.0001).sort((a,b)=>a.axis-b.axis)[0];if(!w)continue;
     marks+=rect(a,base+levels.slab,b-a,fh-levels.slab,'#f3f0e8')+rect(a,base,b-a,levels.slab,'#adb3a9');
     if(w.kind!=='wall'){const id=w.openingId||'',oh=w.height,sill=w.sill||0;marks+=rect(a,base+levels.slab+sill,b-a,oh,w.kind==='door'?'#c1af92':'#e2edeb','data-opening-id="'+esc(id)+'"')+line(mid,total-base-levels.slab-sill,mid,total-base-levels.slab-sill-oh);}
    }
   }else{const front=Math.min(...rooms.map(r=>r.y));for(const r of rooms.filter(r=>Math.abs(r.y-front)<.015)){marks+=rect(r.x,base,r.w,fh,'#f3f0e8');for(const o of p.plan.openings.filter(o=>o.floor===f&&o.roomId===r.id&&o.side==='north'))marks+=rect(r.x+(r.w-o.width)*(o.offset??.5),base+levels.slab+(o.kind==='door'?0:o.sill??.9),o.width,o.height||(o.kind==='door'?2.1:1.4),'#e2edeb','data-opening-id="'+esc(o.id)+'"');}}
  }else{
   const intersects=r=>cut>r.x+.001&&cut<r.x+r.w-.001;
   for(const r of rooms.filter(intersects)){
    const floorPanels=BMH.slabPanels?.(r,BMH.stairFloorHoles?.(f)||[])||[{x:r.x,y:r.y,w:r.w,d:r.h}];
    for(const panel of floorPanels.filter(q=>cut>q.x-.001&&cut<q.x+q.w+.001))marks+=rect(panel.y,base,panel.d,levels.slab,'#9fa89b','data-section-slab="'+f+'"');
    if(f===p.site.floors-1)marks+=rect(r.y,base+fh,r.h,levels.slab,'#9fa89b');
    marks+=label(r.y+r.h/2,base+fh*.56,r.name,'text-anchor="middle"');
    if(!['stairs','elevator'].includes(r.type)){const ceiling=base+fh-(levels.ceilingDrop||0);marks+=line(r.y+.08,total-ceiling,r.y+r.h-.08,total-ceiling,'stroke-dasharray=".12 .08"')+label(r.y+r.h/2,base+fh*.43,'Htt '+level.clearHeight.toFixed(3)+' m','text-anchor="middle" class="section-note"');}
    if(r.type==='elevator'&&BMH.elevatorSpec){const lift=BMH.elevatorSpec(r);marks+=line(r.y+.12,total-base,r.y+.12,total-base-fh,'data-section-elevator="'+esc(r.id)+'"')+line(r.y+r.h-.12,total-base,r.y+r.h-.12,total-base-fh);if(f===0)marks+=rect(r.y+(r.h-lift.cabinDepth)/2,base+levels.slab,lift.cabinDepth,2.1,'#d5e3e3','data-section-elevator-cabin="'+esc(r.id)+'"');}
    if(r.type==='stairs'){const spec=BMH.stairSpec?.(r),steps=BMH.stairGeometry(r).filter(q=>cut>=q.x&&cut<=q.x+q.w);for(const q of steps)marks+=rect(q.y,base+levels.slab+q.base,q.d,q.h,'#d8cfbc','data-section-stair="'+esc(r.id)+'"');if(spec&&f<p.site.floors-1)stairs.push({name:r.name,floor:f+1,spec});}
   }
   const geometry=BMH.scenePlanGeometry?.(p.plan,f);
   for(const w of geometry?.walls||[]){if(!w.horizontal||cut<w.a||cut>w.b)continue;const t=w.thickness||.12,x=w.axis-t/2,h=fh-levels.slab;
    if(w.kind==='wall')marks+=rect(x,base+levels.slab,t,h,'#7d877c');else{const oh=Math.min(w.height,h),sill=w.sill||0;if(sill)marks+=rect(x,base+levels.slab,t,sill,'#7d877c');if(h-sill-oh>0)marks+=rect(x,base+levels.slab+sill+oh,t,h-sill-oh,'#7d877c');marks+=line(w.axis,total-base-levels.slab-sill,w.axis,total-base-levels.slab-sill-oh,'stroke-dasharray=".05 .04"');}
   }
  }
 }
 if(kind==='elevation'){const top=BMH.floorRooms(p.site.floors-1);for(const r of top)marks+=rect(r.x,levels.roofBase,r.w,levels.slab,'#a8afa1');}
 if(roof){
  if(kind==='elevation'){const points=[...roof.corners,...roof.ridge].map(q=>[q[0],total-q[1]]),unique=[...new Map(points.map(q=>[q.join(','),q])).values()].sort((a,b)=>a[0]-b[0]||a[1]-b[1]),cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]),lower=[],upper=[];for(const q of unique){while(lower.length>1&&cross(lower.at(-2),lower.at(-1),q)<=0)lower.pop();lower.push(q);}for(const q of [...unique].reverse()){while(upper.length>1&&cross(upper.at(-2),upper.at(-1),q)<=0)upper.pop();upper.push(q);}marks+='<polygon points="'+[...lower.slice(0,-1),...upper.slice(0,-1)].map(q=>q.join(',')).join(' ')+'" fill="#d2d7cc" stroke="#566454" stroke-width=".035" data-projection-roof="1"/>';
  }else for(const polygon of roof.faces){const hits=[];for(let i=0;i<polygon.length;i++){const a=polygon[i],b=polygon[(i+1)%polygon.length];if((a[0]-cut)*(b[0]-cut)>0||Math.abs(a[0]-b[0])<1e-8)continue;const k=(cut-a[0])/(b[0]-a[0]);if(k>=0&&k<=1)hits.push([a[2]+k*(b[2]-a[2]),total-a[1]-k*(b[1]-a[1])]);}if(hits.length>=2)marks+=line(...hits[0],...hits[1],'data-projection-roof="1"');}
 }
 for(let f=0;f<=p.site.floors;f++){const level=levels.elevations[f]+levels.slab,y=total-level;marks+=line(-.55,y,span+.55,y,'stroke-dasharray=".1 .08"')+label(-.7,level+.05,f?'+'+levels.elevations[f].toFixed(3):'±0.000','text-anchor="end"')+'<path d="M-.45 '+y+'l-.15-.15h.3z" fill="#56695a"/>';}
 const dimension=(x,y,a,b,value)=>line(x,y,a,b)+line(x-.07,y+.07,x+.07,y-.07)+line(a-.07,b+.07,a+.07,b-.07)+'<text x="'+((x+a)/2)+'" y="'+((y+b)/2-.12)+'" text-anchor="middle">'+value+'</text>';
 marks+=dimension(0,total+.55,span,total+.55,Math.round(span*1000));for(let f=0;f<p.site.floors;f++)marks+=dimension(span+.75,total-levels.elevations[f],span+.75,total-levels.elevations[f+1],Math.round(levels.heights[f]*1000));
 const vb={x:-2,y:-.65,w:span+4,h:total+1.7},width=vb.w*1000/scale,height=vb.h*1000/scale,content='<svg x="'+(12+(308-width)/2)+'" y="'+(24+(218-height)/2)+'" width="'+width+'" height="'+height+'" viewBox="'+[vb.x,vb.y,vb.w,vb.h].join(' ')+'" class="projection-content"><style>.sheet-'+(kind==='section'?'KT-MC':'KT-MD')+' .projection-content text{font-family:Arial;font-size:'+font+'px;fill:#364332}.sheet-'+(kind==='section'?'KT-MC':'KT-MD')+' .projection-content .section-note{font-size:'+(font*.85)+'px}</style>'+marks+'</svg>',t=BMH.sheetText;
 const sidebar=t(330,29,kind==='section'?'THÔNG SỐ MẶT CẮT':'THÔNG SỐ MẶT ĐỨNG',3,'font-weight="bold"')+t(330,39,p.site.floors+' tầng · cao tầng '+fh.toFixed(3)+' m')+t(330,48,'Dày sàn '+Math.round(levels.slab*1000)+' mm')+t(330,57,'Trần hạ '+Math.round((levels.ceilingDrop||0)*1000)+' mm')+t(330,66,'Cửa theo đúng rộng / cao / bậu.')+(kind==='section'?t(330,78,'A–A: x = '+cut.toFixed(3)+' m')+t(330,86,'Vị trí đường cắt trên mặt bằng.'):'')+stairs.slice(0,5).map((r,i)=>t(330,106+i*25,r.name+' · tầng '+r.floor,2.6,'font-weight="bold"')+t(330,114+i*25,r.spec.count+' cao bậc · '+Math.round(r.spec.riser*1000)+' mm')+t(330,122+i*25,'Mặt bậc '+Math.round(r.spec.tread*1000)+' mm')).join('')+t(330,237,'Khoảng thông đầu cần KTS kiểm tra.',2.4);
 return BMH.sheetFrame({code:kind==='section'?'KT-MC':'KT-MD',title:kind==='section'?'MẶT CẮT A–A':'MẶT ĐỨNG PHÍA TRƯỚC',scale,content,sidebar,caption:kind==='section'?'Htt: chiều cao thông thủy. Cao độ theo sàn hoàn thiện tầng 1 (±0.000). Sàn, ô thang và bậc dùng chung với 3D.':'Mặt đứng chiếu theo tường và ô mở nhìn từ phía trước. Màu minh họa; quy cách hoàn thiện cần xác nhận.'});
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

document.addEventListener('change',e=>{const m=BMH.materialResearch;if(e.target.matches?.('[data-material-filter]')){m.filter=e.target.value;m.visible=12;BMH.render({preserveScroll:true});}if(e.target.matches?.('[data-material-brand]')){m.brand=e.target.value;m.visible=12;BMH.render({preserveScroll:true});}if(e.target.matches?.('[data-material-photo]')){m.photoOnly=e.target.checked;m.visible=12;BMH.render({preserveScroll:true});}if(e.target.matches?.('[data-material-style]')){m.styleOnly=e.target.checked;m.visible=12;BMH.render({preserveScroll:true});}if(e.target.matches?.('[data-material-price]')){m.priceFilter=e.target.value;m.visible=12;BMH.render({preserveScroll:true});}});
document.addEventListener('click',e=>{if(e.target.closest?.('[data-material-more]')){BMH.materialResearch.visible+=12;BMH.render({preserveScroll:true});}if(e.target.closest?.('[data-material-view]')){BMH.materialResearch.filter='';BMH.materialResearch.brand='';BMH.materialResearch.visible=12;BMH.render({preserveScroll:true});}});

document.addEventListener('error',e=>{if(e.target.matches?.('img[data-material-product-image],img[data-material-reference-image]')){const placeholder=document.createElement('div');placeholder.className='product-no-image';placeholder.textContent='Ảnh hãng tạm chưa tải được · mở trang sản phẩm bên dưới để đối chiếu.';e.target.replaceWith(placeholder);}},true);
