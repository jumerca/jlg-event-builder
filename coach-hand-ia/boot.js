(async()=>{
const J=7,C=2;
const parts=async(p,n)=>(await Promise.all(Array.from({length:n},(_,i)=>fetch(`./${p}-${i+1}.txt`,{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error(`${p} ${r.status}`);return r.text()})))).join('');
const ungzip=async s=>{
 const bin=Uint8Array.from(atob(s),x=>x.charCodeAt(0));
 const stream=new Blob([bin]).stream().pipeThrough(new DecompressionStream('gzip'));
 return new Response(stream).text();
};
try{
 const css=await ungzip(await parts('cssz',C));
 const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);document.documentElement.classList.add('chi-css-ready');
 const js=await ungzip(await parts('jsz',J));
 const u=URL.createObjectURL(new Blob([js],{type:'text/javascript'}));
 const s=document.createElement('script');s.src=u;s.onload=()=>{URL.revokeObjectURL(u);document.getElementById('bootScreen')?.remove()};document.body.appendChild(s);
}catch(e){console.error(e);const x=document.getElementById('bootScreen');if(x)x.innerHTML='<strong>Coach Hand IA</strong><br><small>Impossible de charger l’application. Recharge la page.</small>'}
})();