import assert from 'node:assert/strict';
import fs from 'node:fs';
import {designClient} from './fixtures/design-client.mjs';
export const fixtures=JSON.parse(fs.readFileSync('tests/team-a-massing-fixtures.json','utf8'));
const plain=x=>JSON.parse(JSON.stringify(x));
export function fixture(f=fixtures.cases[0]){
 const B=designClient({nativeParcel:true,realHouse:true}),p=B.state.project;
 Object.assign(p.site,f.site,{useParcelGeometry:!!f.vertices,targetCoverage:.8,north:{status:'unknown'},elevation:{status:'unknown'}});
 if(f.vertices){Object.assign(p.site,{lotMode:'custom',lotSource:'survey-local',frontEdge:0,boundaryEvidenceId:'test-concave'});p.designEvidence.site=[{id:'test-concave',kind:'boundary',unit:'m',sourceType:'customer',verifiedState:'provided',sourceTitle:'TEST-ONLY local coordinates',value:{sourceCrs:'LOCAL_METRES',surveyReference:'TEST-ONLY A/AB',localVertices:f.vertices}}];}
 p.style='Japandi';p.briefIdea='';p.household.relatives=[];p.designStudio={program:{mode:'custom',bedrooms:3,bathrooms:3}};
 p.plan={rooms:[],openings:[],fixtures:[],furniture:[],outdoor:[],lockedRoomIds:[],lockedFloors:[]};
 const proposal=B.architectureProposal('balanced');assert.equal(proposal.ok,true,proposal.reason);p.plan=proposal.plan;
 B.planHistory={undo:[],redo:[]};return B;
}
export function target(B){return B.state.project.plan.rooms.filter(r=>r.type==='bed').sort((a,b)=>b.h-a.h)[0];}
