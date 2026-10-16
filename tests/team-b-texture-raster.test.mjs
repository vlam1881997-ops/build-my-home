import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {inflateSync} from 'node:zlib';
test('every shipped PBR PNG contains a complete decodable raster, not only a valid header',()=>{
 for(const file of fs.readdirSync('assets/interior/textures').filter(f=>f.endsWith('.png'))){
  const b=fs.readFileSync('assets/interior/textures/'+file);assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a',file);
  const width=b.readUInt32BE(16),height=b.readUInt32BE(20),bits=b[24],channels=({0:1,2:3,3:1,4:2,6:4})[b[25]];
  assert.equal(bits,8,file);assert.equal(b[28],0,file);assert.ok(channels,file);
  let pos=8,ended=false;const data=[];
  while(pos+12<=b.length){const n=b.readUInt32BE(pos),kind=b.toString('ascii',pos+4,pos+8);assert.ok(pos+12+n<=b.length,file+' incomplete '+kind);if(kind==='IDAT')data.push(b.subarray(pos+8,pos+8+n));pos+=n+12;if(kind==='IEND'){ended=true;break;}}
  assert.ok(ended,file+' missing IEND');assert.equal(pos,b.length,file+' trailing bytes');
  const pixels=inflateSync(Buffer.concat(data));assert.equal(pixels.length,height*(width*channels+1),file+' incomplete pixel rows');
 }
});
