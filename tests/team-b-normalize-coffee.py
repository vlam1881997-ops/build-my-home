"""Normalize licensed Poly Haven model geometry; source dir is a CLI argument.
No image/SKU appearance is claimed: BMH assigns selected wood and stone finishes.
"""
import json,struct,hashlib,sys
from pathlib import Path
source=Path(sys.argv[1]);gltf=source/'model.gltf';j=json.loads(gltf.read_text());binary=(source/j['buffers'][0]['uri']).read_bytes();points=[]
for mesh in j['meshes']:
 for primitive in mesh['primitives']:
  a=j['accessors'][primitive['attributes']['POSITION']];v=j['bufferViews'][a['bufferView']]
  assert a['componentType']==5126 and a['type']=='VEC3'
  points.extend(struct.unpack_from('<fff',binary,v.get('byteOffset',0)+a.get('byteOffset',0)+i*v.get('byteStride',12)) for i in range(a['count']))
lo=[min(p[k] for p in points) for k in range(3)];hi=[max(p[k] for p in points) for k in range(3)]
assert len(j['nodes'])==1 and not any(k in j['nodes'][0] for k in ['translation','rotation','scale','matrix'])
j['nodes'][0]['translation']=[-(lo[0]+hi[0])/2,-lo[1],-(lo[2]+hi[2])/2]
j['materials']=[{'name':'stone','pbrMetallicRoughness':{'baseColorFactor':[.15,.16,.15,1],'metallicFactor':0,'roughnessFactor':.55}},{'name':'wood','pbrMetallicRoughness':{'baseColorFactor':[.55,.39,.24,1],'metallicFactor':0,'roughnessFactor':.6}}]
for k in ['images','textures','samplers']:j.pop(k,None)
j['buffers'][0].pop('uri',None);j['asset']['extras']={'source':'https://polyhaven.com/a/modern_coffee_table_02','license':'CC0-1.0','finish':'BMH semantic wood/stone, not original baked appearance'}
raw=json.dumps(j,separators=(',',':')).encode();raw+=b' '*((-len(raw))%4);binary+=b'\0'*((-len(binary))%4)
blob=struct.pack('<III',0x46546c67,2,28+len(raw)+len(binary))+struct.pack('<II',len(raw),0x4e4f534a)+raw+struct.pack('<II',len(binary),0x004e4942)+binary
out=Path('assets/interior/models/modern-coffee-table.glb');out.write_bytes(blob)
meta={'modelId':'tableCoffeeModern','asset':'modern-coffee-table','sourceUrl':'https://polyhaven.com/a/modern_coffee_table_02','license':'CC0-1.0','licenseUrl':'https://polyhaven.com/license','author':'Amin','retrievedAt':'2026-10-14','sourceGltfSha256':hashlib.sha256(gltf.read_bytes()).hexdigest(),'sourceBinSha256':hashlib.sha256((source/'modern_coffee_table_02.bin').read_bytes()).hexdigest(),'sha256':hashlib.sha256(blob).hexdigest(),'dimensionsMetres':{'w':hi[0]-lo[0],'h':hi[1]-lo[1],'d':hi[2]-lo[2]},'triangles':sum(j['accessors'][p['indices']]['count']//3 for m in j['meshes'] for p in m['primitives']),'processing':'Preserved topology, centred X/Z, grounded Y. Metres. Original baked materials replaced with semantic wood/stone for customer finish choices. No manufacturer or SKU.','generator':'tests/team-b-normalize-coffee.py'}
Path('assets/interior/models/modern-coffee-table.provenance.json').write_text(json.dumps(meta,indent=2)+'\n');print(json.dumps(meta))
