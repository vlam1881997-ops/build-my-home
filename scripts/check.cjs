// No third-party dependencies. Run: node scripts/check.cjs
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.resolve(__dirname,'..');let source=['core.js','app.js','scene3d.js','upgrade.js'].map(f=>fs.readFileSync(path.join(root,'dist',f),'utf8')).join('\n');
const element={addEventListener(){},innerHTML:'',style:{}};const storage=new Map();
const context={document:{querySelector(){return element}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},structuredClone,Intl,console,Blob,TextEncoder,URL,setTimeout,clearTimeout,navigator:{},location:{protocol:"file:",hostname:""}};
vm.createContext(context);vm.runInContext(source,context);const run=code=>vm.runInContext(code,context);const results=[];
function check(name,fn){fn();results.push(name);}
check('10 screen templates render with default project',()=>{assert.equal(run('screens.length'),10);assert(run('screens.every(screen=>typeof screen(calc())==="string"&&screen(calc()).length>100)'));});
check('Annuity known case: 120000 at 1% monthly for 12 months',()=>{assert(Math.abs(run('payment(120000,.01,12)')-10661.854641)<.001);});
check('Zero interest and zero loan',()=>{assert.equal(run('payment(1200,0,12)'),100);assert.equal(run('payment(0,.01,12)'),0);});
check('Rate changes preserve principal and end at zero balance',()=>{assert(run('Math.abs(schedule().reduce((n,r)=>n+r.principal,0)-state.loan*1e6)<.01'));assert(run('schedule().at(-1).balance<.01'));assert(run('schedule()[12].total>schedule()[0].total'));});
check('Cash remainder subtracts living costs and all modeled debt',()=>{assert.equal(run('calc().remainder'),run('state.income*1e6-state.living*1e6-state.debt*1e6-snapshot().peakPayment'));});
check('Room resizing changes cost and undo restores rooms',()=>{const before=run('calc().total');run('history();state.rooms[0].h=3');assert(run('calc().total')<before);run('state.rooms=undoStack.pop()');assert.equal(run('calc().total'),before);});
check('Overlap detection reports colliding rooms',()=>{assert.equal(run('overlaps().length'),0);run('history();state.rooms[1].y=1');assert(run('overlaps().length')>0);run('state.rooms=undoStack.pop()');});
check('Project persistence writes complete local state',()=>{assert(run('save()'));assert.equal(JSON.parse(storage.get('bmh-v12')).rooms.length,9);});
check('JSON restoration rejects invalid geometry and money',()=>{assert.throws(()=>run('validateProject({...structuredClone(state),width:-1})'));assert.throws(()=>run('validateProject({...structuredClone(state),loan:-2})'));assert.throws(()=>run('validateProject({...structuredClone(state),rooms:[{floor:0,x:0,y:0,w:999,h:2}]})'));assert.equal(run('validateProject(structuredClone(state)).rooms.length'),9);});
check('User text is HTML escaped',()=>{context.unsafeText='<script>"&';assert.equal(run('esc(unsafeText)'),'&lt;script&gt;&quot;&amp;');});
check('All static entrypoints and PWA assets exist',()=>{for(const file of ['index.html','styles.css','app.js','core.js','scene3d.js','upgrade.js','sw.js','manifest.webmanifest','assets/house.jpg','assets/icon.svg','assets/icon-192.png','assets/icon-512.png'])assert(fs.existsSync(path.join(root,'dist',file)),file);const manifest=JSON.parse(fs.readFileSync(path.join(root,'dist/manifest.webmanifest'),'utf8'));assert(manifest.icons.every(i=>fs.existsSync(path.join(root,'dist',i.src))));});
const report={date:new Date().toISOString(),result:'passed',checks:results,browserQA:{status:'not_completed',reason:'Browser download timed out; these are VM integration tests, not browser E2E.'}};fs.writeFileSync(path.join(root,'VALIDATION.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
