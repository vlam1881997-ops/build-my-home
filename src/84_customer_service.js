/* Optional final service checkout. The ten design steps stay open during trial. */
BMH.SERVICE_ORDERS_KEY='bmh-guest-service-orders';
BMH.service={busy:false,open:false,error:'',notice:'',orders:[],pending:null};
BMH.safeServicePayUrl=order=>{try{const u=new URL(order.payUrl),origin=order.sandbox===true?'https://test-payment.momo.vn':'https://payment.momo.vn';return u.origin===origin&&!u.username&&!u.password?u.href:'';}catch{return '';}};
try{const saved=JSON.parse(localStorage.getItem(BMH.SERVICE_ORDERS_KEY)||'{}');BMH.service.orders=Array.isArray(saved.orders)?saved.orders.filter(x=>/^[a-f0-9]{64}$/.test(x?.token||'')&&/^bmh-[a-f0-9-]{36}$/.test(x?.order?.id||'')).slice(0,30):[];BMH.service.pending=/^[a-f0-9]{64}$/.test(saved.pending?.token||'')&&/^[a-f0-9]{64}$/.test(saved.pending?.designKey||'')?saved.pending:null;}catch{}
BMH.serviceConfig=()=>BMH.cloud?.config?.guestService||{enabled:false};
BMH.persistServiceOrders=()=>{try{localStorage.setItem(BMH.SERVICE_ORDERS_KEY,JSON.stringify({orders:BMH.service.orders,pending:BMH.service.pending}));}catch{throw new Error('Chưa giữ được mã đơn trên thiết bị. Hãy cho phép lưu trước khi thanh toán.');}};
BMH.serviceApi=async(body,token)=>{
 const response=await fetch('/api/ai?operation=checkout',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(body),signal:AbortSignal.timeout(80000)});const data=await response.json();if(!response.ok||!data.ok)throw Object.assign(new Error(data.error||'Chưa xử lý được đơn dịch vụ.'),{status:response.status});return data;
};
BMH.serviceOrderHtml=entry=>{
 const order=entry.order,esc=BMH.esc,payUrl=BMH.safeServicePayUrl(order);
 return '<article class="customer-service-order"><b>'+esc(order.title)+'</b><p>'+esc(order.projectName)+' · '+BMH.money(order.amount)+'</p><small>Mã đơn: '+esc(order.id)+'</small>'+(order.sandbox?'<p class="customer-service-test">Đơn thử nghiệm MoMo · chưa thu tiền thật.</p>':'')+'<p role="status">'+(order.paid?'Đã xác nhận thanh toán; phương án chốt được giữ trong đơn dịch vụ.':'Chưa xác nhận thanh toán. Thiết kế trên thiết bị vẫn dùng được.')+'</p><div class="customer-project-tools">'+(!order.paid&&payUrl?'<a href="'+esc(payUrl)+'" rel="noreferrer" class="customer-service-pay">Mở thanh toán MoMo</a>':'')+'<button data-service-status="'+esc(order.id)+'">Kiểm tra trạng thái</button>'+(order.paid?'<button data-service-receipt="'+esc(order.id)+'">Tải bản xác nhận dịch vụ</button>':'')+'</div></article>';
};
BMH.serviceDialogHtml=()=>{
 const service=BMH.service,cfg=BMH.serviceConfig(),esc=BMH.esc;
 return '<header><div><small>BUILD MY HOME</small><h2 id="customerServiceTitle">Chốt phương án · nhận dịch vụ</h2><p>Chỉ thanh toán sau khi bạn hài lòng với ngôi nhà đang thiết kế.</p></div><button data-service-close aria-label="Đóng">×</button></header>'+(service.error?'<p class="customer-project-error" role="alert">'+esc(service.error)+'</p>':'')+(service.notice?'<p role="status">'+esc(service.notice)+'</p>':'')+(cfg.sandbox?'<p class="customer-service-test">Đang dùng MoMo thử nghiệm. Đây chưa phải giao dịch thu tiền thật.</p>':'')+(cfg.enabled?'<form id="customerServiceForm"><div class="customer-service-quote"><b>'+esc(cfg.title||'Dịch vụ thiết kế BMH')+'</b><strong>'+BMH.money(cfg.amount||0)+'</strong><p>Phương án: '+esc(BMH.state.project.name)+'</p></div><label>Họ tên<input name="name" maxlength="120" autocomplete="name" required></label><label>Số điện thoại<input name="phone" type="tel" autocomplete="tel" required></label><label class="customer-service-accept"><input name="accepted" type="checkbox" required><span>Tôi hài lòng với phương án hiện tại và đồng ý gửi thiết kế cùng thông tin liên hệ để BMH xử lý dịch vụ.</span></label><button type="submit" '+(service.busy||!cfg.enabled?'disabled':'')+'>'+(service.busy?'Đang giữ đơn dịch vụ…':'Chốt phương án và tạo đơn MoMo')+'</button></form>':'<p>Việc tạo đơn mới đang tạm ngưng; các đơn đã lưu vẫn kiểm tra và tải được.</p>')+(service.pending?'<button data-service-recover>Khôi phục đơn đang gửi</button>':'')+'<div class="customer-service-orders">'+service.orders.map(BMH.serviceOrderHtml).join('')+'</div>';
};
BMH.paintServiceDialog=()=>{const d=BMH.$('#customerService');if(!d||!BMH.service.open)return;const form=d.querySelector('form'),values=form?new FormData(form):null;d.innerHTML=BMH.serviceDialogHtml();if(values){for(const name of ['name','phone'])d.querySelector('[name="'+name+'"]').value=String(values.get(name)||'');d.querySelector('[name="accepted"]').checked=values.has('accepted');}};
BMH.openServiceDialog=()=>{
 if(!BMH.serviceConfig().enabled&&!BMH.service.orders.length&&!BMH.service.pending){BMH.toast('Dịch vụ chưa mở; bạn vẫn có thể thiết kế và lưu dự án.');return;}
 let dialog=BMH.$('#customerService');if(!dialog){dialog=document.createElement('dialog');dialog.id='customerService';dialog.className='customer-project-dialog';dialog.setAttribute('aria-labelledby','customerServiceTitle');document.body.appendChild(dialog);dialog.addEventListener('close',()=>{BMH.service.open=false;});}BMH.service.open=true;BMH.paintServiceDialog();if(!dialog.open)dialog.showModal();
};
BMH.acceptServiceOrder=(data,token)=>{
 const service=BMH.service,order=data.order;
 if(!order||!/^bmh-[a-f0-9-]{36}$/.test(order.id||''))throw new Error('Phản hồi đơn dịch vụ không hợp lệ.');
 if(order.payUrl&&!BMH.safeServicePayUrl(order))throw new Error('Đường dẫn MoMo không hợp lệ.');
 const designKey=service.pending?.designKey||service.orders.find(x=>x.order.id===order.id)?.designKey||'';
 service.orders=[{order,token,designKey},...service.orders.filter(x=>x.order.id!==order.id)].slice(0,30);service.pending=null;service.notice=data.notice||'';BMH.persistServiceOrders();BMH.paintServiceDialog();
};
BMH.createServiceOrder=async form=>{
 const service=BMH.service;if(service.busy)return;const values=new FormData(form);if(!form.reportValidity()||!values.has('accepted'))return;
 service.busy=true;service.error='';
 try{
  await BMH.saveCustomerProject();
  const design=BMH.projectSnapshot(BMH.state),bytesKey=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(design.project))),key=Array.from(new Uint8Array(bytesKey),b=>b.toString(16).padStart(2,'0')).join('');
  if(service.pending){const token=service.pending.token;try{const recovered=await BMH.serviceApi({action:'recover'},token);BMH.acceptServiceOrder(recovered,token);service.notice='Đã khôi phục đơn trước. Hãy kiểm tra đơn này trước khi thanh toán.';return;}catch(error){if(error.status!==404)throw error;service.pending.designKey=key;}}
  const existing=service.orders.find(x=>x.designKey===key);if(existing){service.notice='Phương án này đã có đơn dịch vụ. Hãy dùng đơn đã lưu ở bên dưới.';return;}
  if(!service.pending){const bytes=crypto.getRandomValues(new Uint8Array(32)),token=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');service.pending={token,designKey:key};BMH.persistServiceOrders();}
  BMH.paintServiceDialog();const token=service.pending.token,data=await BMH.serviceApi({action:'create',design,customer:{name:values.get('name'),phone:values.get('phone')},accepted:true},token);BMH.acceptServiceOrder(data,token);
 }catch(error){service.error=error.message;}
 finally{service.busy=false;BMH.paintServiceDialog();}
};
BMH.checkServiceOrder=async id=>{
 const service=BMH.service,entry=service.orders.find(x=>x.order.id===id);if(!entry||service.busy)return;service.busy=true;service.error='';BMH.paintServiceDialog();
 try{const data=await BMH.serviceApi({action:'status',orderId:id},entry.token);BMH.acceptServiceOrder(data,entry.token);}catch(error){service.error=error.message;}finally{service.busy=false;BMH.paintServiceDialog();}
};
BMH.recoverServiceOrder=async()=>{const s=BMH.service;if(!s.pending||s.busy)return;s.busy=true;s.error='';BMH.paintServiceDialog();try{const token=s.pending.token;BMH.acceptServiceOrder(await BMH.serviceApi({action:'recover'},token),token);}catch(error){s.error=error.message;}finally{s.busy=false;BMH.paintServiceDialog();}};
const serviceStep10=BMH.SCREENS[9];BMH.SCREENS[9]=()=>serviceStep10()+(BMH.serviceConfig().enabled||BMH.service.orders.length||BMH.service.pending?'<section class="customer-service-entry"><div><h2>Hài lòng với phương án này?</h2><p>Chốt bản thiết kế hiện tại để nhận dịch vụ. Không cần tạo tài khoản.</p></div><button data-service-open>'+ (BMH.serviceConfig().enabled?'Xem dịch vụ · '+BMH.money(BMH.serviceConfig().amount):'Mở đơn dịch vụ đã lưu')+'</button></section>':'');
document.addEventListener('submit',event=>{if(event.target.id==='customerServiceForm'){event.preventDefault();BMH.createServiceOrder(event.target);}});
document.addEventListener('click',event=>{
 const b=event.target.closest?.('[data-service-open],[data-service-close],[data-service-status],[data-service-receipt],[data-service-recover]');if(!b)return;
 if('serviceRecover'in b.dataset)return BMH.recoverServiceOrder();
 if('serviceOpen'in b.dataset)return BMH.openServiceDialog();if('serviceClose'in b.dataset)return BMH.$('#customerService')?.close();if('serviceStatus'in b.dataset)return BMH.checkServiceOrder(b.dataset.serviceStatus);
 const entry=BMH.service.orders.find(x=>x.order.id===b.dataset.serviceReceipt);if(entry)BMH.serviceApi({action:'receipt',orderId:entry.order.id},entry.token).then(data=>BMH.download('BMH-don-dich-vu-'+entry.order.id+'.json',JSON.stringify(data,null,2),'application/json')).catch(error=>{BMH.service.error=error.message;BMH.paintServiceDialog();});
});
// Redirect parameters only select a locally owned order; the server confirms it.
try{const returned=new URL(location.href).searchParams.get('momoReturn');if(BMH.service.orders.some(x=>x.order.id===returned))BMH.checkServiceOrder(returned);}catch{}
