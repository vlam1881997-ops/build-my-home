/* A3 vector PDF with embedded Vietnamese fonts. Everything stays local:
 * lazy vendored pdf-lib, measured SVG primitives, no image/AI service. */
(()=>{
 const B=BMH,PT=72/25.4;let resourcePromise;
 B.drawingPdfResources=()=>resourcePromise??=(async()=>{
  const load=new Promise((resolve,reject)=>{if(globalThis.BMHPDF)return resolve(globalThis.BMHPDF);const script=document.createElement('script');script.src='/assets/vendor/pdf/pdf-lib-1.17.1.js';script.onload=()=>globalThis.BMHPDF?resolve(globalThis.BMHPDF):reject(Error('Bộ xuất PDF chưa nạp được'));script.onerror=()=>{script.remove();reject(Error('Chưa tải được bộ xuất PDF. Kiểm tra kết nối.'));};document.head.append(script);});
  const [lib,response]=await Promise.all([load,fetch('/assets/fonts/bmh-plansans.json',{credentials:'same-origin'})]);if(!response.ok)throw Error('Chưa tải được phông bản vẽ');const data=await response.json();if(data.format!=='bmh-font-metrics-1')throw Error('Phông bản vẽ không đúng phiên bản');return {lib,fonts:data.fonts};
 })().catch(e=>{resourcePromise=null;throw e;});
 // The prepared TTF carries its exact glyph IDs and advances. No font shaping
 // dependency is needed for NFC Latin/Vietnamese architectural annotations.
 const metricFont=data=>{
  const glyph=cp=>{const g=data.glyphs[cp];if(!g)throw Error('Phông bản vẽ chưa hỗ trợ ký tự '+String.fromCodePoint(cp));return g;};
  return {...data,characterSet:Object.keys(data.glyphs).map(Number),post:{isFixedPitch:false},head:{macStyle:{italic:false}},glyphForCodePoint:glyph,layout:value=>({glyphs:[...String(value).normalize('NFC')].map(c=>glyph(c.codePointAt(0)))})};
 };
 const bytes=data=>Uint8Array.from(atob(data),c=>c.charCodeAt(0));
 const value=(el,key,fallback=0)=>{const s=el.getAttribute(key);if(s===null||s==='')return fallback;const n=Number(s);if(!Number.isFinite(n))throw Error('Kích thước SVG không hợp lệ: '+key);return n;};
 const pathFor=el=>{
  const x=value(el,'x'),y=value(el,'y'),w=value(el,'width'),h=value(el,'height'),tag=el.localName;
  if(tag==='path')return el.getAttribute('d')||'';
  if(tag==='line')return 'M'+value(el,'x1')+' '+value(el,'y1')+' L'+value(el,'x2')+' '+value(el,'y2');
  if(tag==='rect'){if(w<0||h<0)throw Error('Ô SVG âm');const rx=Math.min(w/2,value(el,'rx',value(el,'ry'))),ry=Math.min(h/2,value(el,'ry',rx));return rx&&ry?'M'+(x+rx)+' '+y+'H'+(x+w-rx)+'A'+rx+' '+ry+' 0 0 1 '+(x+w)+' '+(y+ry)+'V'+(y+h-ry)+'A'+rx+' '+ry+' 0 0 1 '+(x+w-rx)+' '+(y+h)+'H'+(x+rx)+'A'+rx+' '+ry+' 0 0 1 '+x+' '+(y+h-ry)+'V'+(y+ry)+'A'+rx+' '+ry+' 0 0 1 '+(x+rx)+' '+y+'Z':'M'+x+' '+y+'h'+w+'v'+h+'h'+(-w)+'Z';}
  if(tag==='circle'||tag==='ellipse'){const cx=value(el,'cx'),cy=value(el,'cy'),rx=value(el,tag==='circle'?'r':'rx'),ry=value(el,tag==='circle'?'r':'ry');if(rx<=0||ry<=0)return '';return 'M'+(cx-rx)+' '+cy+'A'+rx+' '+ry+' 0 1 0 '+(cx+rx)+' '+cy+'A'+rx+' '+ry+' 0 1 0 '+(cx-rx)+' '+cy+'Z';}
  if(tag==='polygon'||tag==='polyline'){const ns=(el.getAttribute('points')||'').trim().split(/[\s,]+/).map(Number);if(ns.length<4)return '';if(ns.some(n=>!Number.isFinite(n))||ns.length%2)throw Error('Điểm SVG không hợp lệ');return ns.map((n,i)=>i%2?' '+n:(i?'L':'M')+n).join('')+(tag==='polygon'?'Z':'');}
  throw Error('Thành phần SVG chưa hỗ trợ: '+tag);
 };
 B.architecturalPdfBytes=async(sheets=B.architecturalSheets())=>{
  if(!sheets.length)throw Error('Chưa có tờ bản vẽ');const {lib:L,fonts:data}=await B.drawingPdfResources(),doc=await L.PDFDocument.create();
  doc.setTitle('BMH · Bộ bản vẽ kiến trúc A3');doc.setSubject('Phương án kiến trúc / nội thất theo dữ liệu đã nhập; hồ sơ thi công cần kiểm tra chuyên môn.');doc.setCreator('Build My Home · measured drawings');doc.setProducer('BMH / pdf-lib 1.17.1');
  const adapters=data.map(metricFont);let next=0;doc.registerFontkit({create:()=>adapters[next++]});const fonts=[];for(const d of data)fonts.push(await doc.embedFont(bytes(d.data),{subset:false,customName:d.postscriptName}));
  const iframe=document.createElement('iframe');iframe.setAttribute('aria-hidden','true');iframe.style.cssText='position:fixed;left:-10000px;top:0;width:1600px;height:1130px;border:0;pointer-events:none';document.body.append(iframe);
  try{
   const d=iframe.contentDocument,view=iframe.contentWindow;d.open();d.write('<!doctype html><html><head></head><body style="margin:0"></body></html>');d.close();
   for(const f of data){const face=new view.FontFace('BMH Plan Sans',bytes(f.data),{weight:f.style==='Bold'?'700':'400'});await face.load();d.fonts.add(face);}
   const color=s=>{if(!s||s==='none'||s==='transparent')return null;const m=s.match(/^rgba?\(([^)]+)\)$/);if(!m)throw Error('Màu SVG chưa hỗ trợ: '+s);const v=m[1].split(/[\s,\/]+/).filter(Boolean).map(Number);return L.rgb(v[0]/255,v[1]/255,v[2]/255);};
   for(const sheet of sheets){
    d.body.innerHTML=sheet.svg;if(d.querySelector('parsererror')||!d.querySelector('svg'))throw Error('Tờ SVG chưa hợp lệ: '+sheet.name);const svg=d.querySelector('svg');if(svg.getAttribute('viewBox')!=='0 0 420 297')throw Error('Tờ bản vẽ cần khổ A3 420 × 297 mm');
    const style=d.createElement('style');style.textContent='.architectural-sheet text{font-family:"BMH Plan Sans"!important}';d.head.append(style);
    const page=doc.addPage([420*PT,297*PT]),fontNames=fonts.map(f=>page.node.newFontDictionary(f.name,f.ref)),states=new Map();let operators=[L.pushGraphicsState(),L.concatTransformationMatrix(PT,0,0,-PT,0,297*PT)];
    const push=(...ops)=>operators.push(...ops),matrix=m=>push(L.concatTransformationMatrix(m.a,m.b,m.c,m.d,m.e,m.f));
    const opacity=(fill,stroke)=>{const key=fill.toFixed(4)+','+stroke.toFixed(4);let name=states.get(key);if(!name){name=page.node.newExtGState('BMHOpacity',doc.context.register(doc.context.obj({Type:'ExtGState',ca:fill,CA:stroke})));states.set(key,name);}push(L.setGraphicsState(name));};
    const paint=(el,parentOpacity=1)=>{
     const tag=el.localName;if(['style','defs','title','desc','metadata'].includes(tag))return;const css=view.getComputedStyle(el);if(css.display==='none'||css.visibility==='hidden')return;
     const alpha=parentOpacity*(parseFloat(css.opacity)||0);push(L.pushGraphicsState());const transform=el.transform?.baseVal.consolidate();if(transform)matrix(transform.matrix);
     if(tag==='svg'&&el!==svg){const x=value(el,'x'),y=value(el,'y'),w=value(el,'width'),h=value(el,'height'),v=el.viewBox.baseVal;if(v.width<=0||v.height<=0)throw Error('Viewport SVG không hợp lệ');push(L.concatTransformationMatrix(1,0,0,1,x,y));if(css.overflow!=='visible'){push(...L.svgPathToOperators('M0 0h'+w+'v'+h+'h'+(-w)+'Z'),L.clip(),L.endPath());}const preserve=el.getAttribute('preserveAspectRatio')||'xMidYMid meet';let sx=w/v.width,sy=h/v.height,tx=0,ty=0;if(!preserve.startsWith('none')){const k=preserve.includes('slice')?Math.max(sx,sy):Math.min(sx,sy);tx=preserve.includes('xMin')?0:preserve.includes('xMax')?w-v.width*k:(w-v.width*k)/2;ty=preserve.includes('YMin')?0:preserve.includes('YMax')?h-v.height*k:(h-v.height*k)/2;sx=sy=k;}push(L.concatTransformationMatrix(sx,0,0,sy,tx-v.x*sx,ty-v.y*sy));}
     if(['svg','g','a','switch'].includes(tag)){for(const child of el.children)paint(child,alpha);push(L.popGraphicsState());return;}
     if(css.clipPath&&css.clipPath!=='none')throw Error('Đường clip SVG chưa hỗ trợ');
     const fill=color(css.fill),stroke=color(css.stroke),fo=alpha*parseFloat(css.fillOpacity),so=alpha*parseFloat(css.strokeOpacity);opacity(fo,so);if(fill)push(L.setFillingColor(fill));if(stroke)push(L.setStrokingColor(stroke));
     if(tag==='text'){
      const draw=(node,x,y,content)=>{const st=view.getComputedStyle(node),fontIndex=parseInt(st.fontWeight)>=600||st.fontWeight==='bold'?1:0,font=fonts[fontIndex],size=parseFloat(st.fontSize),s=String(content).replace(/[\r\n\t]+/g,' ').normalize('NFC');if(!s.trim())return;if(!Number.isFinite(size)||size<=0)throw Error('Cỡ chữ SVG không hợp lệ');const width=font.widthOfTextAtSize(s,size),anchor=st.textAnchor||'start';x-=anchor==='middle'?width/2:anchor==='end'?width:0;const baseline=st.dominantBaseline;if(['central','middle'].includes(baseline))y+=size*.32;const c=color(st.fill);if(c)push(L.setFillingColor(c));push(L.beginText(),L.setFontAndSize(fontNames[fontIndex],size),L.setTextMatrix(1,0,0,-1,x,y),L.showText(font.encodeText(s)),L.endText());};
      let x=value(el,'x'),y=value(el,'y');for(const node of el.childNodes){if(node.nodeType===3){draw(el,x,y,node.textContent);x+=fonts[parseInt(css.fontWeight)>=600?1:0].widthOfTextAtSize(node.textContent,parseFloat(css.fontSize));}else if(node.nodeType===1&&node.localName==='tspan'){x=value(node,'x',x)+value(node,'dx');y=value(node,'y',y)+value(node,'dy');draw(node,x,y,node.textContent);x+=fonts[parseInt(view.getComputedStyle(node).fontWeight)>=600?1:0].widthOfTextAtSize(node.textContent,parseFloat(view.getComputedStyle(node).fontSize));}else if(node.nodeType===1)throw Error('Chữ SVG chưa hỗ trợ: '+node.localName);}
     }else{
      const path=pathFor(el),sw=parseFloat(css.strokeWidth);if(path){if(stroke){if(!Number.isFinite(sw))throw Error('Nét SVG không hợp lệ');push(L.setLineWidth(sw),L.setLineCap({butt:0,round:1,square:2}[css.strokeLinecap]??0),L.setLineJoin({miter:0,round:1,bevel:2}[css.strokeLinejoin]??0));const dash=css.strokeDasharray==='none'?[]:css.strokeDasharray.split(/[ ,]+/).map(parseFloat);push(L.setDashPattern(dash,parseFloat(css.strokeDashoffset)||0));}push(...L.svgPathToOperators(path));const even=css.fillRule==='evenodd';if(fill&&stroke)push(even?L.PDFOperator.of('B*'):L.fillAndStroke());else if(fill)push(even?L.PDFOperator.of('f*'):L.fill());else if(stroke)push(L.stroke());else push(L.endPath());}
     }
     push(L.popGraphicsState());
    };
    paint(svg);push(L.popGraphicsState());page.pushOperators(...operators);style.remove();await new Promise(resolve=>setTimeout(resolve,0));
   }
   return doc.save({useObjectStreams:true});
  }finally{iframe.remove();}
 };
 B.exportArchitecturalPdf=async()=>{
  if(B.architecturalPdfBusy)return false;if(!B.measuredDesignReview().geometryValid){B.toast('Sửa lỗi hình học trước khi xuất PDF.');return false;}B.architecturalPdfBusy=true;const project=B.state.project,revision=B.drawingRevision(),buttons=[...document.querySelectorAll('[data-export="drawing-pdf"]')],labels=buttons.map(b=>b.textContent);buttons.forEach(b=>{b.disabled=true;b.textContent='Đang tạo PDF vector…';});
  try{const data=await B.architecturalPdfBytes();if(B.state.project!==project||B.drawingRevision()!==revision){B.toast('Thiết kế vừa đổi. Xuất lại PDF của phương án mới.');return false;}B.download('BMH-bo-ban-ve-'+revision+'-A3.pdf',data,'application/pdf');B.toast('Đã tải bộ bản vẽ PDF A3. In 100% để giữ tỷ lệ.');return true;}catch(e){console.warn('BMH vector PDF',e);B.toast(e.message||'Chưa xuất được PDF. Thử tải SVG.');return false;}finally{B.architecturalPdfBusy=false;buttons.forEach((b,i)=>{if(b.isConnected){b.disabled=false;b.textContent=labels[i];}});}
 };
 document.addEventListener('click',e=>{if(e.target.closest?.('[data-export="drawing-pdf"]')){e.preventDefault();e.stopImmediatePropagation();void B.exportArchitecturalPdf();}},true);
 const dossier=B.screen10;B.screen10=()=>dossier().replaceAll('In bản vẽ / Lưu PDF','Tải bộ bản vẽ PDF').replace('Gồm bản vẽ SVG, CAD DXF, bảng vật liệu','Gồm PDF vector A3, bản vẽ SVG, CAD DXF, bảng vật liệu');B.SCREENS[9]=B.screen10;
})();
