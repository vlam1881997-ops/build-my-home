/* Optional maintainer regeneration. Production loads the checked-in asset only. */
const fs=require('node:fs'),path=require('node:path'),esbuild=require('esbuild');
const pkg=process.argv[2]||path.dirname(require.resolve('pdf-lib/package.json'));
if(JSON.parse(fs.readFileSync(path.join(pkg,'package.json'))).version!=='1.17.1')throw Error('Expected audited pdf-lib 1.17.1');
const output=path.resolve(__dirname,'../assets/vendor/pdf');fs.mkdirSync(output,{recursive:true});
const api=JSON.stringify(path.join(pkg,'es/index.js')),svg=JSON.stringify(path.join(pkg,'es/api/svgPath.js'));
const source='export {PDFDocument,PDFOperator,rgb,PDFHexString,pushGraphicsState,popGraphicsState,concatTransformationMatrix,setFillingColor,setStrokingColor,setGraphicsState,setLineWidth,setDashPattern,setLineCap,setLineJoin,fill,fillAndStroke,stroke,endPath,clip,beginText,endText,setFontAndSize,setTextMatrix,showText,moveTo,lineTo,closePath,appendBezierCurve} from '+api+';export {svgPathToOperators} from '+svg+';';
esbuild.buildSync({stdin:{contents:source,resolveDir:pkg,sourcefile:'bmh-pdf-entry.js'},format:'iife',globalName:'BMHPDF',bundle:true,minify:true,legalComments:'inline',outfile:path.join(output,'pdf-lib-1.17.1.js')});
fs.copyFileSync(path.join(pkg,'LICENSE.md'),path.join(output,'LICENSE.txt'));
console.log('Vendored pdf-lib 1.17.1; lazy local PDF support.');
