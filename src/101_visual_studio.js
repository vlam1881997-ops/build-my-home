/* Presentation only: keep measured design, saved projects and service handlers. */
(()=>{
 const B=BMH,esc=B.esc;
 const template=html=>{const t=document.createElement('template');t.innerHTML=html;return t;};
 const element=html=>template(html).content.firstElementChild;
 const icons=[
  '<path d="m3 10 9-7 9 7v10H3zM9 20v-7h6v7"/>',
  '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  '<circle cx="9" cy="7" r="3"/><path d="M3 20v-3a6 6 0 0 1 12 0v3M17 4a3 3 0 0 1 0 6m1 4a5 5 0 0 1 3 4v2"/>',
  '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h9V3m0 9v9m0-6h9"/>',
  '<path d="m12 3 10 5-10 5L2 8zM2 12l10 5 10-5M2 16l10 5 10-5"/>',
  '<path d="m12 2 9 5v10l-9 5-9-5V7zM3 7l9 5 9-5m-9 5v10"/>',
  '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8M8 10h2m4 0h2m-8 4h2m4 0h2m-8 4h2m4 0h2"/>',
  '<path d="m2 8 10-6 10 6H2ZM4 10v8m5-8v8m6-8v8m5-8v8M2 22h20M2 18h20"/>',
  '<path d="M3 19h18M5 19v-7a7 7 0 0 1 14 0v7M10 5V3h4v2M12 6v7"/>',
  '<path d="M14 2H5v20h14V7zM14 2v5h5M8 12h8m-8 4h8"/>'
 ];
 const icon=i=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icons[i]+'</svg>';
 const header=B.header;
 B.header=()=>{const t=template(header()),h=t.content.firstElementChild;h.classList.add('visual-header');h.querySelector('.v6-brand small').textContent='Không gian sống của bạn';h.querySelector('.v6-brand').insertAdjacentHTML('afterend','<div class="visual-project-heading"><span>DỰ ÁN ĐANG THIẾT KẾ</span><b>'+esc(B.state.project.name||'Ngôi nhà của tôi')+'</b></div>');return t.innerHTML;};
 B.stepper=()=>{const p=B.state.project,step=B.state.ui.step;return '<nav class="v6-stepper guided-stepper guided-ten-tabs visual-navigation" aria-label="10 chức năng dự án"><div class="visual-nav-heading"><span>KHÔNG GIAN LÀM VIỆC</span><b>'+esc(p.name||'Ngôi nhà của tôi')+'</b><small>Bước '+step+' / 10 · '+esc(B.GUIDED_FUNCTIONS[step-1])+'</small></div>'+B.GUIDED_FUNCTIONS.map((title,i)=>{const active=step===i+1,divider=i===3?'THIẾT KẾ':i===6?'THỰC HIỆN':'';return (divider?'<div class="visual-nav-divider">'+divider+'</div>':'')+'<button type="button" data-nav="'+(i+1)+'" class="'+(active?'active':'')+'" '+(active?'aria-current="page"':'')+'>'+icon(i)+'<span><b>'+esc(title)+'</b></span><small class="visual-nav-index" aria-hidden="true">'+String(i+1).padStart(2,'0')+'</small></button>';}).join('')+'<div class="visual-nav-note">'+esc(p.site.width+' × '+p.site.depth+' m · '+p.site.floors+' tầng')+'<br>Dự án đang mở trên thiết bị.</div></nav>';};

 // Four new inspiration photos; the other twenty styles retain their catalogue art.
 const atlas={modern:0,japandi:1,indochine:2,neo:3};
 B.studioStyleArt=style=>style&&Object.hasOwn(atlas,style.id)?'<div class="visual-style-art visual-style-art-'+atlas[style.id]+'" role="img" aria-label="'+esc('Ảnh cảm hứng · '+style.name)+'"></div>':style?B.styleIllustration(style):'<img src="assets/interior/collections/warm-oak.jpg" alt="Nội thất tham khảo · gỗ ấm" width="480" height="320">';
 const disclosure=(key,title,node)=>{if(!node)return null;const d=element(B.guidedDetails(key,title,''));d.querySelector('.guided-details-body').append(node);return d;};
 const ideas=B.screen1;
 B.screen1=()=>{
  const t=template(ideas()),root=t.content.querySelector('.v6-s1');if(!root||B.state.ui.homeMode==='finish')return t.innerHTML;
  const p=B.state.project,style=B.houseStyle(),start=root.querySelector('.step01-start'),oldHero=root.querySelector('.step01-hero'),welcome=t.content.querySelector('.design-welcome'),mode=t.content.querySelector('.finish-entry'),primary=welcome?.querySelector('[data-design-start]');
  root.classList.add('visual-ideas');welcome?.remove();mode?.remove();
  const action=p.plan.rooms.length?'<button type="button" data-nav="6">Khám phá thiết kế 3D →</button>':primary?primary.outerHTML:'<button type="button" data-nav="4">Mở bản vẽ →</button>';
  const file=oldHero?.querySelector(':scope > img'),visual=file?file.outerHTML:B.studioStyleArt(style);
  const hero=element('<section class="visual-idea-hero"><div class="visual-hero-photo">'+visual+'<span class="visual-photo-label">'+(file?'Ảnh tham khảo bạn tải lên':'Ảnh cảm hứng · '+esc(style?.name||'Nội thất gỗ ấm'))+'</span><div class="visual-hero-caption"><span>THIẾT KẾ CHO CÁCH BẠN SỐNG</span><h1>Nhà đẹp bắt đầu<br>từ ý tưởng của bạn.</h1><p>'+esc('Tham khảo đường nét và chất liệu · chưa phải thiết kế theo khu đất')+'</p></div></div><div class="visual-idea-start"><div class="visual-start-heading"><span>01 / Ý TƯỞNG</span><h2>Bạn muốn ngôi nhà<br>như thế nào?</h2><p>'+esc(p.site.width+' × '+p.site.depth+' m · '+p.site.floors+' tầng')+'<br>Chọn phong cách, thêm ảnh hoặc mô tả. Cùng hoàn thiện từng không gian.</p></div></div></section>');
  oldHero?.remove();root.prepend(hero);
  if(start){start.querySelector('.v6-title')?.remove();const upload=start.querySelector('.step01-upload-actions'),connection=start.querySelector('.step01-connection');upload?.remove();connection?.remove();const area=hero.querySelector('.visual-idea-start');area.append(start);if(upload)area.append(disclosure('idea-file-types','Ảnh, video & PDF',upload));if(connection)area.append(disclosure('idea-ai-status','Trạng thái AI & tìm mẫu',connection));}
  const styles=element('<section class="visual-style-gallery"><div class="visual-section-heading"><div><span>TÌM PHONG CÁCH CỦA BẠN</span><h2>Một ngôi nhà. Nhiều cách sống.</h2></div><span>Ảnh tham khảo phong cách</span></div><div class="visual-style-grid">'+['modern','japandi','indochine','neo'].map(id=>{const s=B.HOUSE_STYLES.find(s=>s.id===id);return '<button type="button" class="visual-style-card" data-design-style="'+id+'" aria-pressed="'+(style?.id===id)+'">'+B.studioStyleArt(s)+'<span><b>'+esc(s.name)+'</b><small>'+esc({modern:'Gọn gàng · ánh sáng · không gian mở',japandi:'Gỗ ấm · tĩnh tại · chất liệu tự nhiên',indochine:'Hoài niệm · mây đan · nét Việt',neo:'Thanh lịch · cân xứng · chi tiết nhẹ'}[id])+'</small></span><em>'+(style?.id===id?'Đang chọn':'Chọn phong cách ↗')+'</em></button>';}).join('')+'</div></section>');
  hero.after(styles);
  const allStyles=t.content.querySelector('.house-styles')||element(B.houseStylePanel());if(allStyles){allStyles.dataset.guidedPanel='all-house-styles';allStyles.open=Boolean(B.state.ui.guidedPanels?.['all-house-styles']);allStyles.querySelector('summary em').textContent='Xem đủ 24 phong cách';styles.append(allStyles);}
  const summary=root.querySelector('.step01-ai');if(summary){summary.remove();root.append(disclosure('idea-project-summary','Hồ sơ dự án & thông tin đã phân tích',summary));}
  const source=root.querySelector('.step01-reference');if(source&&!(B.v6.uploads||[]).length){source.remove();root.append(disclosure('idea-reference-files','Tài liệu tham khảo của bạn',source));}
  const prelim=root.querySelector('.step01-prelim');if(prelim){prelim.remove();root.append(disclosure('idea-preliminary','Đánh giá sơ bộ & dữ liệu còn thiếu',prelim));}
  const callout=element('<section class="visual-design-next"><div><span>TIẾP TỤC VỚI THIẾT KẾ</span><h2>'+ (p.plan.rooms.length?'Mặt bằng đã có. Khám phá ngôi nhà của bạn.':'Đưa ý tưởng thành phương án bố trí.')+'</h2><p>Phòng, cửa, vật liệu và mô hình 3D cùng dùng một thiết kế.</p></div>'+action+'</section>');styles.after(callout);if(p.plan.rooms.length&&primary)root.append(disclosure('idea-new-proposal','Gợi ý một phương án bố trí khác',primary));
  if(mode){mode.querySelector('h2').textContent='Thiết kế mới hoặc hoàn thiện nhà thô';mode.querySelector('p')?.remove();root.append(disclosure('idea-home-mode','Bạn đã có nhà đang xây?',mode));}
  const mood=t.content.querySelector('.customer-moodboard');if(mood){mood.classList.add('visual-idea-moodboard');mood.remove();root.append(disclosure('idea-current-finishes','Phong cách & vật liệu đang chọn',mood));}
  return t.innerHTML;
 };B.SCREENS[0]=B.screen1;

 // Put the live model and drawing first. Inspiration stays available below them.
 for(const [name,index,selector]of [['screen5',3,'.v6-s5'],['screen7',5,'.design-studio']]){
  const screen=B[name];B[name]=()=>{const t=template(screen()),root=t.content.querySelector(selector),mood=t.content.querySelector('.customer-moodboard');if(root){root.classList.add('visual-design-workspace');if(mood){mood.remove();root.after(mood);mood.classList.add('visual-secondary-moodboard');}if(name==='screen7'){const canvas=root.querySelector('.design-canvas'),exports=root.querySelector('.architectural-render-controls');if(canvas&&exports)(canvas.closest('.model-scene-wrap')||canvas).after(exports);}if(name==='screen5'&&B.state.project.plan.rooms.length){root.classList.add('visual-plan-ready');for(const selector of ['.design-planner-proposals','.measured-contract']){const node=root.querySelector(selector);if(node)root.append(node);}const title=root.querySelector('.v72-plan-intro h2');if(title)title.textContent='Mặt bằng tầng '+(Number(B.state.ui.planner.floor)+1);}}return t.innerHTML;};B.SCREENS[index]=B[name];
 }
 B.materialContext=()=>{
  const p=B.state.project,categories=Object.entries(p.materials?.choices||{}).filter(([,id])=>id);
  const priced=categories.filter(([category,id])=>{
   const product=B.catalogSelectedProduct?.(category),quote=p.dataEngine?.materialOverrides?.[id];
   // Use the same evidence parser as product cards; absent/expired prices are not zero.
   const reference=product&&B.materialPriceEvidence?.(product);
   const entered=quote&&B.materialPriceEvidence?.({id,unit:quote.unit,priceEvidence:{...quote.priceEvidence,amountVnd:quote.value,quantityUnit:quote.unit,priceType:'project-quote'}});
   const hasPrice=e=>e&&typeof e.amountVnd==='number'&&Number.isFinite(e.amountVnd)&&e.amountVnd>=0&&e.quantityUnit&&e.priceType!=='expired';
   return hasPrice(entered)||hasPrice(reference);
  }).length;
  return {style:B.houseStyle?.()?.name||p.style||'Chưa chọn',surfaces:B.modelTraceability?.().materialProfileIds.length||0,products:categories.length,priced};
 };
 B.materialContextHtml=()=>{const x=B.materialContext();return '<aside class="visual-material-context" data-material-context aria-label="Liên kết phong cách, vật liệu và giá"><div><span>PHONG CÁCH ĐANG THEO</span><b>'+esc(x.style)+'</b><small>Ưu tiên sản phẩm hợp ngôn ngữ thiết kế</small></div><div><span>BỀ MẶT 3D</span><b>'+x.surfaces+' lựa chọn đang gắn</b><small>Theo bảng vật liệu của thiết kế hiện tại</small></div><div><span>GIÁ THAM KHẢO</span><b>'+(x.products?x.products+' nhóm đã chọn':'Chưa chọn sản phẩm')+'</b><small>'+(x.products?x.priced+'/'+x.products+' nhóm có dữ liệu đơn giá; chưa xác nhận dự toán':'Mỗi thẻ sản phẩm hiển thị giá và nguồn')+'</small></div><p>Vân và màu trên 3D là mô phỏng theo tỷ lệ. Khi chốt thi công cần xác nhận mẫu thật, mã hàng, quy cách và báo giá nhà cung cấp.</p></aside>';};
 const materials=B.screen6;B.screen6=()=>{const t=template(materials()),root=t.content.querySelector('.v6-s6');if(root){root.classList.add('visual-showroom');const head=root.querySelector('.v6-mat-head'),h=head?.querySelector('h1');if(h)h.textContent='Vật liệu cho ngôi nhà của bạn';head?.insertAdjacentHTML('afterend',B.materialContextHtml());const nav=root.querySelector('.v6-mat-nav');if(nav){nav.dataset.guidedPanel='material-categories';nav.classList.add('visual-material-categories');}for(const selector of ['.v70-quote-panel','.v70-quote-sources']){const node=root.querySelector(selector);if(node){node.replaceWith(disclosure(selector==='.v70-quote-panel'?'material-quote-import':'material-quote-sources',selector==='.v70-quote-panel'?'Nhập báo giá của nhà cung cấp':'Nguồn công bố để đối chiếu vùng',node.cloneNode(true)));}}}return t.innerHTML;};B.SCREENS[4]=B.screen6;
 const render=B.render;B.render=opts=>{const result=render(opts);window.requestAnimationFrame?.(()=>{if(!window.matchMedia?.('(max-width: 760px)')?.matches)return;const nav=document.querySelector('.visual-navigation'),active=nav?.querySelector('button.active');if(nav&&active)nav.scrollLeft=Math.max(0,active.offsetLeft-(nav.clientWidth-active.clientWidth)/2);});return result;};
 document.addEventListener('click',e=>{const card=e.target.closest?.('[data-design-style]');if(!card)return;if(B.selectHouseStyle(card.dataset.designStyle)){B.save();B.render({preserveScroll:true});B.toast('Đã chọn '+B.state.project.style+'.');}});
})();
