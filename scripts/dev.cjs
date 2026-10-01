require('./load-env.cjs')();
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.json':'application/json','.webmanifest':'application/manifest+json'};
http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost'),route=url.pathname;
  res.status=n=>{res.statusCode=n;return res;};
  try{
    if(/^\/api\/[a-z][a-z0-9-]*$/.test(route)){
      const file=path.join(root,(['/api/ai-health','/api/material-catalog','/api/material-search','/api/material-image'].includes(route)?'/api/ai':route)+'.mjs');if(!fs.existsSync(file)){res.writeHead(404);return res.end('Not found');}
      const mod=await import(pathToFileURL(file));return await mod.default(req,res);
    }
    const file=path.resolve(dist,'.'+decodeURIComponent(route==='/'?'/index.html':route));
    if(!file.startsWith(dist+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end('Not found');}
    res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');fs.createReadStream(file).pipe(res);
  }catch(err){res.statusCode=500;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({ok:false,error:'Local request failed.'}));console.error('[local request]',route,err.name);}
}).listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('Build My Home local: http://localhost:'+(process.env.PORT||3000)));
