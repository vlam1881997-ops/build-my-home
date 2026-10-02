BMH.installableApp={prompt:null,installed:false,ready:null};
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();BMH.installableApp.prompt=event;});
window.addEventListener('appinstalled',()=>{BMH.installableApp.installed=true;BMH.installableApp.prompt=null;BMH.toast('BMH đã được thêm vào thiết bị.');});
BMH.installBMHApp=async()=>{
 const app=BMH.installableApp;if(app.installed||window.matchMedia?.('(display-mode: standalone)').matches){BMH.toast('Bạn đang dùng BMH dưới dạng ứng dụng.');return;}
 if(app.prompt){const prompt=app.prompt;app.prompt=null;await prompt.prompt();await prompt.userChoice;return;}
 const iphone=/iPhone|iPad|iPod/i.test(navigator.userAgent||'');BMH.toast(iphone?'Chọn Chia sẻ trong Safari → Thêm vào Màn hình chính.':'Mở menu trình duyệt → Cài ứng dụng / Thêm vào màn hình chính.');
};
document.addEventListener('click',event=>{if(event.target.closest?.('[data-app-install]'))BMH.installBMHApp().catch(()=>BMH.toast('Hãy dùng menu trình duyệt để cài BMH.'));});
BMH.installableApp.ready=(async()=>{
 if(!('serviceWorker'in navigator)||!window.isSecureContext)return false;
 try{await navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});await navigator.serviceWorker.ready;return true;}
 catch(error){console.warn('BMH offline setup',error.name);return false;}
})();
