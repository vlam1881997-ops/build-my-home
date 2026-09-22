/* V5.0.3 FULL CLEAN · runtime config + local-first saving.
 * Cloud/payment are intentionally removed from the active product build until the core experience is finished.
 */
BMH.runtime={config:null,loading:false,error:''};
BMH.loadRuntimeConfig=async()=>{
  if(BMH.runtime.loading)return;BMH.runtime.loading=true;
  try{const r=await fetch('/api/config',{cache:'no-store'});BMH.runtime.config=r.ok?await r.json():{aiConfigured:false,geminiConfigured:false,paymentDeferred:true};BMH.runtime.error='';}
  catch(err){BMH.runtime.config={aiConfigured:false,geminiConfigured:false,paymentDeferred:true};BMH.runtime.error=String(err?.message||err);}
  finally{BMH.runtime.loading=false;BMH.render?.({preserveScroll:true});}
};
BMH.saveProjectLocal=()=>{BMH.save();BMH.toast('Đã lưu dự án trên thiết bị này.');};
BMH.runtimeStatus=()=>BMH.runtime.config||{aiConfigured:false,geminiConfigured:false,paymentDeferred:true};
