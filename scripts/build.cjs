const fs=require('node:fs'),path=require('node:path');const root=path.resolve(__dirname,'..'),src=path.join(root,'src'),dist=path.join(root,'dist');
const jsFiles=['00_boot.js','10_state.js','20_calc.js','30_planner.js','40_exports.js','50_screens.js','60_app.js'];
const banner=`/* Build My Home Official V3.8 Climate-Adaptive Design
 * One state controller · one navigation controller · one planner controller · one runtime bundle.
 * Critical runtime is also embedded into index.html to bypass stale service-worker/app.js cache failures.
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
const js=banner+jsFiles.map(f=>`
/* ---- ${f} ---- */
`+fs.readFileSync(path.join(src,f),'utf8')).join('\n')+tail;
fs.rmSync(dist,{recursive:true,force:true});fs.mkdirSync(dist,{recursive:true});
fs.writeFileSync(path.join(dist,'app.js'),js);
fs.copyFileSync(path.join(src,'styles.css'),path.join(dist,'styles.css'));
let html=fs.readFileSync(path.join(src,'index.html'),'utf8');
if(!html.includes('<!-- BMH_APP_INLINE -->'))throw Error('Missing BMH_APP_INLINE marker');
const safeJs=js.replace(/<\/script/gi,'<\\/script');
html=html.replace('<!-- BMH_APP_INLINE -->',`<script id="bmh-inline-app">${safeJs}</script>`);
fs.writeFileSync(path.join(dist,'index.html'),html);
fs.copyFileSync(path.join(src,'sw.js'),path.join(dist,'sw.js'));
fs.copyFileSync(path.join(src,'manifest.webmanifest'),path.join(dist,'manifest.webmanifest'));
fs.cpSync(path.join(root,'assets'),path.join(dist,'assets'),{recursive:true});fs.writeFileSync(path.join(dist,'.nojekyll'),'');
console.log(`Built V3.8 Climate-Adaptive Design -> ${dist}`);
