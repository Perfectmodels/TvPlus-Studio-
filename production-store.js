// Shared catalogue. Existing unscoped editor URLs retain their original draft storage.
(() => {
  const params = new URLSearchParams(location.search);
  const id = params.get('production');
  const active = /^[a-f0-9-]{36}$/i.test(id || '') ? id : null;
  const formats = {pastille:'Pastille', alerte:'Alerte info', verbatim:'Verbatim / Ligne Rouge', decryptage:'Décryptage', reportage:'Reportage / 60 secondes', no:'No Comment', sondage:'Le Sondage TV+', caalors:'Ça alors !'};
  let opening;
  function database() {
    if (!opening) opening = new Promise((resolve, reject) => {
      const request = indexedDB.open('tvplus-productions', 1);
      request.onupgradeneeded = () => {
        for (const name of ['projects','assets','exports']) request.result.createObjectStore(name,{keyPath:'id'});
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return opening;
  }
  async function run(name, mode, action) {
    const db = await database();
    return new Promise((resolve,reject) => {
      const tx = db.transaction(name, mode);
      const request = action(tx.objectStore(name));
      tx.oncomplete = () => resolve(request?.result);
      tx.onabort = () => reject(tx.error || Error('Écriture interrompue'));
    });
  }
  const get = (name,id) => run(name,'readonly',s=>s.get(id));
  const list = name => run(name,'readonly',s=>s.getAll());
  const put = (name,row) => run(name,'readwrite',s=>s.put(row));
  function patch(id, changes) {
    return run('projects','readwrite',store=>{
      const request = store.get(id);
      request.onsuccess = () => { if(request.result) store.put({...request.result,...changes,updated:Date.now()}); };
    });
  }
  function report(error) {
    let box=document.getElementById('productionError');
    if(!box){box=document.createElement('p');box.id='productionError';box.setAttribute('role','alert');box.style.cssText='position:fixed;bottom:4rem;left:1rem;background:#571319;color:white;padding:1rem;z-index:99999';(document.querySelector('dialog[open]')||document.body).append(box);}
    box.textContent='Enregistrement local impossible. '+(error.message || error);
  }
  async function asset(file) {
    const row={id:crypto.randomUUID(),name:file.name||'Photo du sujet',file,updated:Date.now()};
    await put('assets',row); return row.id;
  }
  async function exported(kind,blob,name) {
    if(!active)return;
    try{
      await put('exports',{id:active+'-'+kind,blob,name});
      await patch(active,{[kind+'Status']:'Exporté'});
    }catch(error){report(error);}
  }
  window.Productions={id:active,formats,key:key=>active?key+':'+active:key,get,list,put,patch,asset,exported,report};
})();
