const fs=require('node:fs'),path=require('node:path');const root=path.resolve(__dirname,'..'),src=path.join(root,'src'),dist=path.join(root,'dist');
const jsFiles=['00_boot.js','01_vn34_catalog.js','15_data_engine.js','10_state.js','17_cloud_payment.js','18_ai_copilot.js','19_gemini_scan.js','20_calc.js','30_planner.js','35_dossier.js','40_exports.js','45_studio3d.js','50_screens.js','60_app.js','70_v60_product_ui.js'];
const banner=`/* Build My Home Official V6 Product UI Reset
 * Existing calculation, Gemini, planner, 3D and dossier engines are retained.
 * V6 removes the stacked visual-patch chain and uses one coherent UI layer across all 10 steps while retaining the existing engines.
 */
(()=>{
'use strict';
try{
`;
const tail=`
}catch(err){
  try{globalThis.__BMH_BOOT_FAILED=true;globalThis.__BMH_BOOT_ERROR=String(err?.stack||err?.message||err);console.error('Build My Home fatal boot error',err);const a=document.getElementById('app');if(a)a.innerHTML='<div style="min-height:100vh;display:grid;place-items:center;background:#f7f9f6;font-family:Arial,sans-serif;color:#5b4037"><div style="max-width:720px;padding:28px"><h2>Build My Home gặp lỗi khởi động</h2><p>Runtime đã được nạp, nhưng một lỗi JavaScript đã dừng quá trình khởi tạo.</p><pre style="white-space:pre-wrap;background:#fff7f3;border:1px solid #efd4c6;border-radius:12px;padding:12px;font-size:12px">'+String(err?.stack||err?.message||err).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))+'</pre></div></div>'; }catch(_){}
}
})();
`;
let js=banner+jsFiles.map(f=>`\n/* ---- ${f} ---- */\n`+fs.readFileSync(path.join(src,f),'utf8')).join('\n')+tail;
const googleMapsKey=String(process.env.BMH_GOOGLE_MAPS_API_KEY||'').replace(/[^A-Za-z0-9_\-]/g,'');
js=js.replaceAll('__BMH_GOOGLE_MAPS_API_KEY__',googleMapsKey);
fs.rmSync(dist,{recursive:true,force:true});fs.mkdirSync(dist,{recursive:true});
fs.writeFileSync(path.join(dist,'app.js'),js);
const cssFiles=['styles.css','visual-v60.css'];
const css=cssFiles.map(f=>`\n/* ===== ${f} ===== */\n`+fs.readFileSync(path.join(src,f),'utf8')).join('\n');
fs.writeFileSync(path.join(dist,'styles.css'),css);
let html=fs.readFileSync(path.join(src,'index.html'),'utf8');
if(!html.includes('<!-- BMH_APP_INLINE -->'))throw Error('Missing BMH_APP_INLINE marker');
const safeJs=js.replace(/<\/script/gi,'<\\/script');
html=html.replace('<!-- BMH_APP_INLINE -->',`<script id="bmh-inline-app">${safeJs}</script>`);
fs.writeFileSync(path.join(dist,'index.html'),html);
fs.copyFileSync(path.join(src,'sw.js'),path.join(dist,'sw.js'));
fs.copyFileSync(path.join(src,'manifest.webmanifest'),path.join(dist,'manifest.webmanifest'));
fs.cpSync(path.join(root,'assets'),path.join(dist,'assets'),{recursive:true});fs.writeFileSync(path.join(dist,'.nojekyll'),'');
console.log(`Built V6 Product UI Reset -> ${dist}`);
