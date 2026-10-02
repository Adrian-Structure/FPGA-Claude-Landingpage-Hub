/* Basis aus der eigenen Adresse ableiten, damit die Textur aus jeder
   Verzeichnistiefe und auch lokal laedt. */
var AS_BASIS = (function(){
  var e = document.currentScript;
  if (e && e.src) return e.src.replace(/[^/]*$/, '');
  return '/app-assets/';
})();
/* Firmenzeichen: Infinity Cube Rev. H (450 mm) — Geometrie und Farben stammen
   unverändert aus dem Skill infinity-cube-3d (bauplan-450.mjs, 75/75 Prüfungen
   bestanden, Erzeugnis SHA-256-identisch reproduziert). Drehteller-Rotation,
   Blick ~24 Grad von oben. Kein Framework. */
function asWuerfel(c){
if(!c||!c.getContext)return;
if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
var x=c.getContext('2d');
var PH=0.42,CP=Math.cos(PH),SP=Math.sin(PH);
var TEX=null,PAT=null,TI=new Image();
TI.onload=function(){
 /* Kachelkontrast spreizen (Faktor 3.6 um den Mittelwert): die Nietplatten
    ueberstehen so die Verkleinerung des Wuerfels auf 190 px. Geometrie und
    Plattenaufteilung der Grafik bleiben unveraendert. */
 var tc=document.createElement('canvas');tc.width=tc.height=256;
 var tx=tc.getContext('2d');tx.drawImage(TI,0,0,256,256);
 var id=tx.getImageData(0,0,256,256),p=id.data,s=0;
 for(var i=0;i<p.length;i+=4)s+=(p[i]+p[i+1]+p[i+2])/3;
 var mid=s/(p.length/4),K=3.6;
 for(var i=0;i<p.length;i+=4)for(var q=0;q<3;q++){
  var val=mid+(p[i+q]-mid)*K;p[i+q]=val<0?0:(val>255?255:val);}
 tx.putImageData(id,0,0);TEX=tc;PAT=x.createPattern(tc,'repeat');};
TI.src=AS_BASIS+'images/metall-platten.svg';
var L=[-0.5,0.75,0.45];var Ln=Math.hypot(L[0],L[1],L[2]);L=[L[0]/Ln,L[1]/Ln,L[2]/Ln];
function warm(hex,f,g){
 var r=parseInt(hex.slice(1,3),16),gr=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
 return 'rgb('+Math.min(255,Math.round(r*f+255*g))+','+Math.min(255,Math.round(gr*f+201*g))+','+Math.min(255,Math.round(b*f+138*g))+')';}
function frame(t){
 var a=-t/10000*2*Math.PI,ca=Math.cos(a),sa=Math.sin(a); /* Uhrzeigersinn von oben */
 var w=c.width,m2=w/2,k=w/700;
 x.clearRect(0,0,w,w);
 var faces=[];
 for(var i=0;i<BARS.length;i++){
  var b=BARS[i],P=[];
  for(var j=0;j<b.v.length;j++){var p=b.v[j];
   var x1=p[0]*ca+p[2]*sa, y1=p[1], z1=-p[0]*sa+p[2]*ca;
   P.push([m2+x1*k, m2-(y1*CP-z1*SP)*k-w*0.02, y1*SP+z1*CP, x1, y1, z1]);
  }
  for(var q=0;q<b.f.length;q++){var f=b.f[q];
   var z=0;for(var n=0;n<f.length;n++)z+=P[f[n]][2];z/=f.length;
   /* Flaechennormale im gedrehten Raum fuer die Schattierung */
   var A=P[f[0]],B=P[f[1]],C=P[f[2]];
   var u=[B[3]-A[3],B[4]-A[4],B[5]-A[5]],v2=[C[3]-A[3],C[4]-A[4],C[5]-A[5]];
   var nx=u[1]*v2[2]-u[2]*v2[1],ny=u[2]*v2[0]-u[0]*v2[2],nz=u[0]*v2[1]-u[1]*v2[0];
   var nl=Math.hypot(nx,ny,nz)||1;
   var d=Math.abs(nx/nl*L[0]+ny/nl*L[1]+nz/nl*L[2]);
   /* Innenlicht 0xffc98a aus der Wuerfelmitte: Lambert x Abstandsabfall */
   var cx3=(A[3]+B[3]+C[3]+P[f[3]][3])/4,cy3=(A[4]+B[4]+C[4]+P[f[3]][4])/4,cz3=(A[5]+B[5]+C[5]+P[f[3]][5])/4;
   var dist=Math.hypot(cx3,cy3,cz3)||1;
   var lam=Math.max(0,(nx*-cx3+ny*-cy3+nz*-cz3)/(nl*dist)); /* nur zum Zentrum gewandte Flaechen */
   var glow=0.85*lam/(1+Math.pow(dist/220,2));
   faces.push([z,f,P,warm(b.c,(PAT?1.05:0.62)+0.55*d,glow)]);
  }
 }
 faces.push([0,'kern']); /* Leuchtkern in der Mitte, wird von vorderen Staeben verdeckt */
 faces.sort(function(a,b){return a[0]-b[0];});
 x.lineWidth=1;x.lineJoin='round';x.strokeStyle='rgba(5,7,13,.55)';
 for(var i=0;i<faces.length;i++){var fc=faces[i],f=fc[1],P=fc[2];
  if(f==='kern'){ /* Innenleuchten wie im Viewer: Kern 0xffe3b0 + warmer Halo */
   var R=k*95, gA=x.createRadialGradient(m2,m2-w*0.02,0,m2,m2-w*0.02,R);
   gA.addColorStop(0,'rgba(255,227,176,.95)');gA.addColorStop(0.18,'rgba(255,214,150,.55)');
   gA.addColorStop(0.5,'rgba(255,201,138,.16)');gA.addColorStop(1,'rgba(255,201,138,0)');
   x.fillStyle=gA;x.beginPath();x.arc(m2,m2-w*0.02,R,0,7);x.fill();continue;}
  x.fillStyle=fc[3];
  x.beginPath();x.moveTo(P[f[0]][0],P[f[0]][1]);
  for(var n=1;n<f.length;n++)x.lineTo(P[f[n]][0],P[f[n]][1]);
  x.closePath();x.fill();
  if(PAT){ /* Nietplatten: affin exakt, da orthografische Projektion Parallelogramme erhaelt */
   var p0=P[f[0]],p1=P[f[1]],p3=P[f[3]];
   var lu=Math.hypot(p1[3]-p0[3],p1[4]-p0[4],p1[5]-p0[5]);
   var lv=Math.hypot(p3[3]-p0[3],p3[4]-p0[4],p3[5]-p0[5]);
   var su=Math.max(lu/420,0.02),sv=Math.max(lv/420,0.02); /* Kachel = 420 mm, groeber als im Viewer */
   x.save();x.clip();
   x.setTransform((p1[0]-p0[0])/(256*su),(p1[1]-p0[1])/(256*su),(p3[0]-p0[0])/(256*sv),(p3[1]-p0[1])/(256*sv),p0[0],p0[1]);
   x.globalCompositeOperation='multiply';x.globalAlpha=1;
   x.fillStyle=PAT;x.fillRect(0,0,256*su,256*sv);
   x.setTransform(1,0,0,1,0,0);x.globalCompositeOperation='source-over';x.globalAlpha=1;
   x.restore();}
  x.stroke();}
 requestAnimationFrame(frame);}
var BARS=[{"c":"#51545f","v":[[-145,-225,-225],[-105,-185,-225],[-105,-185,-185],[-145,-225,-185],[225,-225,-225],[185,-185,-225],[185,-185,-185],[225,-225,-185]],"f":[[0,1,2,3],[7,6,5,4],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]]},{"c":"#821616","v":[[185,-185,-225],[225,-225,-225],[225,-225,-185],[185,-185,-185],[185,145,-225],[225,145,-225],[225,105,-185],[185,105,-185]],"f":[[0,1,2,3],[7,6,5,4],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]]},{"c":"#51545f","v":[[185,105,-185],[225,105,-185],[225,145,-225],[185,145,-225],[185,105,105],[225,105,105],[225,145,145],[185,145,145]],"f":[[0,1,2,3],[7,6,5,4],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]]},{"c":"#51545f","v":[[185,105,105],[225,105,105],[225,145,145],[185,145,145],[185,-185,105],[225,-185,105],[225,-225,145],[185,-225,145]],"f":[[0,1,2,3],[7,6,5,4],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]]},{"c":"#824700","v":[[185,-225,145],[225,-225,145],[225,-185,105],[185,-185,105],[185,-225,-105],[225,-225,-145],[225,-185,-145],[185,-185,-105]],"f":[[0,1,2,3],[7,6,5,4],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]]},{"c":"#51545f","v":[[225,-225,-145],[225,-185,-145],[185,-185,-105],[185,-225,-105],[-145,-225,-145],[-145,-185,-145],[-105,-185,-105],[-105,-225,-105]],"f":[[0,1,2,3],[7,6,5,4],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]]},{"c":"#51545f","v":[[-145,-225,-145],[-105,-225,-105],[-105,-185,-105],[-145,-185,-145],[-145,-225,225],[-105,-225,185],[-105,-185,185],[-145,-185,225]],"f":[[0,1,2,3],[7,6,5,4],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]]},{"c":"#821616","v":[[-105,-225,185],[-105,-185,185],[-145,-185,225],[-145,-225,225],[225,-225,185],[185,-185,185],[185,-185,225],[225,-225,225]],"f":[[0,1,2,3],[7,6,5,4],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]]},{"c":"#51545f","v":[[185,-185,185],[225,-225,185],[225,-225,225],[185,-185,225],[185,105,185],[225,145,185],[225,145,225],[185,105,225]],"f":[[0,1,2,3],[7,6,5,4],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]]},{"c":"#51545f","v":[[185,105,185],[225,145,185],[225,145,225],[185,105,225],[-185,105,185],[-225,145,185],[-225,145,225],[-185,105,225]],"f":[[0,1,2,3],[7,6,5,4],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]]},{"c":"#824700","v":[[-225,145,185],[-185,105,185],[-185,105,225],[-225,145,225],[-225,-185,185],[-185,-185,185],[-185,-225,225],[-225,-225,225]],"f":[[0,1,2,3],[7,6,5,4],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]]},{"c":"#51545f","v":[[-225,-225,225],[-185,-225,225],[-185,-185,185],[-225,-185,185],[-225,-225,-225],[-185,-225,-225],[-185,-185,-185],[-225,-185,-185]],"f":[[0,1,2,3],[7,6,5,4],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]]},{"c":"#51545f","v":[[-225,-225,-225],[-185,-225,-225],[-185,-185,-185],[-225,-185,-185],[-225,225,-225],[-185,225,-225],[-185,185,-185],[-225,185,-185]],"f":[[0,1,2,3],[7,6,5,4],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]]},{"c":"#821616","v":[[-225,185,-185],[-185,185,-185],[-185,225,-225],[-225,225,-225],[-225,185,225],[-185,185,185],[-185,225,185],[-225,225,225]],"f":[[0,1,2,3],[7,6,5,4],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]]},{"c":"#51545f","v":[[-185,185,185],[-185,225,185],[-225,225,225],[-225,185,225],[185,185,185],[185,225,185],[225,225,225],[225,185,225]],"f":[[0,1,2,3],[7,6,5,4],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]]},{"c":"#51545f","v":[[185,185,185],[225,185,225],[225,225,225],[185,225,185],[185,185,-185],[225,185,-225],[225,225,-225],[185,225,-185]],"f":[[0,1,2,3],[7,6,5,4],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]]},{"c":"#824700","v":[[225,185,-225],[225,225,-225],[185,225,-185],[185,185,-185],[-105,185,-225],[-145,225,-225],[-145,225,-185],[-105,185,-185]],"f":[[0,1,2,3],[7,6,5,4],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]]},{"c":"#51545f","v":[[-145,225,-225],[-105,185,-225],[-105,185,-185],[-145,225,-185],[-145,-225,-225],[-105,-185,-225],[-105,-185,-185],[-145,-225,-185]],"f":[[0,1,2,3],[7,6,5,4],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]]}];
requestAnimationFrame(frame);
}

/* Startet den Wuerfel auf jedem <canvas class="as-wuerfel"> der Seite
   (und auf dem alten #wuerfel der Startseite). */
(function(){
  function los(){
    var n = document.querySelectorAll('canvas.as-wuerfel, canvas#wuerfel');
    for (var i = 0; i < n.length; i++) {
      var k = n[i];
      if (k.dataset.asLaeuft) continue;      /* nicht zweimal starten */
      k.dataset.asLaeuft = '1';
      try { asWuerfel(k); } catch (e) { delete k.dataset.asLaeuft; }
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', los);
  else los();
  window.addEventListener('load', los);
  /* Seiten, die ihre Navigation erst im Browser aufbauen (Shop), bringen das
     Canvas spaeter nach — deshalb beobachten statt einmal zu schauen. */
  if (window.MutationObserver) {
    var mo = new MutationObserver(function(){ los(); });
    var start = function(){ mo.observe(document.body, {childList:true, subtree:true}); };
    if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
    setTimeout(function(){ mo.disconnect(); }, 15000);
  }
})();
