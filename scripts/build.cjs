require('./load-env.cjs')();
const fs=require('node:fs'),path=require('node:path');const root=path.resolve(__dirname,'..'),src=path.join(root,'src'),dist=path.join(root,'dist');
const jsFiles=['00_boot.js','01_vn34_catalog.js','15_data_engine.js','10_state.js','17_cloud_payment.js','18_ai_copilot.js','19_gemini_scan.js','20_calc.js','30_planner.js','35_dossier.js','40_exports.js','43_scene_assets.js','44_house_styles.js','45_studio3d.js','46_architectural_render.js','50_screens.js','60_app.js','70_v60_product_ui.js','75_completion.js','76_architecture.js','77_architect3d.js','78_design_workflow.js','79_stair_design.js','80_home_finish.js','81_design_studio.js','82_customer_projects.js','83_customer_app.js','84_customer_service.js','85_interior_collections.js','86_visual_materials.js','87_elevator_design.js','88_customer_studio.js','89_guided_interface.js','90_product_polish.js','91_customer_cloud.js','92_measured_design.js','93_measured_cost.js','94_architectural_design.js','95_architectural_documents.js'];
jsFiles.push('96_vector_pdf.js','97_project_dashboard.js','98_model_presentation.js','99_customer_design.js','100_customer_experience.js','101_visual_studio.js','102_architectural_identity.js','103_real_house.js','104_style_reference.js');
const banner=`/* Build My Home Official V6.2.0 Connected Project Preview
 * Existing calculation, Gemini, planner, 3D and dossier engines are retained.
 * V6.1 fixes the production gaps found in the screen recording: blank map, portrait planner fit, image-only 3D, tiny text and broken bank logos.
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
js=js.replace("'use strict';","'use strict';\nconst BMH_CATALOG_DATA="+JSON.stringify(JSON.parse(fs.readFileSync(path.join(root,'assets/materials/official-catalog.json'),'utf8')))+";");
const googleMapsKey=String(process.env.BMH_GOOGLE_MAPS_API_KEY||'').replace(/[^A-Za-z0-9_\-]/g,'');
js=js.replaceAll('__BMH_GOOGLE_MAPS_API_KEY__',googleMapsKey);
fs.rmSync(dist,{recursive:true,force:true});fs.mkdirSync(dist,{recursive:true});
fs.writeFileSync(path.join(dist,'app.js'),js);
const cssFiles=['styles.css','visual-v60.css','architecture.css','home-finish.css','design-studio.css','customer-projects.css','interior-collections.css','customer-studio.css','guided-interface.css','product-polish.css','customer-cloud.css','measured-design.css','architectural-documents.css','project-dashboard.css','model-presentation.css','customer-design.css'];
cssFiles.push('visual-studio.css');
const css=cssFiles.map(f=>`\n/* ===== ${f} ===== */\n`+fs.readFileSync(path.join(src,f),'utf8')).join('\n');
fs.writeFileSync(path.join(dist,'styles.css'),css);
const leafletDist=path.join(root,'node_modules','leaflet','dist');
if(!fs.existsSync(path.join(leafletDist,'leaflet.js')))throw Error('Leaflet 1.9.4 is required. Run npm install before building.');
fs.cpSync(leafletDist,path.join(dist,'vendor','leaflet'),{recursive:true});
const threeModule=path.join(root,'node_modules','three','build','three.module.js');
if(!fs.existsSync(threeModule))throw Error('Three.js 0.160.1 is required. Run npm install before building.');
fs.mkdirSync(path.join(dist,'vendor','three'),{recursive:true});
fs.copyFileSync(threeModule,path.join(dist,'vendor','three','three.module.js'));
// Keep loaders local and on the same Three revision as the renderer.
const vendored=new Set();
function vendorThree(file){
 if(vendored.has(file))return;vendored.add(file);
 const target=path.join(dist,'vendor','three',file);fs.mkdirSync(path.dirname(target),{recursive:true});
 let source=fs.readFileSync(path.join(root,'node_modules','three','examples','jsm',file),'utf8');
 const relative=path.relative(path.dirname(file),'three.module.js').replaceAll('\\','/');
 source=source.replaceAll("from 'three'","from '"+(relative.startsWith('.')?relative:'./'+relative)+"'");
 for(const match of source.matchAll(/from ['"](\.[^'"]+\.js)['"]/g)){const dependency=path.posix.normalize(path.posix.join(path.posix.dirname(file),match[1]));if(dependency!=='three.module.js')vendorThree(dependency);}
 fs.writeFileSync(target,source);
}
for(const file of ['loaders/GLTFLoader.js','loaders/DRACOLoader.js','loaders/RGBELoader.js','exporters/GLTFExporter.js','utils/BufferGeometryUtils.js','geometries/RoundedBoxGeometry.js','environments/RoomEnvironment.js','postprocessing/EffectComposer.js','postprocessing/RenderPass.js','postprocessing/SSAOPass.js','postprocessing/OutputPass.js','postprocessing/ShaderPass.js','shaders/FXAAShader.js'])vendorThree(file);

// A lazy physical-render bundle uses the same Three instance as the fast viewer.
const traced=require('esbuild').buildSync({entryPoints:[path.join(src,'render-pathtracer-entry.mjs')],bundle:true,format:'esm',platform:'browser',external:['three'],write:false,legalComments:'inline',minify:true});
let tracedJs=traced.outputFiles[0].text.replaceAll('from"three"','from"./pathtracer-three.js"').replaceAll('from "three"','from "./pathtracer-three.js"');
tracedJs=tracedJs.replace(/from[ ]?["']three\/examples\/jsm\/([^"']+)["']/g,(_match,file)=>{vendorThree(file);return 'from"./'+file+'"';});
fs.writeFileSync(path.join(dist,'vendor','three','pathtracer.js'),tracedJs);
const tracerCompat=fs.readFileSync(path.join(src,'render-three-compat.mjs'),'utf8');
fs.writeFileSync(path.join(dist,'vendor','three','pathtracer-three.js'),tracerCompat);
const licences=['three-gpu-pathtracer','three-mesh-bvh'].map(name=>name+'\n'+fs.readFileSync(path.join(root,'node_modules',name,'LICENSE'),'utf8')).join('\n\n');
fs.writeFileSync(path.join(dist,'vendor','three','pathtracer-LICENSE.txt'),licences);
let html=fs.readFileSync(path.join(src,'index.html'),'utf8');
if(!html.includes('<!-- BMH_APP_INLINE -->'))throw Error('Missing BMH_APP_INLINE marker');
const safeJs=js.replace(/<\/script/gi,'<\\/script');
html=html.replace('<!-- BMH_APP_INLINE -->',()=>`<script id="bmh-inline-app">${safeJs}</script>`);
fs.writeFileSync(path.join(dist,'index.html'),html);
const assetDigest=require('node:crypto').createHash('sha256').update(js).update(css).update(tracedJs).update(tracerCompat).update(html).update(fs.readFileSync(path.join(src,'sw.js'),'utf8')).update(fs.readFileSync(path.join(src,'manifest.webmanifest'),'utf8')).digest('hex').slice(0,16);
fs.writeFileSync(path.join(dist,'sw.js'),fs.readFileSync(path.join(src,'sw.js'),'utf8').replace('__BMH_ASSET_DIGEST__',assetDigest));
fs.copyFileSync(path.join(src,'manifest.webmanifest'),path.join(dist,'manifest.webmanifest'));
fs.cpSync(path.join(root,'assets'),path.join(dist,'assets'),{recursive:true});fs.writeFileSync(path.join(dist,'.nojekyll'),'');
console.log(`Built V6.2.0 Connected Project Preview -> ${dist}`);
