import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {fixture} from './team-a-massing-fixture.mjs';
function client(){
 const B=fixture();vm.runInNewContext(fs.readFileSync('src/96_vector_pdf.js','utf8'),{BMH:B,document:{addEventListener(){}},Uint8Array,console});return B;
}
test('native A3 sheets pass one-revision and metre/millimetre preflight',()=>{
 const B=client(),sheets=B.architecturalSheets(),r=B.architecturalPdfPreflight(sheets);assert.equal(r.revision,B.drawingRevision());assert.equal(r.sheetCount,sheets.length);
});
test('PDF rejects mixed, missing or unknown revisions before any resource/network work',async()=>{
 const B=client(),sheets=B.architecturalSheets();let calls=0;B.drawingPdfResources=async()=>{calls++;throw Error('must not load')};
 const changed=structuredClone(sheets);changed[1].svg=changed[1].svg.replace(/data-revision="[^"]*"/,'data-revision="another-revision"');await assert.rejects(B.architecturalPdfBytes(changed),/khác revision/);
 for(const revision of ['', 'unknown']){const invalid=structuredClone(sheets);invalid[1].svg=invalid[1].svg.replace(/data-revision="[^"]*"/,'data-revision="'+revision+'"');await assert.rejects(B.architecturalPdfBytes(invalid),/thiếu revision/);}
 for(const invalid of [null,[],[{}]])await assert.rejects(B.architecturalPdfBytes(invalid),/Chưa có|thiếu revision/);
 assert.equal(calls,0);
});
test('PDF rejects wrong page size and units even when revision matches',async()=>{
 const B=client(),sheets=B.architecturalSheets();let calls=0;B.drawingPdfResources=async()=>{calls++;throw Error('must not load')};
 for(const [from,to] of [['viewBox="0 0 420 297"','viewBox="0 0 297 210"'],['data-model-unit="m"','data-model-unit="mm"'],['data-dimension-unit="mm"','data-dimension-unit="cm"']]){const invalid=structuredClone(sheets);invalid[1].svg=invalid[1].svg.replace(from,to);await assert.rejects(B.architecturalPdfBytes(invalid),/khổ A3/);}
 assert.equal(calls,0);
});
