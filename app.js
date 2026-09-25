const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const screens=["home","form","preview","history"]; let pics=[]; let drawing=false, hasSign=false;
function show(id){screens.forEach(x=>$("#"+x).classList.toggle("hidden",x!==id));scrollTo(0,0)}
function esc(s=""){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
$("#date").value=new Date().toISOString().slice(0,10);
$("#newBtn").onclick=()=>show("form"); $("#historyBtn").onclick=()=>{renderHistory();show("history")}; $$("[data-home]").forEach(b=>b.onclick=()=>show("home")); $("#editBtn").onclick=()=>show("form");

$("#photos").addEventListener("change", async e=>{
 const files=[...e.target.files]; const room=8-pics.length;
 if(files.length>room) alert("Puoi inserire massimo 8 foto per rapportino.");
 for(const f of files.slice(0,room)) pics.push(await compress(f));
 e.target.value=""; renderPics();
});
function compress(file){return new Promise((res,rej)=>{const rd=new FileReader();rd.onload=()=>{const im=new Image();im.onload=()=>{let w=im.width,h=im.height,m=1600;if(Math.max(w,h)>m){let k=m/Math.max(w,h);w*=k;h*=k}const c=document.createElement("canvas");c.width=w;c.height=h;c.getContext("2d").drawImage(im,0,0,w,h);res(c.toDataURL("image/jpeg",.78))};im.onerror=rej;im.src=rd.result};rd.onerror=rej;rd.readAsDataURL(file)})}
function renderPics(){$("#photoCount").textContent=`${pics.length} / 8`;$("#photoGrid").innerHTML=pics.map((p,i)=>`<div class="thumb"><img src="${p}"><button data-i="${i}">×</button></div>`).join("");$("#photoGrid").querySelectorAll("button").forEach(b=>b.onclick=()=>{pics.splice(+b.dataset.i,1);renderPics()})}

const cv=$("#signature"),cx=cv.getContext("2d");cx.lineWidth=5;cx.lineCap="round";
function pt(e){const r=cv.getBoundingClientRect(),t=e.touches?.[0]||e;return{x:(t.clientX-r.left)*cv.width/r.width,y:(t.clientY-r.top)*cv.height/r.height}}
["pointerdown","touchstart"].forEach(n=>cv.addEventListener(n,e=>{e.preventDefault();drawing=true;hasSign=true;let p=pt(e);cx.beginPath();cx.moveTo(p.x,p.y)},{passive:false}));
["pointermove","touchmove"].forEach(n=>cv.addEventListener(n,e=>{if(!drawing)return;e.preventDefault();let p=pt(e);cx.lineTo(p.x,p.y);cx.stroke()},{passive:false}));
["pointerup","pointercancel","touchend"].forEach(n=>cv.addEventListener(n,()=>drawing=false));
$("#clearSign").onclick=()=>{cx.clearRect(0,0,cv.width,cv.height);hasSign=false};

function data(){return{date:$("#date").value,site:$("#site").value,phase:$("#phase").value,meters:$("#meters").value,work:$("#work").value,notes:$("#notes").value,signer:$("#signer").value,pics:[...pics],sign:hasSign?cv.toDataURL("image/png"):""}}
function fmtDate(v){if(!v)return"";let [y,m,d]=v.split("-");return `${d}/${m}/${y}`}
function reportHTML(d){
 const field=(label,val)=>val?`<p><b>${label}:</b> ${esc(val)}</p>`:"";
 const photos=d.pics?.length?`<section class="r-section"><h2>FOTO CANTIERE</h2><div class="r-photos">${d.pics.map(x=>`<div class="r-photo"><img src="${x}"></div>`).join("")}</div></section>`:"";
 const sign=d.sign?`<section class="r-section"><h2>FIRMA</h2>${d.signer?`<p><b>${esc(d.signer)}</b></p>`:""}<img class="r-sign" src="${d.sign}"></section>`:"";
 return `<div class="r-head"><h1>RAVELPHONE</h1><div class="r-title">RAPPORTINO GIORNALIERO HDD</div><div class="muted">${fmtDate(d.date)}</div></div><div class="rule"></div>
 <section class="r-section">${field("Cantiere",d.site)}</section>
 <section class="r-section"><h2>PERFORAZIONE HDD</h2>${field("Fase",d.phase)}${field("Metri eseguiti",d.meters?d.meters+" m":"")}${field("Lavori",d.work)}${field("Note / imprevisti",d.notes)}</section>
 ${photos}${sign}<footer class="muted" style="border-top:1px solid #cfe1d4;margin-top:10px;padding-top:7px;text-align:center">RAVELPHONE · Rapportino HDD</footer>`;
}
$("#previewBtn").onclick=()=>{let d=data();$("#report").innerHTML=reportHTML(d);save(d);show("preview")};
$("#pdfBtn").onclick=()=>window.print();
$("#shareBtn").onclick=async()=>{let d=data(),txt=`RAVELPHONE - Rapportino HDD ${fmtDate(d.date)}${d.site?" - "+d.site:""}`;try{if(navigator.share)await navigator.share({title:"Rapportino HDD",text:txt});else alert("Usa Crea / salva PDF e poi il tasto Condividi di iPhone.")}catch(e){}};

function save(d){try{let a=JSON.parse(localStorage.getItem("ravelphoneReportsV5")||"[]");a.unshift({...d,id:Date.now()});localStorage.setItem("ravelphoneReportsV5",JSON.stringify(a.slice(0,30)))}catch(e){}}
function renderHistory(){let a=[];try{a=JSON.parse(localStorage.getItem("ravelphoneReportsV5")||"[]")}catch(e){};$("#historyList").innerHTML=a.length?a.map((d,i)=>`<div class="historyItem"><b>${fmtDate(d.date)} · ${esc(d.site||"Senza cantiere")}</b><br><span>${esc(d.phase||"")}</span><br><button class="secondary openH" data-i="${i}">Apri</button><button class="secondary delH" data-i="${i}">Elimina</button></div>`).join(""):"<p>Nessun rapportino salvato.</p>";$$(".openH").forEach(b=>b.onclick=()=>{$("#report").innerHTML=reportHTML(a[+b.dataset.i]);show("preview")});$$(".delH").forEach(b=>b.onclick=()=>{a.splice(+b.dataset.i,1);localStorage.setItem("ravelphoneReportsV5",JSON.stringify(a));renderHistory()})}

if("serviceWorker"in navigator){window.addEventListener("load",async()=>{try{const regs=await navigator.serviceWorker.getRegistrations();for(const r of regs)await r.update();await navigator.serviceWorker.register("sw.js?v=5")}catch(e){}})}
