import {normalizeModelOptions} from './models.mjs';

// Only the read-only, stable model/list protocol is used. No thread or turn is
// started and no inference, login, provider or billing configuration is sent.
export async function readCodexModelCatalog(start) {
  let entry,resolve,reject;
  const response=new Promise((yes,no)=>{resolve=yes;reject=no;});
  let initialized=false,id=1,expected=1,done=false;
  const rows=[],cursors=new Set();let pages=0;
  const fail=error=>{if(done)return;done=true;reject(error);};
  const send=message=>entry.child.stdin.write(JSON.stringify(message)+'\n');
  const list=cursor=>{expected=++id;send({id:expected,method:'model/list',params:{limit:100,includeHidden:false,...(cursor?{cursor}:{})}});};
  entry=start((line,stream)=>{
    if(done || stream!=='stdout')return;
    let message;try{message=JSON.parse(line);}catch{if(line.trim())fail(Error('Phản hồi app-server Codex không phải JSON.'));return;}
    if(!message || typeof message!=='object' || Array.isArray(message)){fail(Error('Phản hồi app-server Codex không hợp lệ.'));return;}
    if(message.id!==expected)return;
    if(message.error){fail(Error('Codex chưa trả danh sách model: '+String(message.error.message || 'model/list thất bại').slice(0,1000)));return;}
    if(!Object.hasOwn(message,'result'))return;
    if(!initialized){initialized=true;send({method:'initialized',params:{}});list();return;}
    const result=message.result;
    if(!Array.isArray(result?.data) || rows.length+result.data.length>200 || ++pages>10){fail(Error('Danh sách model Codex vượt giới hạn hoặc không hợp lệ.'));return;}
    rows.push(...result.data);
    const cursor=result.nextCursor;
    if(cursor!==null && cursor!==undefined){
      if(typeof cursor!=='string' || !cursor || cursor.length>4096 || cursors.has(cursor)){fail(Error('Phân trang model Codex không hợp lệ.'));return;}
      cursors.add(cursor);list(cursor);return;
    }
    try{const options=normalizeModelOptions(rows);done=true;resolve(options);}catch(error){fail(error);}
  });
  const finished=entry.finished.then(result=>{
    if(!done)fail(Error('Codex app-server kết thúc trước khi trả danh sách model.'));
    return result;
  },error=>{fail(error);return null;});
  send({id:1,method:'initialize',params:{clientInfo:{name:'bmh_team',title:'BMH Team',version:'1.1.3'}}});
  try {
    const options=await response;
    entry.child.stdin.end();
    const shutdown=setTimeout(()=>entry.cancel(Error('Dừng app-server sau khi đọc model.')),1500);shutdown.unref?.();
    try{const result=await finished;if(!result || result.code!==0)throw Error('Codex app-server không kết thúc thành công sau khi trả model.');}finally{clearTimeout(shutdown);}
    return options;
  } catch(error) {
    entry.cancel(error);await finished;throw error;
  }
}
