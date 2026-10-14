/* A5 forms only: synthetic customer-entered terms, no bank API or paid requests. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),origin='http://127.0.0.1:3139',out=process.env.BMH_EVIDENCE_OUT;
if(!out)throw Error('Set BMH_EVIDENCE_OUT');
let server,browser;const report={testOnly:true,scope:'A5 finance form and persistence',runtime:process.version,cases:[]};
(async()=>{
 fs.mkdirSync(out,{recursive:true});server=spawn(process.execPath,['scripts/dev.cjs'],{cwd:root,env:{...process.env,PORT:'3139'}});
 await new Promise((ok,no)=>{server.stdout.on('data',s=>{if(s.toString().includes('local:'))ok()});server.on('error',no);server.on('exit',c=>no(Error('server '+c)))});
 browser=await chromium.launch({executablePath:process.env.BMH_CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage']});report.browser=browser.version();
 for(const device of ['desktop','phone']){
  const context=await browser.newContext({viewport:device==='phone'?{width:390,height:844}:{width:1280,height:900},isMobile:device==='phone',hasTouch:device==='phone',serviceWorkers:'block'}),page=await context.newPage(),errors=[];
  await context.route('**/*',r=>new URL(r.request().url()).origin===origin&&!new URL(r.request().url()).pathname.startsWith('/api/')?r.continue():r.fulfill({status:503,body:'isolated test'}));page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin);await page.waitForFunction(()=>window.__BMH_BOOT_OK);await page.evaluate(()=>BuildMyHome.projects.ready);
  const revision=await page.evaluate(()=>{const B=BuildMyHome;B.state.ui.onboardingComplete=true;B.state.ui.step=8;B.render();return B.drawingRevision()});
  const form=page.locator('[data-team-a-loan]');await form.waitFor();
  for(const [name,value]of Object.entries({months:'12',principal:'120000000',graceMonths:'0',rates:'1=12',draws:'1=120000000',fees:'',prepayments:'3=18000000:360000',construction:'1=80000000',effectiveAt:'2026-10-01',source:'TEST-ONLY customer terms'}))await form.locator('[name="'+name+'"]').fill(value);
  await form.locator('[name="method"]').selectOption('equal_principal');await form.locator('[name="confirmed"]').check();await form.locator('button').click();
  const read=()=>page.evaluate(()=>({scenario:BuildMyHome.state.project.finance.scenario,loan:BuildMyHome.financeScenarioSummary().loan,revision:BuildMyHome.drawingRevision()}));
  const result=await read();assert.equal(result.loan.totalPrincipal,120000000);assert.equal(result.loan.rows[2].closingBalance,72000000);assert.equal(result.loan.rows[2].prepaymentFee,360000);assert.equal(result.loan.rows[3].principalPaid,8000000);assert.equal(result.revision,revision);
  await page.reload();await page.waitForFunction(()=>window.__BMH_BOOT_OK);await page.evaluate(()=>BuildMyHome.projects.ready);assert.deepEqual(await read(),result);
  const before=JSON.stringify(result.scenario);await page.locator('[data-team-a-loan] [name="prepayments"]').fill('3=18000000:');await page.locator('[data-team-a-loan] button').click();assert.equal(JSON.stringify((await read()).scenario),before,'invalid missing fee must preserve saved scenario');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);assert.deepEqual(errors,[]);
  await page.screenshot({path:path.join(out,device+'.png'),fullPage:true});report.cases.push({device,revision,rows:result.loan.rows,totalPrincipal:result.loan.totalPrincipal,totalFees:result.loan.totalFees,persistence:true,invalidInputAtomic:true,errors});await context.close();
 }
 report.complete=true;
})().catch(e=>{report.error=e.stack;console.error(e);process.exitCode=1}).finally(async()=>{fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(report,null,2)+'\n');await browser?.close();server?.kill()});
