(async()=>{
  const cssParts=2;
  const jsParts=8;
  const readParts=async(prefix,count)=>{
    const parts=await Promise.all(Array.from({length:count},(_,i)=>
      fetch(`./${prefix}-${i+1}.txt`,{cache:'no-cache'}).then(r=>{
        if(!r.ok) throw new Error(`${prefix}-${i+1}: ${r.status}`);
        return r.text();
      })
    ));
    return parts.join('');
  };
  try{
    const css=await readParts('css',cssParts);
    const style=document.createElement('style');
    style.textContent=css;
    document.head.appendChild(style);
    document.documentElement.classList.add('chi-css-ready');

    const js=await readParts('js',jsParts);
    const blob=new Blob([js],{type:'text/javascript'});
    const url=URL.createObjectURL(blob);
    const script=document.createElement('script');
    script.src=url;
    script.onload=()=>{URL.revokeObjectURL(url);document.getElementById('bootScreen')?.remove();};
    script.onerror=()=>{throw new Error('Chargement du moteur impossible');};
    document.body.appendChild(script);
  }catch(err){
    console.error(err);
    const el=document.getElementById('bootScreen');
    if(el) el.innerHTML='<strong>Coach Hand IA</strong><br><small>Impossible de charger l’application. Vérifie la connexion puis recharge.</small>';
  }
})();