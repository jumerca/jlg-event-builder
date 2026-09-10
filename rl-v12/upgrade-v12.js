/* Rugby Legacy v1.2 — broadcast match renderer overhaul */
(()=>{
'use strict';
const V='1.2.0';
if(typeof RL_DATA!=='undefined') RL_DATA.version=V;
if(typeof DB!=='undefined') DB.version=V;
state.prm12Camera=state.prm12Camera||'auto';
state.prm12Quality=state.prm12Quality||'high';
let raf=0,lastIdx=-1,phaseStart=performance.now(),cam={x:50,y:50,z:1.02};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const lerp=(a,b,t)=>a+(b-a)*t;
const sm=t=>t*t*(3-2*t);
const norm=s=>(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
const POS=['PIL','TAL','PIL','2L','2L','3L','3L','3L','9','10','AIL','C','C','AIL','AR'];
const COLORS={
'Stade Toulousain':['#d71920','#111111'],'Union Bordeaux-Bègles':['#6f1d3d','#ffffff'],'Stade Rochelais':['#ffd21c','#111111'],
'RC Toulon':['#d71920','#111111'],'ASM Clermont':['#f5df21','#174b9b'],'Aviron Bayonnais':['#77c5e8','#ffffff'],
'Montpellier HR':['#1a4f91','#ffffff'],'Castres Olympique':['#2b6cab','#ffffff'],'Racing 92':['#8ed5ec','#ffffff'],
'Stade Français Paris':['#ec8dbc','#273b8e'],'LOU Rugby':['#c7102e','#111111'],'Section Paloise':['#169b58','#ffffff'],
'USA Perpignan':['#d71920','#f0d11c'],'RC Vannes':['#151515','#ffffff'],'Provence Rugby':['#111111','#d8ac49'],
'Oyonnax':['#cf1f2c','#151515'],'Brive':['#111111','#ffffff'],'Montauban':['#188a50','#111111'],
'Grenoble':['#d62b38','#2456a5'],'Valence Romans':['#d32835','#ffffff'],'Biarritz':['#d51f2b','#ffffff'],
'Aurillac':['#d51f2b','#2f5f94'],'Dax':['#d51f2b','#ffffff'],'Nissa':['#d51f2b','#111111'],
'Soyaux-Angoulême':['#6d1d58','#ffffff'],'Narbonne':['#ef6d24','#111111'],'Nevers':['#f2d31c','#22539d'],
'Colomiers':['#1f68b4','#ffffff'],'Béziers':['#d52734','#2460a8'],'Agen':['#1c62a8','#ffffff']
};
function hash(s){let h=0;for(const c of (s||''))h=(h*31+c.charCodeAt(0))>>>0;return h}
function clubColors(c,home){if(COLORS[c?.name])return COLORS[c.name];let h=hash(c?.name)%360;return[`hsl(${h} 62% 44%)`,home?'#171917':'#efefef']}
function ev(off=1){const m=state.match;if(!m)return null;return m.events[Math.max(0,(m.index||0)-off)]||{x:50,y:50,type:"COUP D'ENVOI",home:true,text:"Coup d’envoi",m:0}}
function fifteen(c){if(!c)return[];if(state.save&&c.id===state.save.clubId&&state.save.lineup?.length===15)return state.save.lineup.map(id=>c.players.find(p=>p.id===id)).filter(Boolean).slice(0,15);let used=new Set(),out=[];for(const pos of POS){let p=c.players.filter(x=>!used.has(x.id)&&x.pos===pos).sort((a,b)=>(b.ca||0)-(a.ca||0))[0]||c.players.filter(x=>!used.has(x.id)).sort((a,b)=>(b.ca||0)-(a.ca||0))[0];if(p){used.add(p.id);out.push(p)}}return out}
function profile(p){const pos=p?.pos||'C',h=clamp((p?.height||185)/185,.87,1.17),w=clamp((p?.weight||95)/95,.80,1.28),bulk=['PIL','TAL'].includes(pos)?1.18:['2L','3L'].includes(pos)?1.08:['9','AIL'].includes(pos)?.92:1;return{h,w:w*bulk}}
function dur(t){t=norm(t);if(t.includes('MELEE'))return 6200;if(t.includes('TOUCHE'))return 5400;if(t.includes('RUCK')||t.includes('TURNOVER'))return 5200;if(t.includes('PERCUSSION'))return 4700;if(t.includes('PIED')||t.includes('DROP'))return 4200;if(t.includes('ESSAI'))return 5000;if(t.includes('PASSE'))return 4400;return 3600}
function progress(e){return clamp((performance.now()-phaseStart)/dur(e?.type),0,1)}
function phaseName(t,p){t=norm(t);if(t.includes('PERCUSSION'))return p<.28?'PORTEUR':p<.48?'CONTACT':p<.68?'PLAQUAGE':p<.84?'SOL':'SOUTIENS';if(t.includes('RUCK')||t.includes('TURNOVER'))return p<.18?'ARRIVEE':p<.40?'NETTOYAGE':p<.64?'CONTEST':p<.82?'BALLON SECURISE':'SORTIE DU 9';if(t.includes('MELEE'))return p<.18?'MISE EN PLACE':p<.34?'LIAISON':p<.66?'POUSSEE':p<.84?'STABILISATION':'SORTIE';if(t.includes('TOUCHE'))return p<.20?'ALIGNEMENT':p<.40?'LANCER':p<.62?'SAUT':p<.78?'CAPTURE':'LANCEMENT';if(t.includes('PASSE'))return p<.18?'FIXATION':p<.38?'PASSE 1':p<.60?'PASSE 2':p<.80?'PASSE 3':'RECEPTION';if(t.includes('PIED'))return p<.22?'PREPARATION':p<.40?'FRAPPE':p<.76?'VOL':'CHASE';if(t.includes('ESSAI'))return p<.70?'COURSE':p<.86?'PLONGEON':'APLATIR';return p<.7?'JEU COURANT':'REPLACEMENT'}
function dir(home){return home?1:-1}
function carrierIndex(e){let t=norm(e?.type);if(t.includes('MELEE')||t.includes('RUCK')||t.includes('TURNOVER'))return 8;if(t.includes('PIED')||t.includes('DROP'))return 9;if(t.includes('TOUCHE'))return 3;if(t.includes('PERCUSSION'))return 11;if(t.includes('ESSAI'))return 13;if(t.includes('PASSE'))return 9;return 12}
function baseShape(home,i,e){
 const bx=e?.x??50,by=e?.y??50,t=norm(e?.type),att=e?.home===home,d=dir(home),pack=i<8;let x=50,y=50;
 if(t.includes('MELEE')){
   if(pack){const rows=[[0,1,2],[3,4,5,6],[7]],r=rows.findIndex(a=>a.includes(i)),ix=rows[r].indexOf(i),n=rows[r].length;x=bx-d*(1.15+r*1.85);y=by+(ix-(n-1)/2)*3.05}
   else if(i===8){x=bx-d*6;y=by+3}else{x=bx-d*(9+(i-9)*3.8);y=11+(i-9)*15.4}
 } else if(t.includes('TOUCHE')){
   const edge=by<50?10:90,sg=by<50?1:-1;
   if(pack){x=bx+(i%2?.72:-.72);y=edge+sg*(5.5+i*4.1)}
   else if(i===8){x=bx-d*5.2;y=edge+sg*17}else{x=bx-d*(8+(i-9)*3.8);y=15+(i-9)*13.7}
 } else if(t.includes('RUCK')||t.includes('TURNOVER')||t.includes('PERCUSSION')){
   if(i<4){x=bx-d*(1+Math.floor(i/2)*1.75);y=by+(i%2?1.9:-1.9)}
   else if(pack){x=bx-d*(4.8+(i-3)*2.15);y=by+(i-5.5)*6.2}
   else if(i===8){x=bx-d*5.0;y=by+2.7}
   else{x=bx-d*(8+(i-9)*4.1);y=8+(i-9)*15.3}
 } else {
   if(pack){const pod=i<3?0:i<6?1:2,slot=i<3?i:i<6?i-3:i-6;x=att?bx-d*(4+pod*5):bx+d*(6+pod*4);y=by+(slot-1)*7+pod*4}
   else if(i===8){x=bx-d*5;y=by+2}
   else{x=att?bx-d*(8.5+(i-9)*4.1):bx+d*(9+(i-9)*3.7);y=9+(i-9)*15.4}
 }
 return[clamp(x,1,99),clamp(y,2,98)];
}
function actionShape(home,i,e,p){
 let [x,y]=baseShape(home,i,e),t=norm(e?.type),att=e?.home===home,d=dir(home),bx=e?.x??50,by=e?.y??50,ci=carrierIndex(e);
 if(t.includes('PASSE')&&att){
   const chain=[9,11,12,13],stage=clamp(Math.floor(p*4),0,3);
   if(i===chain[stage]){x=bx-d*(7-stage*2.1);y=by+(stage-1.5)*6.5}
   if(i>8){x+=d*p*4.5;y+=(i%2?1:-1)*p*1.8}
 }
 if(t.includes('PERCUSSION')){
   const def=att?12:11;
   if(att&&i===ci){x=bx-d*(9*(1-Math.min(p/.5,1)));y=by}
   if(!att&&i===def){x=bx+d*(8*(1-Math.min(p/.5,1)));y=by+.8}
   if(p>.62&&((att&&i===ci)||(!att&&i===def))){x=bx+(att?-d:d)*(1-p)*1.8;y=by}
 }
 if(t.includes('RUCK')||t.includes('TURNOVER')){
   const a=sm(clamp((p-.08)/.58,0,1));
   if(i<6||i===8){let [tx,ty]=baseShape(home,i,e),sx=tx-d*(7+i*.35),sy=ty+(i-2.5)*2.2;x=lerp(sx,tx,a);y=lerp(sy,ty,a)}
   if(i===8&&att&&p>.80){x=bx-d*(6-(p-.80)*20);y=by+2.5}
 }
 if(t.includes('MELEE')){
   const push=p>.30&&p<.78?Math.sin((p-.30)/.48*Math.PI)*2.2:0;x+=(att?d:-d)*push;
   if(i===8&&att&&p>.83)x=bx-d*(6-(p-.83)*22)
 }
 if(t.includes('TOUCHE')){
   if((i===2||i===3||i===4)&&p>.34&&p<.70){const j=Math.sin(clamp((p-.34)/.36,0,1)*Math.PI);if(i===3)y+=(by<50?1:-1)*j*2.1}
   if(att&&i===8&&p>.77)x+=d*(p-.77)*11
 }
 if((t.includes('PIED')||t.includes('DROP'))&&att&&i===9)x=bx-d*(4-3*Math.min(p/.42,1));
 if(t.includes('ESSAI')&&att&&i===13){x=bx-d*(9*(1-Math.min(p/.74,1)));if(p>.74)y+=Math.sin((p-.74)/.26*Math.PI)*1.2}
 return[clamp(x,0,100),clamp(y,1,99)];
}
function canvasInfo(){
 const c=document.getElementById('prm12-canvas');if(!c)return null;const r=c.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,state.prm12Quality==='high'?2:1.35),w=Math.max(360,r.width),h=Math.max(250,r.height);
 if(c.width!==Math.round(w*d)||c.height!==Math.round(h*d)){c.width=Math.round(w*d);c.height=Math.round(h*d)}
 const ctx=c.getContext('2d');ctx.setTransform(d,0,0,d,0,0);return{c,ctx,w,h}
}
function cameraTarget(e){
 const t=norm(e?.type);let x=e?.x??50,y=e?.y??50,z=1.03;
 if(t.includes('MELEE')||t.includes('RUCK')||t.includes('PERCUSSION'))z=1.17;
 if(t.includes('TOUCHE')){y=(e?.y??50)<50?25:75;z=1.12}
 if(t.includes('PIED'))z=.93;
 if(t.includes('ESSAI'))z=1.19;
 if(state.prm12Camera==='high')z=.86;if(state.prm12Camera==='sideline')z=1.20;if(state.prm12Camera==='follow')z=1.22;
 return{x,y,z}
}
function proj(px,py,w,h){
 const e=ev(),tar=cameraTarget(e),follow=['auto','tv','follow'].includes(state.prm12Camera);
 cam.x=lerp(cam.x,follow?tar.x:50,.024);cam.y=lerp(cam.y,follow?tar.y:50,.020);cam.z=lerp(cam.z,tar.z,.025);
 const focus=(cam.x-50)*(state.prm12Camera==='follow'?.28:.18),x=clamp(px-focus,-10,110)/100,y=py/100;
 let topY=h*.19,botY=h*.945,tl=w*.13,tr=w*.87,bl=w*.004,br=w*.996;
 if(state.prm12Camera==='high'){topY=h*.095;tl=w*.055;tr=w*.945}
 if(state.prm12Camera==='sideline'){topY=h*.27;tl=w*.24;tr=w*.76}
 const yy=lerp(topY,botY,y),l=lerp(tl,bl,y),r=lerp(tr,br,y),cx=w/2;
 return{x:cx+(lerp(l,r,x)-cx)*cam.z,y:yy,s:lerp(.44,1.36,y)*cam.z}
}
function poly(ctx,pts,fill,stroke=null,lw=1){ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke()}}
function line(ctx,a,b,c,lw=1,d=[]){ctx.save();ctx.strokeStyle=c;ctx.lineWidth=lw;ctx.setLineDash(d);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.restore()}
function stadium(ctx,w,h){
 ctx.clearRect(0,0,w,h);
 let sky=ctx.createLinearGradient(0,0,0,h*.28);sky.addColorStop(0,'#121714');sky.addColorStop(1,'#414642');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h*.29);
 ctx.fillStyle='#2d322e';ctx.fillRect(0,h*.015,w,h*.14);ctx.fillStyle='#111512';ctx.fillRect(0,h*.155,w,h*.045);
 for(let y=0;y<12;y++)for(let x=0;x<w;x+=6){if(((x/6+y)|0)%5!==0){ctx.fillStyle=['#bdbdb6','#737d76','#d1b35d','#dcdad1','#8b938d'][((x/6+y)|0)%5];ctx.fillRect(x+(y%2)*2,8+y*4,2,2)}}
 ctx.fillStyle='#0d110e';ctx.fillRect(0,h*.196,w,h*.028);
 for(let x=0;x<w;x+=118){ctx.fillStyle=x%236?'#d8bd6b':'#e5e7e3';ctx.font='700 8px Arial';ctx.fillText(x%236?'RUGBY LEGACY':'SPORT PRO',x+8,h*.215)}
 const a=proj(0,0,w,h),b=proj(100,0,w,h),c=proj(100,100,w,h),d=proj(0,100,w,h),g=ctx.createLinearGradient(0,a.y,0,d.y);g.addColorStop(0,'#4a813b');g.addColorStop(.5,'#579a48');g.addColorStop(1,'#34742f');poly(ctx,[a,b,c,d],g,'rgba(255,255,255,.86)',1.15);
 for(let i=0;i<10;i+=2)poly(ctx,[proj(i*10,0,w,h),proj((i+1)*10,0,w,h),proj((i+1)*10,100,w,h),proj(i*10,100,w,h)],'rgba(255,255,255,.025)');
 [0,22,40,50,60,78,100].forEach(v=>line(ctx,proj(v,0,w,h),proj(v,100,w,h),'rgba(255,255,255,.75)',v===50?1.35:.8));
 for(let y=10;y<100;y+=10)line(ctx,proj(0,y,w,h),proj(100,y,w,h),'rgba(255,255,255,.16)',.55,[4,5]);
 posts(ctx,3,50,w,h);posts(ctx,97,50,w,h);
}
function posts(ctx,x,y,w,h){const p=proj(x,y,w,h),s=p.s;ctx.strokeStyle='#f2f2e9';ctx.lineWidth=Math.max(1,1.3*s);ctx.beginPath();ctx.moveTo(p.x-5*s,p.y);ctx.lineTo(p.x-5*s,p.y-36*s);ctx.moveTo(p.x+5*s,p.y);ctx.lineTo(p.x+5*s,p.y-36*s);ctx.moveTo(p.x-5*s,p.y-23*s);ctx.lineTo(p.x+5*s,p.y-23*s);ctx.stroke()}
function playerPose(t,att,i,p){
 t=norm(t),ci=carrierIndex({type:t});
 if(t.includes('MELEE'))return i<8?'scrum':'ready';
 if(t.includes('TOUCHE'))return i===3&&p>.34&&p<.7?'jump':(i===2||i===4)&&p>.34&&p<.7?'lift':'ready';
 if(t.includes('RUCK')||t.includes('TURNOVER')){if(i<2&&p>.35)return'ruck';if(i<5)return'arrive';return'ready'}
 if(t.includes('PERCUSSION')){if(att&&i===ci)return p>.65?'fall':'carry';if(!att&&i===12)return p>.52?'tackle':'run';return'run'}
 if(t.includes('ESSAI'))return att&&i===13&&p>.74?'dive':'run';
 if(t.includes('PIED')||t.includes('DROP'))return att&&i===9?'kick':'chase';
 return'run'
}
function drawPlayer(ctx,p,n,home,pt,type,att,i,ts,prog,colors){
 const pr=profile(p),sc=pt.s*pr.h,b=pr.w,pose=playerPose(type,att,i,prog),run=['run','chase','carry','arrive'].includes(pose),cy=ts*.016+i*1.4,stride=run?Math.sin(cy)*4.2:pose==='kick'?5.7:0,bob=run?Math.abs(Math.sin(cy))*1.1:0;
 let lean=pose==='scrum'?.78:pose==='ruck'?.95:pose==='tackle'?.85:pose==='fall'?1.25:pose==='dive'?1.35:pose==='kick'?.18:pose==='lift'?.05:.08;
 const x=pt.x,y=pt.y+bob*sc;
 ctx.save();ctx.fillStyle='rgba(0,0,0,.34)';ctx.beginPath();ctx.ellipse(x+2*sc,y+5*sc,6.5*b*sc,2.5*sc,0,0,Math.PI*2);ctx.fill();ctx.translate(x,y);ctx.rotate((home?1:-1)*lean);ctx.lineCap='round';
 ctx.strokeStyle='#161a17';ctx.lineWidth=2.25*sc;ctx.beginPath();ctx.moveTo(-2.1*b*sc,-1*sc);ctx.lineTo((-2.2-stride)*b*sc,8.7*sc);ctx.moveTo(2.1*b*sc,-1*sc);ctx.lineTo((2.2+stride)*b*sc,8.7*sc);ctx.stroke();
 ctx.fillStyle=colors[1];ctx.fillRect(-4.8*b*sc,-3.2*sc,9.6*b*sc,4.7*sc);
 let g=ctx.createLinearGradient(-6*sc,-16*sc,6*sc,-3*sc);g.addColorStop(0,colors[0]);g.addColorStop(1,'rgba(0,0,0,.65)');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-4.8*b*sc,-14.5*sc);ctx.quadraticCurveTo(0,-16.2*sc,4.8*b*sc,-14.5*sc);ctx.lineTo(5.3*b*sc,-3*sc);ctx.lineTo(-5.3*b*sc,-3*sc);ctx.closePath();ctx.fill();
 ctx.strokeStyle=colors[0];ctx.lineWidth=3.0*sc;let arm=run?Math.sin(cy+1.5)*3.4:pose==='tackle'?7.5:pose==='lift'?2:pose==='scrum'||pose==='ruck'?5.3:2.6;ctx.beginPath();ctx.moveTo(-4.1*b*sc,-11.5*sc);ctx.lineTo((-6-arm)*b*sc,-5.2*sc);ctx.moveTo(4.1*b*sc,-11.5*sc);ctx.lineTo((6+arm)*b*sc,-5.2*sc);ctx.stroke();
 ctx.fillStyle='#c9906e';ctx.beginPath();ctx.arc(0,-18.2*sc,3.15*sc,0,Math.PI*2);ctx.fill();ctx.fillStyle='#402f28';ctx.fillRect(-2.5*sc,-21*sc,5*sc,1.6*sc);
 if(sc>.54){ctx.fillStyle='#fff';ctx.font=`700 ${Math.max(5,6*sc)}px Arial`;ctx.textAlign='center';ctx.fillText(n,0,-7.2*sc)}
 ctx.restore()
}
function ballPoint(e,p,w,h){
 const bx=e?.x??50,by=e?.y??50,t=norm(e?.type),attHome=e?.home!==false,d=attHome?1:-1;let x=bx,y=by,z=0;
 if(t.includes('PASSE')){const stage=Math.min(3,Math.floor(p*4)),u=(p*4)-stage;x=bx+d*(-7+stage*2.4+u*2.4);y=by+(stage-1.5+u)*6.2;z=Math.sin(Math.PI*u)*18}
 else if(t.includes('PIED')||t.includes('DROP')){x=bx+d*p*42;y=by+Math.sin(p*Math.PI*1.3)*8;z=Math.sin(Math.PI*p)*82}
 else if(t.includes('TOUCHE')){x=bx;y=(by<50?12:88)+(by<50?1:-1)*p*24;z=Math.sin(Math.PI*p)*45}
 else if(t.includes('MELEE')||t.includes('RUCK')){x=bx-d*(p>.82?(p-.82)*22:0);y=by+2.6;z=2}
 else if(t.includes('PERCUSSION')){x=bx-d*(9*(1-Math.min(p/.5,1)));y=by;z=8}
 else if(t.includes('ESSAI')){x=bx-d*(9*(1-Math.min(p/.74,1)));y=by;z=p>.8?2:8}
 const q=proj(x,y,w,h);return{x:q.x,y:q.y-z*q.s*.6,s:q.s}
}
function drawBall(ctx,e,p,w,h,ts){const q=ballPoint(e,p,w,h);ctx.save();ctx.translate(q.x,q.y);ctx.rotate(ts*.01);ctx.fillStyle='#efe6c8';ctx.strokeStyle='#493a27';ctx.lineWidth=.9;ctx.beginPath();ctx.ellipse(0,0,5.1*q.s,2.6*q.s,.25,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore()}
function contactFX(ctx,e,p,w,h){const t=norm(e?.type),q=proj(e?.x??50,e?.y??50,w,h);if(t.includes('PERCUSSION')&&p>.42&&p<.68){ctx.strokeStyle=`rgba(255,235,180,${.5-(p-.42)})`;ctx.lineWidth=2;for(let a=0;a<6;a++){let ang=a*Math.PI/3,r=10+20*(p-.42);ctx.beginPath();ctx.moveTo(q.x+Math.cos(ang)*5,q.y+Math.sin(ang)*3);ctx.lineTo(q.x+Math.cos(ang)*r,q.y+Math.sin(ang)*r*.5);ctx.stroke()}}if((t.includes('RUCK')||t.includes('MELEE'))&&p>.3){ctx.fillStyle='rgba(210,194,160,.08)';ctx.beginPath();ctx.ellipse(q.x,q.y,24*q.s,7*q.s,0,0,Math.PI*2);ctx.fill()}}
function render(ts){
 const inf=canvasInfo();if(!inf){raf=requestAnimationFrame(render);return}const {ctx,w,h}=inf,m=state.match,e=ev();if(m&&m.index!==lastIdx){lastIdx=m.index;phaseStart=performance.now()}stadium(ctx,w,h);
 if(m&&typeof club==='function'){
  const hc=club(m.homeId),ac=club(m.awayId),hl=fifteen(hc),al=fifteen(ac),p=progress(e),actors=[];
  for(let i=0;i<15;i++){
   const hp=actionShape(true,i,e,p),ap=actionShape(false,i,e,p),hpt=proj(hp[0],hp[1],w,h),apt=proj(ap[0],ap[1],w,h);
   actors.push({home:true,i,p:hl[i],pt:hpt,att:e?.home===true,c:clubColors(hc,true)});
   actors.push({home:false,i,p:al[i],pt:apt,att:e?.home===false,c:clubColors(ac,false)});
  }
  actors.sort((a,b)=>a.pt.y-b.pt.y);contactFX(ctx,e,p,w,h);actors.forEach(a=>drawPlayer(ctx,a.p,a.i+1,a.home,a.pt,e?.type,a.att,a.i,ts,p,a.c));drawBall(ctx,e,p,w,h,ts);
  let vg=ctx.createRadialGradient(w/2,h*.58,h*.2,w/2,h*.58,h*.75);vg.addColorStop(.55,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.24)');ctx.fillStyle=vg;ctx.fillRect(0,0,w,h);
 }
 raf=requestAnimationFrame(render)
}
function enhance(){
 const old=document.getElementById('prm11-canvas')||document.getElementById('prm10-canvas');if(!old)return;
 const stage=old.parentElement;if(!stage)return;
 if(!document.getElementById('prm12-canvas')){
   old.style.display='none';
   const c=document.createElement('canvas');c.id='prm12-canvas';c.setAttribute('aria-label','Moteur de match Rugby Legacy 1.2');stage.insertBefore(c,old.nextSibling);
   const badge=document.createElement('div');badge.className='prm12-live';badge.innerHTML='<b>RUGBY LEGACY</b><span>Broadcast Engine 1.2</span>';stage.appendChild(badge);
   const ph=document.createElement('div');ph.className='prm12-phase';ph.id='prm12-phase';stage.appendChild(ph);
   if(!raf)raf=requestAnimationFrame(render);
 }
 const ph=document.getElementById('prm12-phase'),m=state.match,e=ev();if(ph&&m&&e){const p=progress(e);ph.innerHTML=`<b>${phaseName(e.type,p)}</b><span>${e.text||e.type||'Phase de jeu'}</span>`}
}
function toolbar(){
 const wrap=document.querySelector('.prm10-wrap,.prm11-wrap')||document.getElementById('app');if(!wrap||document.getElementById('prm12-strip'))return;
 const top=document.createElement('div');top.id='prm12-strip';top.className='prm12-strip';top.innerHTML=`<span>CAMÉRA</span><button data-c="auto">AUTO TV</button><button data-c="follow">SUIVI</button><button data-c="high">HAUTE</button><button data-c="sideline">LATÉRALE</button><i></i><span>RENDU</span><button data-q="high">HAUT</button><button data-q="eco">ÉCO</button>`;
 wrap.insertBefore(top,wrap.firstChild);
 top.onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.c)state.prm12Camera=b.dataset.c;if(b.dataset.q)state.prm12Quality=b.dataset.q;[...top.querySelectorAll('button')].forEach(x=>x.classList.toggle('on',(x.dataset.c&&x.dataset.c===state.prm12Camera)||(x.dataset.q&&x.dataset.q===state.prm12Quality)))};
 [...top.querySelectorAll('button')].forEach(x=>x.classList.toggle('on',(x.dataset.c&&x.dataset.c===state.prm12Camera)||(x.dataset.q&&x.dataset.q===state.prm12Quality)));
}
const obs=new MutationObserver(()=>{enhance();toolbar()});obs.observe(document.documentElement,{subtree:true,childList:true});
setInterval(()=>{enhance();toolbar()},350);
enhance();toolbar();
})();
