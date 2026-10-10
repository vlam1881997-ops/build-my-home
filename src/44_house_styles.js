/* Architectural inspiration; illustrations are concepts, not construction drawings. */
BMH.HOUSE_STYLES=[{id:'modern',name:'Hiện đại',description:'Đường nét gọn, khối vuông, kính và lam che nắng.',materials:'Bê tông, kính, kim loại; kiểm tra hướng nắng trước khi tăng diện tích kính.',wall:'#e9e5dc',accent:'#384c48',form:'flat'},
{id:'minimal',name:'Tối giản',description:'Ít chi tiết, khoảng trống rõ và ánh sáng dịu.',materials:'Bề mặt đồng nhất, tông trung tính; ưu tiên lưu trữ kín.',wall:'#f2efe9',accent:'#9a8a75',form:'flat'},
{id:'contemporary',name:'Đương đại',description:'Khối lệch tầng, tương phản vật liệu, không gian mở.',materials:'Đá, gỗ và kính; kiểm tra chống thấm tại các khối đua.',wall:'#d9d6cd',accent:'#414443',form:'offset'},
{id:'classic',name:'Cổ điển',description:'Bố cục đối xứng, cột, vòm và phào trang trí.',materials:'Đá, sơn sáng, chi tiết đúc; cần báo giá riêng phần trang trí.',wall:'#eee2cb',accent:'#a88851',form:'classic'},
{id:'neo',name:'Tân cổ điển',description:'Đối xứng nhẹ, phào tiết chế, mái dốc và ban công.',materials:'Sơn sáng, đá điểm nhấn, lan can kim loại; cân đối chi tiết theo bề ngang nhà.',wall:'#f0e9de',accent:'#72777a',form:'classic'},
{id:'indochine',name:'Đông Dương · Indochine',description:'Mái dốc, cửa chớp, sắc kem và nhịp vòm.',materials:'Gỗ, gạch bông, mây; chọn xử lý chống ẩm và mối mọt.',wall:'#ead6ab',accent:'#38574e',form:'arch'},
{id:'mediterranean',name:'Địa Trung Hải',description:'Tường sáng, mái ngói đất nung và hiên vòm.',materials:'Vữa, đá, ngói; dự trù thoát nước và chống thấm cho mái.',wall:'#f5ecdf',accent:'#b46d4b',form:'arch'},
{id:'scandi',name:'Bắc Âu · Scandinavian',description:'Mái dốc đơn giản, màu sáng và gỗ ấm.',materials:'Gỗ sáng, sơn trắng; bổ sung che nắng phù hợp khí hậu khu đất.',wall:'#e7e9e5',accent:'#8a735a',form:'gable'},
{id:'japandi',name:'Japandi',description:'Nét Nhật kết hợp sự giản dị Bắc Âu.',materials:'Gỗ tự nhiên, tường màu đất, vải thô; giữ lối đi thoáng.',wall:'#ded5c5',accent:'#82715b',form:'flat'},
{id:'japanese',name:'Nhật Bản',description:'Mái rộng, nhịp gỗ, hiên và khoảng sân tĩnh.',materials:'Gỗ, đá, cửa trượt; kiểm tra độ bền ngoài trời và chiều rộng hiên.',wall:'#e2d9c8',accent:'#5e5142',form:'wide'},
{id:'tropical',name:'Nhiệt đới',description:'Hiên sâu, lam thoáng và cây xanh xen kẽ.',materials:'Lam gỗ/kim loại, đá, cây xanh; ưu tiên che nắng và thông gió.',wall:'#d9dfca',accent:'#557158',form:'wide'},
{id:'artdeco',name:'Art Deco',description:'Nhịp đứng, hình học bậc cấp và điểm nhấn kim loại.',materials:'Đá, kim loại, sơn tương phản; báo giá riêng chi tiết mặt đứng.',wall:'#e6d6bd',accent:'#9c7842',form:'deco'}];
BMH.houseStyle=()=>BMH.HOUSE_STYLES.find(x=>x.name===BMH.state.project.style)||null;
BMH.selectHouseStyle=id=>{
  const style=BMH.HOUSE_STYLES.find(x=>x.id===id);if(!style)return false;
  BMH.state.project.style=style.name;
  // A style change must show the editable model, rather than leave a previous
  // presentation image on top of the newly selected design.
  BMH.state.ui.renderMode='interactive';
  BMH.finishInvalidate?.();BMH.customerFrameCache=null;
  BMH.save();return true;
};
BMH.styleIllustration=s=>{
  const roof=s.form==='flat'?'<path d="M65 66h158v8H65z"/>':s.form==='offset'?'<path d="M65 73h80V47h78v10h-68v24H65z"/>':s.form==='deco'?'<path d="M75 75V60h35V44h65v16h35v15z"/>':s.form==='wide'?'<path d="M38 79L144 36l107 43-8 8-99-33-98 33z"/>':'<path d="M55 79l89-46 89 46z"/>';
  const arches=['arch','classic'].includes(s.form);
  const windows=[84,128,172].map(x=>arches?'<path d="M'+x+' 132v-24a13 13 0 0 1 26 0v24z"/>':'<rect x="'+x+'" y="96" width="26" height="36" rx="1"/>').join('');
  return '<svg viewBox="0 0 288 170" aria-hidden="true"><rect width="288" height="170" fill="#f3f1eb"/><circle cx="239" cy="32" r="16" fill="#e8ddbf"/><path d="M0 148Q60 134 130 148T288 148v22H0z" fill="#d7dfd0"/><rect x="68" y="75" width="152" height="74" fill="'+s.wall+'"/><g fill="'+s.accent+'">'+roof+'</g><g fill="#779392" stroke="'+s.accent+'" stroke-width="3">'+windows+'</g><rect x="136" y="121" width="18" height="28" fill="'+s.accent+'"/>'+(s.form==='classic'?'<g fill="#fff9eb"><rect x="74" y="84" width="7" height="64"/><rect x="207" y="84" width="7" height="64"/><path d="M68 79h152v5H68z"/></g>':'')+'<path d="M123 152h44l12 18h-68z" fill="#c6bfaf"/><g fill="#71866c"><circle cx="42" cy="123" r="16"/><circle cx="248" cy="132" r="12"/></g></svg>';
};
BMH.houseStylePanel=()=>{
  const selected=BMH.houseStyle(),esc=BMH.v6Esc;
  return '<details class="v6-card house-styles" '+(BMH.state.ui.houseStylesOpen?'open':'')+'><summary><span><small>PHONG CÁCH NGÔI NHÀ</small><b>'+esc(BMH.state.project.style||'Chưa chọn')+'</b></span><em>Khám phá 12 phong cách ↓</em></summary><p>Chọn hướng thẩm mỹ cho ngôi nhà. Hình dưới là minh họa ý tưởng; phối cảnh AI sẽ dùng phong cách này cùng mặt bằng và vật liệu bạn chọn.</p><div class="house-style-grid">'+BMH.HOUSE_STYLES.map(s=>'<button type="button" data-house-style="'+s.id+'" aria-pressed="'+(selected?.id===s.id)+'" class="house-style-card '+(selected?.id===s.id?'selected':'')+'">'+BMH.styleIllustration(s)+'<span><b>'+esc(s.name)+(selected?.id===s.id?' ✓':'')+'</b><small>'+esc(s.description)+'</small><i><u style="background:'+s.wall+'"></u><u style="background:'+s.accent+'"></u></i></span></button>').join('')+'</div><div class="house-style-advice"><b>'+(selected?'Gợi ý cho '+esc(selected.name):'Phong cách riêng của bạn')+'</b><p>'+esc(selected?.materials||'Bạn đang dùng tên phong cách tùy chỉnh. Chọn một mẫu để khám phá thêm.')+'</p><small>Lựa chọn này giữ nguyên phòng, cửa và mã vật liệu đã chốt. Xem lại vật liệu ở Bước 5; tạo phối cảnh ở Bước 6.</small></div></details>';
};
document.addEventListener('click',e=>{
  const card=e.target.closest?.('[data-house-style]');if(!card)return;
  if(BMH.selectHouseStyle(card.dataset.houseStyle)){
    BMH.state.ui.houseStylesOpen=true;BMH.render({preserveScroll:true});BMH.toast('Đã lưu phong cách '+BMH.state.project.style+'.');
  }
});
document.addEventListener('toggle',e=>{if(e.target.matches?.('.house-styles'))BMH.state.ui.houseStylesOpen=e.target.open;},true);

/* B1 material brief. BMH design suggestions, not engineering prescriptions or
 * manufacturer compatibility claims. Products/prices remain independently sourced. */
(()=>{
 const B=BMH,revision='style-material-brief-1';
 const rows=[
  ['modern','urban-stone','grey-concrete','ivory-paint','dark-walnut','natural-linen','Mái bằng, đường ngang rõ','Khung cửa sâu, kim loại tối, mảng phẳng'],
  ['minimal','urban-stone','ivory-tile','ivory-paint','ivory-lacquer','natural-linen','Mái bằng, mép mái gọn','Mảng liền, khe âm, ít vật liệu tương phản'],
  ['contemporary','soft-curves','sand-travertine','ivory-paint','dark-walnut','cream-boucle','Mái bằng hoặc khối lệch theo phương án','Đá điểm nhấn, khung lệch và đường cong tiết chế'],
  ['classic','neo-elegance','white-marble','ivory-paint','dark-walnut','olive-velvet','Mái dốc theo hồ sơ mái','Nhịp đối xứng, phào nhiều lớp và trụ trang trí'],
  ['neo','neo-elegance','ivory-tile','ivory-paint','dark-walnut','natural-linen','Mái dốc với chi tiết gọn','Đối xứng nhẹ, phào mảnh và cửa tỷ lệ đứng'],
  ['indochine','indochine','walnut-floor','sand-plaster','dark-walnut','natural-linen','Mái dốc, hiên và che nắng','Cửa chớp, nhịp vòm, gỗ trầm và sắc kem'],
  ['mediterranean','coastal','sand-travertine','sand-plaster','natural-oak','natural-linen','Mái ngói theo phương án','Vữa màu cát, vòm mềm và hiên sáng'],
  ['scandi','nordic-light','ivory-terrazzo','ivory-paint','natural-oak','natural-linen','Mái hai dốc, đường nét giản dị','Mảng sáng, gỗ nhạt và nhịp đứng'],
  ['japandi','warm-oak','oak-floor','sand-plaster','natural-oak','natural-linen','Mái giản dị theo bản vẽ','Khung mảnh, màu đất, gỗ liền và khoảng trống'],
  ['japanese','warm-oak','walnut-floor','ivory-paint','dark-walnut','natural-linen','Mái rộng và hiên theo diện tích đất','Lam gỗ có nhịp, cửa trượt theo ô mở đã chốt'],
  ['tropical','coastal','sand-travertine','ivory-paint','natural-oak','natural-linen','Mái và lam che nắng theo hướng đất','Nhịp thoáng, bóng đổ sâu và vật liệu mờ'],
  ['artdeco','olive-gallery','white-marble','ivory-paint','dark-walnut','olive-velvet','Mái và diềm bậc theo phương án','Nhịp đứng, đường bậc, kim loại ấm và tương phản'],
  ['french','neo-elegance','white-marble','ivory-paint','ivory-lacquer','olive-velvet','Mái dốc theo hồ sơ mái','Cửa đứng, phào cổ điển và sắc sáng'],
  ['spanish','coastal','sand-travertine','sand-plaster','dark-walnut','natural-linen','Mái ngói sắc đất theo phương án','Vòm sâu, vữa ấm và chi tiết đất nung'],
  ['tuscan','olive-gallery','sand-travertine','sand-plaster','dark-walnut','natural-linen','Mái dốc, lớp ngói theo bản vẽ','Đá chân tường, cửa chớp và bảng màu đất'],
  ['craftsman','warm-oak','oak-floor','sand-plaster','dark-walnut','natural-linen','Mái dốc và hiên theo ranh đất','Khung gỗ rộng, chân đá và nhịp chắc'],
  ['tudor','indochine','walnut-floor','ivory-paint','dark-walnut','natural-linen','Mái hai dốc theo hồ sơ mái','Nhịp gỗ chéo trên tường sáng, giữ tỷ lệ ô mở'],
  ['barn','urban-stone','oak-floor','ivory-paint','dark-walnut','natural-linen','Mái hai dốc, đường mái liền','Ván đứng, khung tối mảnh, chi tiết tiết chế'],
  ['midcentury','mid-century','walnut-floor','ivory-paint','dark-walnut','cognac-leather','Mái thấp theo cao độ đã chốt','Nhịp ngang, gỗ ấm và đồ có chân thanh'],
  ['industrial','loft-leather','grey-concrete','grey-paint','dark-walnut','cognac-leather','Mái theo thiết kế, không suy kết cấu','Gạch trần, kim loại tối, bề mặt khoáng và da'],
  ['brutalist','urban-stone','grey-concrete','grey-paint','ivory-lacquer','natural-linen','Mái bằng theo phương án','Mảng khoáng lớn, khung sâu và ít trang trí'],
  ['coastal','coastal','oak-floor','ivory-paint','natural-oak','natural-linen','Mái nhẹ theo thiết kế','Ván sáng, khung nhẹ, màu biển làm điểm nhấn'],
  ['vietnamese','indochine','walnut-floor','sand-plaster','dark-walnut','natural-linen','Mái và hiên theo công năng','Hiên ngang, nhịp gỗ và bóng đổ ấm'],
  ['balinese','warm-oak','sand-travertine','sand-plaster','dark-walnut','natural-linen','Mái và lam theo diện tích cho phép','Lam gỗ, chân đá tự nhiên và tông đất']
 ];
 B.STYLE_SPECIFICATIONS=Object.fromEntries(rows.map(([id,collectionId,floor,wall,accent,fabric,roof,facade])=>[id,{
  id,revision,collectionId,defaultMaterials:{floor,wall,accent,fabric},
  roofIntent:roof,facadeIntent:facade,
  proportions:'Giữ số đo đất, tầng, phòng và ô mở đã chốt; bố cục chi tiết thích ứng bề ngang mặt tiền.',
  paletteIntent:'Bảng màu từ phong cách và bề mặt gợi ý; màu khách chỉnh có ưu tiên.',
  climateChecks:['Hướng nắng và che nắng','Thoát nước và chống thấm','Độ bền vật liệu tại khu đất'],
  limitations:['Không tự sinh thêm diện tích hiên hoặc khối đua ngoài ranh cho phép.','Mái, kết cấu và vật liệu ngoài trời cần hồ sơ kỹ thuật được kiểm chứng.'],
  budgetOptions:{economy:'Giảm số loại hoàn thiện và chi tiết trang trí; so sản phẩm tương đương có báo giá.',upgrade:'Tăng chất lượng bề mặt tại các vị trí điểm nhấn; chốt mẫu và quy cách trước đặt hàng.',savingsVnd:null},
  acceptance:{exterior:'pending',interior:'pending',supplierSamples:'pending'},
  source:{type:'BMH-design-brief',engineeringApproved:false}
 }]));
 B.STYLE_MATERIAL_ROLES=[
  {id:'roof',name:'Mái',category:'roof',quantityUnit:'m²',requirements:['Loại mái và độ dốc','Khổ hữu dụng / số viên trên m²','Thoát nước, lớp cách nhiệt và chống thấm']},
  {id:'facade',name:'Mặt ngoài',category:'paint',quantityUnit:'m²',requirements:['Sơn / lớp ốp ngoài trời','Hệ nền, lớp lót và định mức','Độ bền theo khí hậu']},
  {id:'openings',name:'Cửa & kính',category:'door',quantityUnit:'m²',requirements:['Hệ khung, kính và phụ kiện','Kích thước thông thủy','Kiểu mở theo bản vẽ']},
  {id:'floor',name:'Sàn khô',category:'floor',surfaceSlot:'floor',quantityUnit:'m²',requirements:['Kích thước tấm / viên','Vật liệu, bề mặt và lớp nền','Mạch, cách lát và hao hụt']},
  {id:'wall',name:'Tường trong',category:'paint',surfaceSlot:'wall',quantityUnit:'m²',requirements:['Mã màu, độ bóng','Hệ lớp và định mức','Phân biệt tường khô / ẩm']},
  {id:'ceiling',name:'Trần',category:null,quantityUnit:'m²',requirements:['Hệ trần, khung và tấm','Cao độ và hốc kỹ thuật','Khả năng chống ẩm / yêu cầu kỹ thuật']},
  {id:'joinery',name:'Gỗ & tủ',category:'cabinetry',surfaceSlot:'accent',quantityUnit:null,requirements:['Mã bề mặt, lõi ván, độ dày','Kích thước và phụ kiện từng món','Xử lý cạnh và môi trường sử dụng']},
  {id:'upholstery',name:'Vải & bọc',category:null,surfaceSlot:'fabric',quantityUnit:null,requirements:['Mã vải / da','Kích thước đồ và lượng vật liệu','Mẫu màu, độ bền và cách vệ sinh']},
  {id:'wetArea',name:'Khu ướt',category:'floor',quantityUnit:'m²',requirements:['Chỉ tiêu chống trượt được xác nhận','Độ dốc và thoát nước','Hệ chống thấm / keo / mạch']},
  {id:'stairs',name:'Hoàn thiện thang',category:'floor',quantityUnit:null,requirements:['Chi tiết mặt bậc, cổ bậc và mũi bậc','Chống trượt','Bản vẽ lan can / tay vịn']}
 ];
 B.styleSpecification=(id=B.houseStyle?.()?.id)=>{
  const row=B.STYLE_SPECIFICATIONS[id],style=B.HOUSE_STYLES.find(x=>x.id===id);if(!row||!style)return null;
  return {...structuredClone(row),name:style.name,wallColor:style.wall,accentColor:style.accent,description:style.description,roofForm:style.form};
 };
 B.styleMaterialMatrix=(id=B.houseStyle?.()?.id)=>{
  const spec=B.styleSpecification(id);if(!spec)return [];
  return B.STYLE_MATERIAL_ROLES.map(role=>{
   const profileId=role.surfaceSlot?spec.defaultMaterials[role.surfaceSlot]:role.id==='wetArea'?'sand-travertine':role.id==='stairs'?spec.defaultMaterials.floor:null;
   const preview=B.VISUAL_MATERIALS?.find(x=>x.id===profileId);
   const category=role.id==='roof'&&['flat','offset'].includes(spec.roofForm)?'waterproof':role.category;
   return {...structuredClone(role),category,styleId:id,briefRevision:revision,profileId:preview?.id||null,visualPreview:preview?{id:preview.id,name:preview.name,kind:preview.kind,realWorldScale:[...preview.scale],exactness:'generic',textureAssetId:null}:null,
    intent:role.id==='roof'?spec.roofIntent:role.id==='facade'?spec.facadeIntent:preview?.detail||spec.paletteIntent,
    quantity:null,quantityBasis:null,selectedProductId:null,sku:null,specification:null,productUnit:null,priceEvidence:null,
    supplierSampleConfirmed:false,engineeringApproved:false};
  });
 };
 B.styleMaterialCompatibility=(product,{styleId=B.houseStyle?.()?.id,roleId=null}={})=>{
  const spec=B.styleSpecification(styleId),role=roleId?B.styleMaterialMatrix(styleId).find(x=>x.id===roleId):null;
  if(!spec)return {status:'unknown-style',recommended:false,reason:'Phong cách riêng cần chốt hồ sơ vật liệu.'};
  if(!product?.category)return {status:'missing-product',recommended:false,reason:'Chưa có sản phẩm để đối chiếu.'};
  if(roleId&&!role||role&&product?.category!==role.category)return {status:'different-role',recommended:false,reason:'Sản phẩm không thuộc nhóm vật liệu của vị trí này.'};
  if(Array.isArray(product?.styleIds)&&product.styleIds.length)return product.styleIds.includes(styleId)?{status:'design-suggestion',recommended:true,reason:'Danh mục gợi ý theo phong cách; cần đối chiếu mẫu và quy cách.'}:{status:'different-style',recommended:false,reason:'Danh mục đang gợi ý sản phẩm này cho phong cách khác.'};
  return {status:'needs-sample',recommended:null,reason:'Chưa đối chiếu mẫu, màu và quy cách với phong cách này.'};
 };
 // Read-only C02 bridge. A supplies measured quantities/conversions and project quotes.
 B.styleMaterialSchedule=(project=B.state.project,{products=B.materialResearch?.products||[]}={})=>{
  const style=B.HOUSE_STYLES.find(x=>x.name===project.style||x.id===project.style),spec=B.styleSpecification(style?.id??null),choices=project.materials?.choices||{},overrides=project.dataEngine?.materialOverrides||{};
  const rows=B.styleMaterialMatrix(style?.id??null).map(row=>{
   const id=choices[row.category],product=overrides[id]?.product||products.find(x=>x.id===id&&x.category===row.category);
   if(!product||product.id!==id||product.category!==row.category)return {...row,selectionStatus:id?'unresolved':'missing',missing:['product','specification','price','quantity']};
   const evidence=B.materialPriceEvidence?.(product)||null,compatibility=B.styleMaterialCompatibility(product,{styleId:style.id,roleId:row.id});
   return {...row,selectedProductId:product.id,sku:product.sku||null,specification:product.specification||product.spec||null,productUnit:evidence?.quantityUnit||product.unit||null,priceEvidence:evidence?structuredClone(evidence):null,selectionStatus:'category-selected',applicationStatus:'requires-role-confirmation',compatibility,
    missing:[...(!product.sku?['sku']:[]),...(!(product.specification||product.spec)?['specification']:[]),...(evidence?.amountVnd===null||!evidence||evidence.priceType==='expired'?['price']:[]),'quantity','supplierSample']};
  });
  return {revision,styleId:style?.id||null,recognized:!!spec,designRevision:project===B.state.project?B.drawingRevision?.()||null:null,profile:spec,rows,bindings:structuredClone(project.materials?.finish||{}),quantityStatus:'provided-by-A',totalVnd:null,duplicatesPolicy:'Category selections can appear in several roles; do not sum without measured application and element IDs.'};
 };
})();
