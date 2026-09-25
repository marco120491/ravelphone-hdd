const APP_VERSION='4.0';
let photoData=[];
const $=id=>document.getElementById(id);

function show(id){
  document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));
  $(id).classList.add('active'); scrollTo(0,0);
  if(id==='history') renderHistory();
}
function newReport(){
  $('reportForm').reset(); photoData=[]; $('photoPreview').innerHTML=''; clearSig();
  $('date').value=new Date().toISOString().slice(0,10); show('form');
}
$('photos').addEventListener('change',e=>{
  [...e.target.files].slice(0,6-photoData.length).forEach(f=>{
    let r=new FileReader(); r.onload=()=>{photoData.push(r.result);drawPhotos()}; r.readAsDataURL(f)
  });
  e.target.value='';
});
function drawPhotos(){
  $('photoPreview').innerHTML=photoData.map((x,i)=>`<div class="photoWrap"><img src="${x}"><button type="button" class="removePhoto" onclick="removePhoto(${i})">×</button></div>`).join('');
}
function removePhoto(i){photoData.splice(i,1);drawPhotos()}

const c=$('signature'),ctx=c.getContext('2d');ctx.lineWidth=4;ctx.lineCap='round';let drawing=false;
function pos(e){let r=c.getBoundingClientRect(),p=e.touches?e.touches[0]:e;return{x:(p.clientX-r.left)*c.width/r.width,y:(p.clientY-r.top)*c.height/r.height}}
function start(e){drawing=true;let p=pos(e);ctx.beginPath();ctx.moveTo(p.x,p.y);e.preventDefault()}
function move(e){if(!drawing)return;let p=pos(e);ctx.lineTo(p.x,p.y);ctx.stroke();e.preventDefault()}
function end(){drawing=false}
['mousedown','touchstart'].forEach(x=>c.addEventListener(x,start,{passive:false}));
['mousemove','touchmove'].forEach(x=>c.addEventListener(x,move,{passive:false}));
['mouseup','mouseleave','touchend'].forEach(x=>c.addEventListener(x,end));
function clearSig(){ctx.clearRect(0,0,c.width,c.height)}

function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function data(){return{date:$('date').value,site:$('site').value,client:$('client').value,job:$('job').value,operator:$('operator').value,instrument:$('instrument').value,rig:$('rig').value,diameter:$('diameter').value,planned:$('planned').value,meters:$('meters').value,phase:$('phase').value,work:$('work').value,notes:$('notes').value,signer:$('signer').value,photos:[...photoData],signature:c.toDataURL(),savedAt:new Date().toISOString()}}

function prettyDate(v){if(!v)return '-';let [y,m,d]=v.split('-');return `${d}/${m}/${y}`}
function row(label,value,unit=''){return value?`<div><b>${label}:</b> ${esc(value)}${unit}</div>`:''}
function previewReport(){if(!$('site').value){alert('Inserisci almeno il cantiere.');return}renderPaper(data());show('preview')}
function renderPaper(d){
 $('paper').innerHTML=`
 <div class='reportHead'><div class='reportBrand'>RAVELPHONE</div><div class='reportTitle'>RAPPORTINO GIORNALIERO HDD</div><div class='reportDate'>${prettyDate(d.date)}</div></div>
 <div class='block grid'>${row('Cantiere',d.site)}${row('Cliente',d.client)}${row('Commessa',d.job)}${row('Operatore',d.operator)}${row('Strumentista',d.instrument)}</div>
 <div class='block'><h3>PERFORAZIONE HDD</h3><div class='grid'>${row('Perforatore',d.rig)}${row('Diametro tubo',d.diameter)}${row('Lunghezza prevista',d.planned,' m')}${row('Metri eseguiti oggi',d.meters,' m')}${row('Fase',d.phase)}</div></div>
 ${d.work?`<div class='block'><h3>LAVORAZIONI ESEGUITE</h3><p>${esc(d.work).replace(/\n/g,'<br>')}</p></div>`:''}
 ${d.notes?`<div class='block'><h3>NOTE / IMPREVISTI</h3><p>${esc(d.notes).replace(/\n/g,'<br>')}</p></div>`:''}
 ${d.photos?.length?`<div class='block photoBlock'><h3>FOTO CANTIERE</h3><div class='reportPhotos'>${d.photos.map(x=>`<img src='${x}'>`).join('')}</div></div>`:''}
 <div class='block signatureBlock'><h3>FIRMA</h3><div class='signerName'>${esc(d.signer||'')}</div>${d.signature?`<img class='sigimg' src='${d.signature}'>`:''}</div>
 <div class='reportFooter'>RAVELPHONE · Rapportino HDD</div>`;
}
function getHistory(){try{return JSON.parse(localStorage.getItem('ravelReports')||'[]')}catch{return[]}}
function saveHistory(d){
  let a=getHistory();
  const slim={...d,photos:[],signature:d.signature||''};
  a.unshift(slim);
  localStorage.setItem('ravelReports',JSON.stringify(a.slice(0,100)));
}
function saveAndPrint(){let d=data();saveHistory(d);renderPaper(d);setTimeout(()=>window.print(),150)}
async function shareReport(){
 let d=data();saveHistory(d);
 let text=`Rapportino HDD RAVELPHONE\nData: ${prettyDate(d.date)}\nCantiere: ${d.site}\nCliente: ${d.client||'-'}\nMetri eseguiti: ${d.meters||'-'} m`;
 if(navigator.share){try{await navigator.share({title:`Rapportino HDD - ${d.site}`,text})}catch(e){}}
 else alert('Condivisione non disponibile: usa “Crea / salva PDF”.');
}
function renderHistory(){
 let a=getHistory();
 $('historyList').innerHTML=a.length?a.map((d,i)=>`<div class='historyItem'>
 <div class='historyTop'><div><b>${esc(d.site)}</b><div>${prettyDate(d.date)}${d.client?' · '+esc(d.client):''}</div><div class='muted'>${esc(d.phase||'')}${d.meters?' · '+esc(d.meters)+' m':''}</div></div>
 <button class='dangerSmall' onclick='deleteHistory(${i})'>Elimina</button></div>
 <button class='secondary historyOpen' onclick='openHistory(${i})'>Apri rapportino</button></div>`).join(''):`<div class='card'>Nessun rapportino salvato.</div>`;
}
function openHistory(i){let d=getHistory()[i];renderPaper(d);show('preview')}
function deleteHistory(i){if(!confirm('Eliminare questo rapportino dallo storico?'))return;let a=getHistory();a.splice(i,1);localStorage.setItem('ravelReports',JSON.stringify(a));renderHistory()}

async function registerSW(){
 if(!('serviceWorker' in navigator)) return;
 try{
   const reg=await navigator.serviceWorker.register(`sw.js?v=${APP_VERSION}`);
   await reg.update();
   setInterval(()=>reg.update(),30*60*1000);
 }catch(e){}
}
registerSW();
$('date').value=new Date().toISOString().slice(0,10);
