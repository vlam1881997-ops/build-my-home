import test from 'node:test';import assert from 'node:assert/strict';
import {modernReference} from './team-b-modern-reference.mjs';
test('one Modern reference retains geometry, stair fit and identity through project normalization',()=>{
 const {B,review}=modernReference(),p=B.state.project;
 assert.equal(p.site.width,5);assert.equal(p.site.depth,20);assert.equal(p.site.floors,2);
 assert.equal(review.geometryIssues.length,0);assert.ok(review.stairDimensions.every(s=>!s.warning&&s.direction===90));
 for(let f=0;f<2;f++)assert.equal(B.circulationAnalysis(f).unreachable.length,0);
 const before=JSON.stringify(p.plan),revision=B.drawingRevision();B.state=B.mergeState(B.defaultState(),JSON.parse(JSON.stringify(B.state)));
 assert.deepEqual(JSON.parse(JSON.stringify(B.state.project.plan)),JSON.parse(before));assert.equal(B.drawingRevision(),revision);
 assert.ok(Object.values(B.state.project.materials.choices).every(id=>id.startsWith('UNCONFIRMED-')));
 assert.equal(review.status,'review-fixture-not-approved');assert.ok(review.missing.includes('Structural and MEP engineering'));
});
