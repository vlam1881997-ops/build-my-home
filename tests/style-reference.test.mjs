import test from 'node:test';
import assert from 'node:assert/strict';
import {renderRequestPayload} from '../api/gemini-render.mjs';

const image='data:image/jpeg;base64,'+'A'.repeat(120);
test('a customer style image is a second visual reference, while measured geometry stays first',()=>{
 const value=renderRequestPayload({image,styleReference:image,project:{style:'Japandi',site:{width:8,depth:18,floors:2},rooms:[{id:'living',name:'Phòng khách',floor:0,x:0,y:0,w:4,h:6}],materials:{finish:{palette:{wall:'#f2eee5'}}}}});
 assert.equal(value.image,'A'.repeat(120));assert.equal(value.styleReference.image,'A'.repeat(120));assert.match(value.prompt,/IMAGE 1, the measured 3D screenshot/);assert.match(value.prompt,/IMAGE 2 is the customer-selected style reference/);assert.match(value.prompt,/do not add rooms, doors, windows or floors/);
 assert.equal(renderRequestPayload({image}).styleReference,null);
 assert.throws(()=>renderRequestPayload({image,styleReference:'data:text/html;base64,'+'A'.repeat(120)}),/ảnh JPEG, PNG hoặc WEBP/);
});
