const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const src = path.join(root, 'dist');
const out = path.join(root, 'public');

if (!fs.existsSync(src)) throw new Error('Missing dist directory');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
fs.cpSync(src, out, { recursive: true });

const required = ['index.html','app.js','styles.css','core.js','scene3d.js','upgrade.js','manifest.webmanifest'];
for (const file of required) {
  const target = path.join(out, file);
  if (!fs.existsSync(target)) throw new Error(`Missing Vercel output file: ${file}`);
}
console.log(`Prepared Vercel static output in ${out}`);
