const fs=require('node:fs'),path=require('node:path');const root=path.resolve(__dirname,'..'),src=path.join(root,'src'),dist=path.join(root,'dist');
const jsFiles=['00_boot.js','10_state.js','20_calc.js','30_planner.js','40_exports.js','50_screens.js','60_app.js'];
const banner=`/* Build My Home V2.2 Refactored Core\n * One state controller · one navigation controller · one planner controller · one runtime bundle.\n * Generated from src/*.js. Do not patch public/app.js directly.\n */\n(()=>{\n'use strict';\n`;
const js=banner+jsFiles.map(f=>`\n/* ---- ${f} ---- */\n`+fs.readFileSync(path.join(src,f),'utf8')).join('\n')+'\n})();\n';
fs.rmSync(dist,{recursive:true,force:true});fs.mkdirSync(dist,{recursive:true});
fs.writeFileSync(path.join(dist,'app.js'),js);fs.copyFileSync(path.join(src,'styles.css'),path.join(dist,'styles.css'));fs.copyFileSync(path.join(src,'index.html'),path.join(dist,'index.html'));fs.copyFileSync(path.join(src,'sw.js'),path.join(dist,'sw.js'));fs.copyFileSync(path.join(src,'manifest.webmanifest'),path.join(dist,'manifest.webmanifest'));fs.cpSync(path.join(root,'assets'),path.join(dist,'assets'),{recursive:true});fs.writeFileSync(path.join(dist,'.nojekyll'),'');
console.log(`Built V2.2 -> ${dist}`);
