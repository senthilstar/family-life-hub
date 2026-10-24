export const K = { areas:"lh2:areas", logs:"lh2:logs", checkins:"lh2:checkins", cats:"lh:categories", diary:"lh:diary", mind:"lh:mind", reportInputs:"lh:report:inputs", reportHistory:"lh:report:history", dailyLog:"lh:daily:log", theme:"lh:theme", settings:"lh2:settings", seeded:"lh2:seeded" };
export const ls = {
  get(k,d=null){ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):d; }catch{ return d; } },
  set(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); return true; }catch(e){ console.warn("storage",e); window.dispatchEvent(new CustomEvent("lh:storage-error")); return false; } },
};
/* IndexedDB for Mindspace (photos/voice notes are too big for localStorage's ~5MB) */
let dbp;
function db(){ if(!dbp) dbp=new Promise((res,rej)=>{ const r=indexedDB.open("family-life-hub",1); r.onupgradeneeded=()=>r.result.createObjectStore("kv"); r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error); }); return dbp; }
export const idb = {
  async get(k){ const d=await db(); return new Promise((res,rej)=>{ const q=d.transaction("kv").objectStore("kv").get(k); q.onsuccess=()=>res(q.result); q.onerror=()=>rej(q.error); }); },
  async set(k,v){ const d=await db(); return new Promise((res,rej)=>{ const t=d.transaction("kv","readwrite"); t.objectStore("kv").put(v,k); t.oncomplete=()=>res(true); t.onerror=()=>rej(t.error); }); },
};
