/* Manual vendoring only; deployment uses the committed bundle. */
const fs=require('node:fs'),path=require('node:path');
const upstream=process.argv[2],dependencyRoot=process.argv[3];
if(!upstream||!dependencyRoot)throw Error('Usage: node scripts/vendor-architect3d.cjs /path/to/pinned/architect3d /path/to/build/node_modules');
const esbuild=require(path.join(dependencyRoot,'esbuild'));
esbuild.build({entryPoints:[path.join(upstream,'src/scripts/blueprint.js')],bundle:true,format:'iife',globalName:'BP3DJS',minify:true,outfile:path.join(__dirname,'../assets/architect3d/architect3d.js'),nodePaths:[dependencyRoot],plugins:[{name:'codecs-without-import-meta',setup(build){build.onLoad({filter:/[\\/]loaders[\\/](DRACOLoader|KTX2Loader)\.js$/},args=>({contents:fs.readFileSync(args.path,'utf8').replace(/new URL\(\s*'\.\.\/libs\/(draco|basis)\/(?:gltf\/)?([\w.]+)'\s*,\s*import\.meta\.url\s*\)\.toString\(\)/g,(_,dir,file)=>JSON.stringify('assets/architect3d/'+dir+'/'+file)),loader:'js'}));}}]}).catch(e=>{console.error(e);process.exitCode=1;});
