const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
fs.rmSync(path.join(root,'public'),{recursive:true,force:true});
console.log('Cleaned generated public/ output.');
