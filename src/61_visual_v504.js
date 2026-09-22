/* V5.0.4 Visual Studio Upgrade — presentation layer only. */
BMH.VERSION='5.0.4';
BMH.VISUAL_RELEASE='demo-visual-system-2';

(()=>{
  const FALLBACK='assets/rooms/facade-render.jpg';
  const enhance=()=>{
    document.documentElement.classList.add('bmh-v504');
    document.documentElement.dataset.visualRelease=BMH.VISUAL_RELEASE;
    document.documentElement.dataset.version=BMH.VERSION;
    document.body?.classList.add('visual-studio-ready');

    const main=document.querySelector('.studio-main');
    if(main){
      const step=Number(BMH.state?.ui?.step||1);
      main.dataset.step=String(step);
      main.classList.add('visual-v504-main');
    }

    document.querySelectorAll('.studio-screen img,.native-scan-shell img').forEach((img,i)=>{
      if(!img.hasAttribute('decoding'))img.decoding='async';
      if(i>0&&!img.hasAttribute('loading'))img.loading='lazy';
      if(img.dataset.visualFallbackBound)return;
      img.dataset.visualFallbackBound='1';
      img.addEventListener('error',()=>{
        if(img.dataset.visualFallbackApplied)return;
        img.dataset.visualFallbackApplied='1';
        img.src=FALLBACK;
        img.classList.add('visual-fallback-image');
      });
    });

    const reveal=[...document.querySelectorAll('.studio-card,.decision-strip>article,.site-decision-panel>article,.material-product-row>button,.dossier-downloads>button,.home-next-actions>article')];
    reveal.forEach((el,i)=>{
      el.style.setProperty('--reveal-delay',`${Math.min(i,8)*28}ms`);
      el.classList.add('visual-reveal');
    });
  };

  const oldAfter=BMH.afterRender;
  BMH.afterRender=(...args)=>{
    const out=typeof oldAfter==='function'?oldAfter(...args):undefined;
    requestAnimationFrame(enhance);
    return out;
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>requestAnimationFrame(enhance),{once:true});
  else requestAnimationFrame(enhance);
})();
