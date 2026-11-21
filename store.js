// Versioniertes, erweiterbares Datenschema. Einsätze speichern bewusst keine Zeitstempel.
const DB='einsatzlog-db', VERSION=11;
export const tables=['incidents','duties','templates','todos','procurement','payouts','keywords','dutyCategories','courses','qualifications','clothing','meals','preferences','awards','competitions','judging','incidentRoles','vehicles','publicPosts','publicIdeas','publicTemplates','publicPlatforms','publicEvents','customKinds','manualEvents','yearGoals','jfTraining','trash'];
let dbPromise;
function db(){if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{const req=indexedDB.open(DB,VERSION);req.onupgradeneeded=(event)=>{for(const t of tables)if(!req.result.objectStoreNames.contains(t))req.result.createObjectStore(t,{keyPath:'id'});if(!req.transaction.objectStoreNames.contains('incidentRoles'))throw Error('Positionsspeicher fehlt');if(event.oldVersion<9){const r=req.transaction.objectStore('incidentRoles');const presets=['Angriffstruppführer','Angriffstruppmann','Wassertruppführer','Wassertruppmann','Schlauchtruppführer','Schlauchtruppmann','Maschinist','Melder','Gruppenführer','Staffelführer','Truppführer','Sonstige Funktion'];presets.forEach((name,i)=>r.put({id:'preset-position-'+i,name,sort:i}));}};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});return dbPromise}
export async function all(table){const d=await db();return new Promise((ok,no)=>{const r=d.transaction(table,'readonly').objectStore(table).getAll();r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)})}
export async function put(table,value){const d=await db();return new Promise((ok,no)=>{const tx=d.transaction(table,'readwrite');tx.objectStore(table).put(value);tx.oncomplete=ok;tx.onerror=()=>no(tx.error)})}
export async function remove(table,id){const d=await db();return new Promise((ok,no)=>{const tx=d.transaction([table,...(table==='trash'?[]:['trash'])],'readwrite'),s=tx.objectStore(table);if(table==='trash')s.delete(id);else{const r=s.get(id);r.onsuccess=()=>{if(r.result){tx.objectStore('trash').put({id:crypto.randomUUID(),table,record:r.result,deletedAt:Date.now()});s.delete(id)}}}tx.oncomplete=ok;tx.onerror=()=>no(tx.error)})}
export async function recover(id){const d=await db(),entries=await all('trash'),x=entries.find(r=>r.id===id);if(!x||!tables.includes(x.table)||x.table==='trash')return;return new Promise((ok,no)=>{const tx=d.transaction([x.table,'trash'],'readwrite'),s=tx.objectStore(x.table),r=s.get(x.record.id);r.onsuccess=()=>{if(r.result){tx.abort();return}s.add(x.record);tx.objectStore('trash').delete(id)};tx.oncomplete=ok;tx.onabort=()=>no(Error('ID bereits vorhanden oder Wiederherstellung fehlgeschlagen'));tx.onerror=()=>no(tx.error)})}
export const uid=()=>crypto.randomUUID();
export async function backup(){const data={format:'einsatzlog',version:9,collections:{}};for(const t of tables)data.collections[t]=await all(t);return data}

// Abgleichender Import: bestehende IDs und inhaltlich identische Datensätze
// werden nicht erneut eingetragen. Bestehende Datensätze haben Vorrang.
export function validateBackup(data){
 if(data?.format!=='einsatzlog'||!data.collections||!['incidents','duties','templates','todos','procurement','payouts','keywords'].every(t=>Array.isArray(data.collections[t])))throw Error('Ungültiges EINSATZ.LOG-Backup.');
 for(const [name,values] of Object.entries(data.collections)){
  if(!tables.includes(name))continue;
  if(!Array.isArray(values)||values.length>100000||values.some(x=>!x||typeof x!=='object'||typeof x.id!=='string'||!x.id))throw Error('Ungültige Einträge in '+name);
 }
 return true;
}
function fingerprint(entry){const o={};for(const k of Object.keys(entry).sort())if(k!=='id')o[k]=entry[k];return JSON.stringify(o)}
// Reiner Lesetest vor jeder Übernahme. Entspricht den Regeln des abgleichenden Imports.
export async function previewBackup(data){
 validateBackup(data);
 const summary={added:0,existing:0,contentDuplicates:0,conflicts:0,byTable:{}};
 for(const table of tables){
  const entries=await all(table),ids=new Map(entries.map(x=>[x.id,x]));
  const prints=new Set(entries.map(fingerprint));
  const local={added:0,existing:0,contentDuplicates:0,conflicts:0};
  for(const x of data.collections[table]||[]){
   if(ids.has(x.id)){local.existing++;if(fingerprint(ids.get(x.id))!==fingerprint(x))local.conflicts++;continue}
   const fp=fingerprint(x);
   if(prints.has(fp)&&!['incidents','duties'].includes(table)){local.contentDuplicates++;continue}
   ids.set(x.id,x);prints.add(fp);local.added++;
  }
  summary.byTable[table]=local;
  for(const key of ['added','existing','contentDuplicates','conflicts'])summary[key]+=local[key];
 }
 return summary;
}
export async function mergeBackup(data){
 validateBackup(data);
 const d=await db();return new Promise((ok,no)=>{
  const tx=d.transaction(tables,'readwrite'),summary={added:0,existing:0,contentDuplicates:0,conflicts:0,byTable:{}};
  for(const table of tables){
   const incoming=data.collections[table]||[],s=tx.objectStore(table),req=s.getAll();
   req.onsuccess=()=>{
    const entries=req.result,ids=new Map(entries.map(x=>[x.id,x]));
    const prints=new Set(entries.map(fingerprint));
    const local={added:0,existing:0,contentDuplicates:0,conflicts:0};
    for(const x of incoming){
     if(ids.has(x.id)){local.existing++;if(fingerprint(ids.get(x.id))!==fingerprint(x))local.conflicts++;continue}
     const fp=fingerprint(x);if(prints.has(fp)&&!['incidents','duties'].includes(table)){local.contentDuplicates++;continue}
     s.put(x);ids.set(x.id,x);prints.add(fp);local.added++;
    }
    summary.byTable[table]=local;
    for(const key of ['added','existing','contentDuplicates','conflicts'])summary[key]+=local[key];
   };
  }
  tx.oncomplete=()=>ok(summary);
  tx.onerror=()=>no(tx.error||Error('Backup-Abgleich fehlgeschlagen'));
  tx.onabort=()=>no(tx.error||Error('Backup-Abgleich abgebrochen'));
 });
}

export async function restore(data){if(data?.format!=='einsatzlog'||!data.collections||!['incidents','duties','templates','todos','procurement','payouts','keywords'].every(t=>Array.isArray(data.collections[t])))throw Error('Ungültiges Backup');const d=await db();return new Promise((ok,no)=>{const tx=d.transaction(tables,'readwrite');for(const t of tables){if(['incidentRoles','vehicles'].includes(t)&&!Array.isArray(data.collections[t]))continue;const s=tx.objectStore(t);s.clear();for(const entry of (data.collections[t]||[]))s.put(entry)}tx.oncomplete=ok;tx.onerror=()=>no(tx.error)})}

// Mehrere Bekleidungsbewegungen innerhalb EINER IndexedDB-Transaktion.
// Aktualisierte Rückgaben werden vor der Prüfung neuer Vergaben berücksichtigt.
export async function changeClothing(updates=[],additions=[]){
 const d=await db();return new Promise((ok,no)=>{
  const tx=d.transaction('clothing','readwrite'),store=tx.objectStore('clothing');
  const req=store.getAll();let failed=false;
  req.onsuccess=()=>{
   const existing=req.result,ids=new Set(existing.map(x=>x.id));
   if(updates.some(x=>!ids.has(x.id))||additions.some(x=>ids.has(x.id))){failed=true;tx.abort();return}
   const changed=new Map(updates.map(x=>[x.id,x]));
   const final=existing.map(x=>changed.get(x.id)||x).concat(additions);
   const norm=s=>String(s||'').trim().replace(/\s+/g,'').toLocaleUpperCase('de-DE');
   const active=new Set();
   for(const item of final.filter(x=>!x.returnDate)){
    const n=norm(item.number);
    if(!n||active.has(n)){failed=true;tx.abort();return}
    active.add(n);
   }
   for(const item of updates.concat(additions))store.put(item);
  };
  req.onerror=()=>{failed=true};
  tx.oncomplete=()=>ok();
  tx.onabort=()=>no(new Error(failed?'Bekleidungsnummer schon aktiv vergeben oder Datensatz nicht vorhanden.':'Bekleidung konnte nicht gespeichert werden.'));
  tx.onerror=()=>{};
 })
}
