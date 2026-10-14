const fs=require('node:fs'),path=require('node:path');const root=path.resolve(__dirname,'..');
const files=['validation','finance','estimate','design','lifecycle','workflow','home'];let exportedNames=[];
const bodies=files.map(f=>{const s=fs.readFileSync(path.join(root,'domain-kit/src',f+'.mjs'),'utf8');exportedNames.push(...[...s.matchAll(/export (?:function|const) (\w+)/g)].map(m=>m[1]));return s.replace(/^import .*?;\s*$/gm,'').replace(/export /g,'');});
const output='// Generated from domain-kit/src by npm run build. Do not edit.\n(()=>{\n'+bodies.join('\n')+'\nglobalThis.BMHCore={'+exportedNames.join(',')+'};\n})();\n';
const target=path.join(root,'dist/core.js');if(process.argv.includes('--check')){if(fs.readFileSync(target,'utf8')!==output)throw Error('core.js out of date: npm run build');}else fs.writeFileSync(target,output);
