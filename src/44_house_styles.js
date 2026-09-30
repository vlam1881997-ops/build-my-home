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
