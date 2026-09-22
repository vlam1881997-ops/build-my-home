const fs=require('node:fs'),path=require('node:path');const root=path.resolve(__dirname,'..'),src=path.join(root,'src'),dist=path.join(root,'dist');
const jsFiles=['00_boot.js','15_data_engine.js','10_state.js','17_cloud_payment.js','18_ai_copilot.js','19_gemini_scan.js','20_calc.js','30_planner.js','35_dossier.js','40_exports.js','45_studio3d.js','50_screens.js','60_app.js','61_visual_v504.js','62_visual_v505.js'];
const banner=`/* Build My Home Official V5.0.5 Demo Parity Upgrade
 * Existing V5.0.3 business logic retained.
 * V5.0.5 rebuilds the visible critical screens against the approved demo direction.
 */
(()=>{
'use strict';
try{
`;
const tail=`
}catch(err){
  try{globalThis.__BMH_BOOT_FAILED=true;globalThis.__BMH_BOOT_ERROR=String(err?.stack||err?.message||err);console.error('Build My Home fatal boot error',err);const a=document.getElementById('app');if(a)a.innerHTML='<div style="min-height:100vh;display:grid;place-items:center;background:#f7f9f6;font-family:Arial,sans-serif;color:#5b4037"><div style="max-width:720px;padding:28px"><h2>Build My Home gặp lỗi khởi động</h2><p>Runtime đã được nạp, nhưng một lỗi JavaScript đã dừng quá trình khởi tạo. Hãy gửi nội dung lỗi dưới đây để xử lý.</p><pre style="white-space:pre-wrap;background:#fff7f3;border:1px solid #efd4c6;border-radius:12px;padding:12px;font-size:12px">'+String(err?.stack||err?.message||err).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))+'</pre></div></div>'; }catch(_){}
}
})();
`;
let js=banner+jsFiles.map(f=>`\n/* ---- ${f} ---- */\n`+fs.readFileSync(path.join(src,f),'utf8')).join('\n')+tail;
const googleMapsKey=String(process.env.BMH_GOOGLE_MAPS_API_KEY||'').replace(/[^A-Za-z0-9_\-]/g,'');
js=js.replaceAll('__BMH_GOOGLE_MAPS_API_KEY__',googleMapsKey);
fs.rmSync(dist,{recursive:true,force:true});fs.mkdirSync(dist,{recursive:true});
fs.writeFileSync(path.join(dist,'app.js'),js);
const baseCss=fs.readFileSync(path.join(src,'styles.css'),'utf8');
const visualCss=fs.readFileSync(path.join(src,'visual-v504.css'),'utf8');
const visual505Css=fs.readFileSync(path.join(src,'visual-v505.css'),'utf8');
fs.writeFileSync(path.join(dist,'styles.css'),`${baseCss}\n\n/* ===== V5.0.4 VISUAL SYSTEM ===== */\n${visualCss}\n\n/* ===== V5.0.5 DEMO PARITY SYSTEM ===== */\n${visual505Css}\n`);
let html=fs.readFileSync(path.join(src,'index.html'),'utf8');
if(!html.includes('<!-- BMH_APP_INLINE -->'))throw Error('Missing BMH_APP_INLINE marker');
const safeJs=js.replace(/<\/script/gi,'<\\/script');
html=html.replace('<!-- BMH_APP_INLINE -->',`<script id="bmh-inline-app">${safeJs}</script>`);
fs.writeFileSync(path.join(dist,'index.html'),html);
fs.copyFileSync(path.join(src,'sw.js'),path.join(dist,'sw.js'));
fs.copyFileSync(path.join(src,'manifest.webmanifest'),path.join(dist,'manifest.webmanifest'));
fs.cpSync(path.join(root,'assets'),path.join(dist,'assets'),{recursive:true});fs.writeFileSync(path.join(dist,'.nojekyll'),'');
console.log(`Built V5.0.5 Demo Parity Upgrade -> ${dist}`);
