const $ = id => document.getElementById(id);
const PAGES_BASE = 'https://alronlewis.github.io/AR-Studio/';
let tracking='artwork', targetFile=null, targetMind=null, modelFile=null, objects=[], selected=0, history=[], future=[]; const objectAssets=new Map();
const ids=['scale','posX','posY','posZ','rotX','rotY','rotZ'];
const defaults={scale:.25,posX:0,posY:0,posZ:0,rotX:0,rotY:0,rotZ:0};
function slugify(s){return (String(s||'my-ar-experience').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''))||'my-ar-experience';}
function objectUrl(o){return PAGES_BASE+'experiences/'+slugify($('projectName').value)+'/'+o.id+'/';}
function snapshot(){history.push(JSON.stringify(objects));if(history.length>30)history.shift();future=[];}
function saveState(){$('savedState').textContent='Scene changed · export to save';}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function loadQRLibrary(){return new Promise((resolve,reject)=>{if(window.QRCode)return resolve();const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';s.onload=()=>window.QRCode?resolve():reject(Error('QR library unavailable'));s.onerror=()=>reject(Error('QR library failed to load'));document.head.appendChild(s);});}
async function renderObjectQRs(){
 const host=$('qrcode');host.innerHTML='';$('downloadQR').disabled=objects.length===0;
 if(!objects.length){host.innerHTML='<span>Add an object to generate its unique QR code.</span>';$('qrStatus').textContent='Each object gets its own launch QR.';return;}
 try{await loadQRLibrary();for(const o of objects){const card=document.createElement('div');card.className='object-qr-card';card.style.cssText='background:#fff;color:#222;border-radius:10px;padding:10px;margin:8px 0;text-align:center;';const title=document.createElement('b');title.textContent=o.name;const qr=document.createElement('div');qr.style.cssText='display:flex;justify-content:center;margin:8px;';const link=document.createElement('small');link.style.cssText='display:block;overflow-wrap:anywhere;color:#333;';link.textContent=objectUrl(o);const dl=document.createElement('button');dl.className='secondary wide';dl.textContent='Download '+o.name+' QR';dl.onclick=()=>{const c=qr.querySelector('canvas')||qr.querySelector('img');if(!c)return;const a=document.createElement('a');a.download=slugify(o.name)+'-'+o.id+'-qr.png';a.href=c.tagName==='CANVAS'?c.toDataURL('image/png'):c.src;a.click();};card.append(title,qr,link,dl);host.appendChild(card);new QRCode(qr,{text:objectUrl(o),width:160,height:160,correctLevel:QRCode.CorrectLevel.M});}
 $('qrStatus').textContent='✓ '+objects.length+' unique object QR'+(objects.length===1?'':'s')+' generated automatically.';
 }catch(e){$('qrStatus').textContent='QR generation failed: '+e.message;console.error(e);}
}
function addObject(type){
 snapshot();const id='obj-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6);
 const o={id,type,name:type==='model'?(modelFile?.name||'3D Model'):type==='text'?'Text label':'Shape',text:'Your text',scale:.25,x:0,y:0,z:0,rx:0,ry:0,rz:0};
 objects.push(o);if(type==='model'&&modelFile)objectAssets.set(id,modelFile);selected=objects.length-1;renderObjects();loadControls();updateStage();renderObjectQRs();saveState();
}
$('addModel').onclick=()=>$('modelFile').click();
$('addText').onclick=()=>addObject('text');
$('addShape').onclick=()=>addObject('shape');
$('modelFile').addEventListener('change',e=>{modelFile=e.target.files[0]||null;if(!modelFile)return;$('modelName').textContent=modelFile.name;addObject('model');const viewer=$('modelPreview');viewer.src=URL.createObjectURL(modelFile);viewer.hidden=false;$('stageEmpty').hidden=true;});
$('imageFile').addEventListener('change',e=>{targetFile=e.target.files[0]||null;targetMind=null;$('imageName').textContent=targetFile?.name||'No target selected';$('compileStatus').textContent='Target selected. Compile it to enable artwork tracking.';$('targetPreview').innerHTML=targetFile?'<img alt="Target image preview">':'TARGET PREVIEW';if(targetFile){const u=URL.createObjectURL(targetFile);$('targetPreview').querySelector('img').src=u;$('stageTarget').style.backgroundImage='url('+u+')';$('stageTarget').textContent='';$('stageTarget').style.backgroundSize='cover';}$('compileProgress').hidden=true;saveState();});
document.querySelectorAll('[data-track]').forEach(b=>b.onclick=()=>{tracking=b.dataset.track;document.querySelectorAll('[data-track]').forEach(x=>x.classList.toggle('active',x===b));$('sceneHint').textContent=tracking==='artwork'?'Image tracking · recognise your artwork':'QR / marker tracking · recognise your printed marker';$('compileStatus').textContent=tracking==='artwork'?'Upload the artwork image you want to track.':'Upload a QR or marker image to use as the tracking target.';});
$('compileBtn').onclick=async()=>{if(!targetFile){alert('Choose the artwork or marker image first.');return;}if(!window.MINDAR?.IMAGE?.Compiler){$('compileStatus').textContent='MindAR compiler did not load. Refresh and try again.';return;}const btn=$('compileBtn');btn.disabled=true;$('compileProgress').hidden=false;$('compileProgress').value=0;try{const img=await readImage(targetFile);const compiler=new MINDAR.IMAGE.Compiler();await compiler.compileImageTargets([img],p=>{$('compileProgress').value=Math.round(p*100);$('compileStatus').textContent='Compiling target… '+Math.round(p*100)+'%';});targetMind=new Blob([await compiler.exportData()],{type:'application/octet-stream'});$('compileStatus').textContent='✓ Target compiled.';saveState();}catch(e){$('compileStatus').textContent='Compile failed: '+(e.message||'unknown error');console.error(e);}finally{btn.disabled=false;}};
function readImage(file){return new Promise((ok,no)=>{const u=URL.createObjectURL(file),i=new Image();i.onload=()=>{URL.revokeObjectURL(u);ok(i);};i.onerror=()=>no(Error('Image could not be loaded'));i.src=u;});}
function renderObjects(){const host=$('objectList');host.innerHTML='';objects.forEach((o,i)=>{const b=document.createElement('button');b.className='object-btn '+(i===selected?'chosen':'');b.textContent=(o.type==='model'?'◇ ':o.type==='text'?'T ':'▧ ')+o.name;b.onclick=()=>{selected=i;renderObjects();loadControls();updateStage();};host.appendChild(b);});$('objectCount').textContent=objects.length+' object'+(objects.length===1?'':'s');$('stageEmpty').hidden=objects.length>0||!!targetFile;$('stageObject').hidden=objects.length===0;$('selectionName').textContent=objects[selected]?.name||'Nothing selected';}
function loadControls(){const o=objects[selected];$('selectionName').textContent=o?.name||'Nothing selected';const map={scale:'scale',posX:'x',posY:'y',posZ:'z',rotX:'rx',rotY:'ry',rotZ:'rz'};ids.forEach(id=>{$(id).value=o?o[map[id]]:defaults[id];showVal(id);});}
function showVal(id){const out={scale:'scaleOut',posX:'xOut',posY:'yOut',posZ:'zOut',rotX:'rxOut',rotY:'ryOut',rotZ:'rzOut'}[id];if(out)$(out).textContent=$(id).value+(id.startsWith('rot')?'°':'');}
ids.forEach(id=>$(id).addEventListener('input',()=>{const o=objects[selected];if(!o)return;const key={scale:'scale',posX:'x',posY:'y',posZ:'z',rotX:'rx',rotY:'ry',rotZ:'rz'}[id];o[key]=+$(id).value;showVal(id);updateStage();saveState();}));
function updateStage(){const o=objects[selected];if(!o)return;const el=$('stageObject');el.style.transform='translate(calc(-50% + '+(o.x*110)+'px),calc(-50% - '+(o.y*85)+'px)) scale('+Math.max(.5,o.scale*3)+') rotate('+o.rz+'deg)';el.innerHTML=o.type==='text'?'<span>'+escapeHtml(o.text)+'</span>':o.type==='shape'?'▧':'◇<span>3D OBJECT</span>';}
$('stageObject').addEventListener('pointerdown',e=>{const o=objects[selected];if(!o)return;const sx=e.clientX,sy=e.clientY,ox=o.x,oy=o.y;$('stageObject').setPointerCapture(e.pointerId);const move=ev=>{o.x=Math.max(-1,Math.min(1,ox+(ev.clientX-sx)/110));o.y=Math.max(-1,Math.min(1,oy-(ev.clientY-sy)/85));$('posX').value=o.x;$('posY').value=o.y;showVal('posX');showVal('posY');updateStage();};const end=()=>{$('stageObject').removeEventListener('pointermove',move);$('stageObject').removeEventListener('pointerup',end);saveState();};$('stageObject').addEventListener('pointermove',move);$('stageObject').addEventListener('pointerup',end);});
$('resetTransform').onclick=()=>{const o=objects[selected];if(!o)return;snapshot();Object.assign(o,{...defaults,x:0,y:0,z:0,rx:0,ry:0,rz:0});loadControls();updateStage();saveState();};
$('undoBtn').onclick=()=>{if(!history.length)return;future.push(JSON.stringify(objects));objects=JSON.parse(history.pop());selected=Math.max(0,objects.length-1);renderObjects();loadControls();updateStage();renderObjectQRs();};
$('redoBtn').onclick=()=>{if(!future.length)return;history.push(JSON.stringify(objects));objects=JSON.parse(future.pop());selected=Math.max(0,objects.length-1);renderObjects();loadControls();updateStage();renderObjectQRs();};
$('resetView').onclick=()=>{$('stage').scrollTop=0;$('stage').scrollLeft=0;};
async function compileQrTarget(qrElement){
 const canvas=qrElement.querySelector('canvas');
 if(!canvas)throw Error('QR image is not ready');
 const image=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('Could not load generated QR image'));img.src=canvas.toDataURL('image/png');});
 if(!window.MINDAR?.IMAGE?.Compiler)throw Error('MindAR compiler did not load');
 const compiler=new MINDAR.IMAGE.Compiler();
 await compiler.compileImageTargets([image],()=>{});
 return new Blob([await compiler.exportData()],{type:'application/octet-stream'});
}
function viewerHtml(o){
 const title=escapeHtml(o.name);
 const objectEntity=o.type==='model'
  ? '<a-gltf-model src="#object-model" position="0 0 0" rotation="'+o.rx+' '+o.ry+' '+o.rz+'" scale="'+o.scale+' '+o.scale+' '+o.scale+'"></a-gltf-model>'
  : o.type==='text'
   ? '<a-text value="'+escapeHtml(o.text)+'" position="0 0 0" rotation="'+o.rx+' '+o.ry+' '+o.rz+'" scale="'+o.scale+' '+o.scale+' '+o.scale+'" align="center" color="#ffffff"></a-text>'
   : '<a-box position="0 0 0" rotation="'+o.rx+' '+o.ry+' '+o.rz+'" scale="'+o.scale+' '+o.scale+' '+o.scale+'" color="#8877ff"></a-box>';
 return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><title>'+title+' — AR</title><script src="https://aframe.io/releases/1.5.0/aframe.min.js"></script><script src="https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js"></script><style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#05070b;color:white;font:15px system-ui}.hint{position:fixed;z-index:4;top:12px;left:12px;right:12px;text-align:center;padding:12px;border-radius:12px;background:#101827dd}a-scene{position:fixed;inset:0}</style></head><body><div class="hint">Point your camera at this printed QR code to see '+title+'</div><a-scene mindar-image="imageTargetSrc: ./assets/target.mind; autoStart: true; uiLoading: no; uiError: no; uiScanning: no" vr-mode-ui="enabled:false" device-orientation-permission-ui="enabled:false"><a-assets>'+(o.type==='model'?'<a-asset-item id="object-model" src="./assets/model.glb"></a-asset-item>':'')+'</a-assets><a-camera position="0 0 0" look-controls="enabled:false"></a-camera><a-entity mindar-image-target="targetIndex:0">'+objectEntity+'</a-entity></a-scene></body></html>';
}

async function exportProject(){
 if(!objects.length){alert('Add at least one object first.');return;}
 if(objects.some(o=>o.type==='model'&&!objectAssets.get(o.id))){alert('Select a GLB file for each 3D model object.');return;}
 if(!window.JSZip){alert('ZIP library did not load. Refresh and try again.');return;}
 const zip=new JSZip(),base=slugify($('projectName').value),root=zip.folder('experiences').folder(base);
 $('qrStatus').textContent='Preparing unique QR tracking targets…';
 try{
  await loadQRLibrary();
  for(const o of objects){
   const qrCard=[...$('qrcode').querySelectorAll('.object-qr-card')].find(card=>card.querySelector('b')?.textContent===o.name);
   if(!qrCard)throw Error('QR missing for '+o.name);
   const targetMindForObject=await compileQrTarget(qrCard);
   const folder=root.folder(o.id);
   folder.file('index.html',viewerHtml(o));
   folder.folder('assets').file('target.mind',targetMindForObject);
   if(o.type==='model'&&objectAssets.get(o.id))folder.folder('assets').file('model.glb',objectAssets.get(o.id));
  }
  const urls=objects.map(o=>objectUrl(o));
  zip.file('README.txt','AR STUDIO — QR MARKER AR EXPORT\n\nEach object's QR code is both its launch link and its image-tracking marker. Print the QR at a reasonable size. Scan it with your phone camera to open its AR page, allow camera access, then point the page camera at the same printed QR to see the object anchored above it.\n\nUpload the experiences folder from this ZIP to the root of your AR-Studio GitHub repository, preserving all folders. Wait for GitHub Pages deployment before scanning. The QR links will return 404 until those folders are published.\n\n'+objects.map((o,i)=>o.name+': '+urls[i]).join('\n')+'\n');
  const blob=await zip.generateAsync({type:'blob'}),a=document.createElement('a'),u=URL.createObjectURL(blob);
  a.href=u;a.download=base+'-qr-marker-ar-projects.zip';a.click();setTimeout(()=>URL.revokeObjectURL(u),5000);
  $('qrStatus').textContent='✓ QR marker targets compiled. Downloaded AR projects; upload experiences/ to GitHub Pages to activate links.';
  $('savedState').textContent='Object QR AR projects exported · publish ZIP contents to GitHub Pages';
 }catch(e){console.error(e);$('qrStatus').textContent='Export failed: '+e.message;alert('Could not prepare QR-tracking experience: '+e.message);}
}
$('projectName').addEventListener('input',()=>{clearTimeout(window.qrRefreshTimer);window.qrRefreshTimer=setTimeout(renderObjectQRs,300);});
$('exportBtn').onclick=exportProject;$('exportBtn2').onclick=exportProject;
$('downloadQR').onclick=()=>{const cards=[...$('qrcode').querySelectorAll('.object-qr-card')];if(!cards.length){alert('Add an object first.');return;}cards.forEach(card=>card.querySelector('button')?.click());};
renderObjects();loadControls();renderObjectQRs();
