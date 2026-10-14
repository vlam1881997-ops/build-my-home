/* Generate changed-fixture outputs from production SVG/DXF/BOQ engines, no browser mock. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fixtures,fixture,target} from './team-a-massing-fixture.mjs';
const root=process.env.BMH_EVIDENCE_OUT;if(!root)throw Error('Set BMH_EVIDENCE_OUT to an isolated output directory');
const summary=[];
for(const f of fixtures.cases){
 const B=fixture(f);if(process.env.BMH_OUTDOOR_USE)B.state.project.measuredDesign.roof={type:'flat',overhang:0,pitchDeg:0};const r=target(B),p=B.previewRoomDepthChange({roomId:r.id,depth:f.id==='wide'?3:3.8,anchor:'rear',releasedUse:process.env.BMH_OUTDOOR_USE||(f.id==='wide'?'laundry':'office'),sourceReference:'TEST-ONLY customer outdoor choice'});
 assert.ok(p.ok,p.reason);assert.ok(B.applyRoomDepthChange(p));const revision=B.drawingRevision(),sheets=B.architecturalSheets(),dir=path.join(root,f.id);fs.mkdirSync(dir,{recursive:true});
 assert.equal(sheets.filter(s=>s.name.startsWith('Mặt đứng')).length,4);assert.equal(sheets.filter(s=>s.name.startsWith('Mặt cắt')).length,2);
 const outputs=[];const save=(file,data)=>{fs.writeFileSync(path.join(dir,file),data);outputs.push({file,sha256:createHash('sha256').update(data).digest('hex')});};
 sheets.forEach((s,i)=>{assert.ok(s.svg.includes('data-revision="'+revision+'"'));assert.ok(!/NaN|Infinity/.test(s.svg));save('sheet-'+String(i+1).padStart(2,'0')+'.svg',s.svg);});
 for(let floor=0;floor<f.site.floors;floor++)save('floor-'+floor+'.dxf',B.planDxf(floor));
 save('boq.json',JSON.stringify(B.commercialBoq(),null,2));save('quantities.json',JSON.stringify(B.measuredQuantities(),null,2));save('plan.json',JSON.stringify(B.state.project.plan,null,2));save('outdoor-register.json',JSON.stringify(B.outdoorSpaceRegister(),null,2));
 const row={fixture:f.id,testOnly:true,revision,units:'m',site:f.site,parcelArea:f.expectedArea,room:p.room,released:p.released,changes:p.changes,sheets:sheets.map(s=>s.name),outputs};save('evidence.json',JSON.stringify(row,null,2));summary.push(row);
}
fs.writeFileSync(path.join(root,'summary.json'),JSON.stringify({runtime:process.version,pdfGate:'pending-native-browser',cases:summary},null,2));
console.log(JSON.stringify(summary.map(s=>({fixture:s.fixture,revision:s.revision,sheets:s.sheets.length}))));
