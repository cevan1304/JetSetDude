(() => {
 'use strict';
 window.DUDE_INTRO_ACTIVE=true;
 const urls=new Map(),packJobs=new Map(),received=new Map(),docJobs=new Map(),docReady=new Map();
 let manifestPromise=null,manifest=null,gamePromise=null,engineLoaded=false,gameReady=false,error=null,activeGroup='main',activeTitle='Loading room…';
 let running=0;const queue=[];
 const q=id=>document.getElementById(id);
 const request=async path=>{const r=await fetch(path,{cache:'default'});if(!r.ok)throw Error('Could not load '+path+' ('+r.status+')');return r;};
 const getManifest=()=>manifestPromise??=(request('manifest.json').then(r=>r.json()).then(m=>manifest=m).catch(e=>{manifestPromise=null;throw e;}));
 function schedule(fn,priority=false){return new Promise((resolve,reject)=>{const job={fn,resolve,reject};priority?queue.unshift(job):queue.push(job);pump();});}
 function pump(){while(running<2&&queue.length){const job=queue.shift();running++;Promise.resolve().then(job.fn).then(job.resolve,job.reject).finally(()=>{running--;pump();});}}
 function percent(group){if(!manifest)return 0;const paths=manifest.groups[group]||[],total=paths.reduce((n,p)=>n+manifest.packs[p].size,0);return total?Math.min(100,Math.floor(paths.reduce((n,p)=>n+(received.get(p)||0),0)/total*100)):100;}
 function progress(){
  if(!q('assetLoading').hidden)q('assetProgress').textContent=percent(activeGroup)+'%';
  if(window.JET_SET_DUDE_INTRO?.state().phase==='leaving'&&!gameReady)q('introNotice').textContent='Loading game… '+percent('main')+'%';
 }
 async function downloadPack(path){
  const response=await request(path),reader=response.body?.getReader();let blob;
  if(reader){const chunks=[];let count=0;for(;;){const{done,value}=await reader.read();if(done)break;chunks.push(value);count+=value.byteLength;received.set(path,count);progress();}blob=new Blob(chunks);}
  else blob=await response.blob();
  if(blob.size!==manifest.packs[path].size)throw Error('Incomplete game data. Please retry.');
  for(const[id,a]of Object.entries(manifest.assets))if(a.pack===path)urls.set(id,URL.createObjectURL(blob.slice(a.offset,a.offset+a.size,a.mime)));
  received.set(path,blob.size);progress();
 }
 function pack(path,priority){
  if(!packJobs.has(path))packJobs.set(path,schedule(()=>downloadPack(path),priority).catch(e=>{packJobs.delete(path);received.delete(path);throw e;}));
  return packJobs.get(path);
 }
 async function ensureGroup(group,priority=true){await getManifest();await Promise.all(manifest.groups[group].map(path=>pack(path,priority)));}
 function resolve(text){return text.replace(/pack:\/\/([a-f0-9]{20})/g,(_,id)=>{if(!urls.has(id))throw Error('Game artwork is not ready.');return urls.get(id);});}
 function hydrate(){document.querySelectorAll('[data-src^="pack://"]').forEach(el=>{el.src=resolve(el.dataset.src);delete el.dataset.src;});}
 async function loadDocument(group,priority=true){
  if(docReady.has(group))return docReady.get(group);
  if(!docJobs.has(group))docJobs.set(group,Promise.all([ensureGroup(group,priority),request('rooms/'+group+'.html').then(r=>r.text())]).then(([,text])=>{text=resolve(text);docReady.set(group,text);return text;}).catch(e=>{docJobs.delete(group);throw e;}));
  return docJobs.get(group);
 }
 async function warm(){for(const group of ['early','late','end','outro']){try{await loadDocument(group,false);}catch{/* A foreground request can retry when needed. */}}}
 function loadGame(){
  if(gameReady)return Promise.resolve();
  if(gamePromise)return gamePromise;
  error=null;
  gamePromise=(async()=>{
   if(!engineLoaded){
    const[,code]=await Promise.all([ensureGroup('main'),request('game.js').then(r=>r.text())]);
    hydrate();
    const script=document.createElement('script');script.textContent=resolve(code)+'\n//# sourceURL=game.js';document.body.append(script);engineLoaded=true;
   }else if(!window.DUDE_TEST.ready())window.DUDE_GAME_READY=window.load();
   await window.DUDE_GAME_READY;
   if(!window.DUDE_TEST?.ready())throw Error('The game could not start. Please reload the page.');
   gameReady=true;progress();warm();
  })().catch(e=>{error=e.message;gamePromise=null;throw e;});
  return gamePromise;
 }
 async function documentWithRetry(group,title){
  if(docReady.has(group))return docReady.get(group);
  activeGroup=group;activeTitle=title;
  for(;;){
   q('assetMessage').textContent=activeTitle;q('assetLoading').hidden=false;q('assetRetry').hidden=true;progress();
   try{const result=await loadDocument(group);q('assetLoading').hidden=true;return result;}
   catch{q('assetMessage').textContent='Could not load the room. Check your connection.';q('assetProgress').textContent='';q('assetRetry').hidden=false;await new Promise(ok=>q('assetRetry').onclick=ok);}
  }
 }
 function hasSave(){try{const d=JSON.parse(localStorage.getItem('jetSetDude.preview.r13-r14.v01')||localStorage.getItem('jetSetDude.save.v1')||'null');return !!d&&!d.gameOver&&Number(d.energy??100)>0;}catch{return false;}}
 window.DUDE_GAME={pause(){},hasSave};
 window.DUDE_TEST={ready:()=>false};
 window.DUDE_BOOT={loadGame,documentWithRetry,state:()=>({ready:gameReady,engineLoaded,error,mainPercent:percent('main'),documents:[...docReady.keys()],pending:queue.length}),hasSave};
})();
