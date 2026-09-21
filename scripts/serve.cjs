const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {review}=require('./ai-provider.cjs');
const root=path.resolve(__dirname,'../dist');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.webmanifest':'application/manifest+json'};
let recent=[],active=false;
const server=http.createServer(async(req,res)=>{
 const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
 const port=server.address().port;
 if(![`localhost:${port}`,`127.0.0.1:${port}`].includes(req.headers.host)){res.writeHead(403);return res.end('Invalid host');}
 let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);return res.end('Bad request');}
 if(pathname==='/api/review'){
  if(req.method!=='POST')return json(405,{error:'POST required'});
  if(req.headers.origin!==`http://${req.headers.host}`||!req.headers['content-type']?.startsWith('application/json'))return json(403,{error:'Local same-origin JSON request required'});
  recent=recent.filter(t=>Date.now()-t<60000);
  if(active||recent.length>=5)return json(429,{error:'Tối đa 5 yêu cầu/phút và một yêu cầu tại một thời điểm.'});
  if(!process.env.OPENAI_API_KEY||!process.env.OPENAI_MODEL)return json(503,{error:'Chưa cấu hình OPENAI_API_KEY và OPENAI_MODEL trong .env của máy chủ.'});
  const chunks=[];let bytes=0;
  try{
   for await(const chunk of req){bytes+=chunk.length;if(bytes>32768)return json(413,{error:'Yêu cầu tối đa 32 KB'});chunks.push(chunk);}
   const body=JSON.parse(Buffer.concat(chunks).toString('utf8'));active=true;recent.push(Date.now());
   const output=await review(body,{key:process.env.OPENAI_API_KEY,model:process.env.OPENAI_MODEL});return json(200,output);
  }catch(e){const bad=e instanceof SyntaxError||e.message.startsWith('INVALID_FACT');return json(bad?422:502,{error:bad?'Dữ liệu gửi không hợp lệ.':'AI chưa trả kết quả hợp lệ. Kiểm tra model, kết nối và hạn mức tài khoản rồi thử lại.'});}
  finally{active=false;}
 }
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end();}
 const target=path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
 if(!target.startsWith(root+path.sep)){res.writeHead(403);return res.end('Forbidden');}
 fs.stat(target,(err,stat)=>{
  if(err||!stat.isFile()){res.writeHead(404);return res.end('Not found');}
  res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
  if(req.method==='HEAD')return res.end();fs.createReadStream(target).on('error',()=>res.destroy()).pipe(res);
 });
});
server.listen(Number(process.env.PORT||8080),'127.0.0.1',()=>console.log(`Build My Home: http://localhost:${server.address().port}`));
