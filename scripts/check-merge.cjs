const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
for(const file of ['README.md','BAT_DAU_O_DAY.txt','package.json','dist/index.html','domain-kit/README.md','domain-kit/src/finance.mjs','domain-kit/contracts/api.json','domain-kit/database/schema.sql','.github/workflows/deploy.yml'])assert.ok(fs.existsSync(path.join(root,file)),file);
for(const file of ['package.json','domain-kit/package.json','domain-kit/contracts/api.json','dist/manifest.webmanifest'])JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const html=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
for(const [,asset] of html.matchAll(/(?:src|href)="([^"]+)"/g)){if(/^https?:\/\//.test(asset))continue;assert.ok(!asset.startsWith('/'),'Asset must support repository subpath: '+asset);assert.ok(fs.existsSync(path.join(root,'dist',asset)),asset);}
const workflow=fs.readFileSync(path.join(root,'.github/workflows/deploy.yml'),'utf8');
assert.ok(workflow.includes('npm test'));assert.ok(workflow.includes('path: dist'));
assert.ok(!fs.existsSync(path.join(root,'domain-kit/.github')));
console.log('Merge checks passed: core, contracts, web assets, relative paths and deploy test gate.');
