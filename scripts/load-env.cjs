const fs=require('node:fs'),path=require('node:path');
module.exports=()=>{const file=path.join(__dirname,'..','.env.local');if(fs.existsSync(file)&&typeof process.loadEnvFile==='function')process.loadEnvFile(file);};
