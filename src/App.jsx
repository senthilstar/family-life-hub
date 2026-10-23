import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Icon from "./icons.jsx";
import { Ring } from "./ui.jsx";
import { K, ls, idb } from "./store.js";
import { migrateOld, todayStr, addMonths, REPEATS, shortDate, ACCENTS, uid } from "./data.js";
import { AreasView, ItemSheet, AreaSheet } from "./areas.jsx";
import { TodayView } from "./today.jsx";
import { ReportView } from "./report.jsx";
import { DiaryView } from "./diary.jsx";
import { MindView } from "./mind.jsx";
import { SettingsSheet } from "./settings.jsx";

const TABS=[["today","Today","home"],["areas","Areas","grid"],["report","Report","newspaper"],["diary","Diary","book"],["mind","Mind","sparkles"]];
const usePersist=(key,init)=>{ const [v,setV]=useState(init); const set=useCallback(n=>{ setV(prev=>{ const val=typeof n==="function"?n(prev):n; ls.set(key,val); return val; }); },[key]); return [v,set]; };

export default function App(){
  const [tab,setTab]=useState(()=>{ const h=location.hash.slice(1); return TABS.some(t=>t[0]===h)?h:"today"; });
  const [areas,setAreas]=usePersist(K.areas, ls.get(K.areas)||migrateOld(ls.get(K.cats)));
  const [logs,setLogs]=usePersist(K.logs, ls.get(K.logs,[]));
  const [checkins,setCheckins]=usePersist(K.checkins, ls.get(K.checkins,{}));
  const [diary,setDiary]=usePersist(K.diary, ls.get(K.diary,{}));
  const [reportInputs,setReportInputs]=usePersist(K.reportInputs, ls.get(K.reportInputs,{calendar:"",email:"",whatsapp:"",extra:""}));
  const [reportHistory,setReportHistory]=usePersist(K.reportHistory, ls.get(K.reportHistory,[]));
  const [dailyLog,setDailyLog]=usePersist(K.dailyLog, ls.get(K.dailyLog,{}));
  const [settings,setSettings]=usePersist(K.settings, {theme:ls.get(K.theme,"auto"),...ls.get(K.settings,{})});
  const [mind,setMindState]=useState([]);
  const [toastS,setToastS]=useState(null); const tRef=useRef();
  const [itemEd,setItemEd]=useState(null); const [areaEd,setAreaEd]=useState(undefined); const [showSet,setShowSet]=useState(false);
  const [installEvt,setInstallEvt]=useState(null);

  const toast=useCallback((msg,undo)=>{ clearTimeout(tRef.current); setToastS({msg,undo}); tRef.current=setTimeout(()=>setToastS(null),undo?6000:2500); },[]);

  /* mind lives in IndexedDB; migrate the old localStorage copy once */
  useEffect(()=>{ (async()=>{ try{ let m=await idb.get("mind"); if(!m){ m=ls.get(K.mind,[]); await idb.set("mind",m); } setMindState(m||[]); }catch(e){ setMindState(ls.get(K.mind,[])); } })(); },[]);
  const setMind=useCallback(fn=>{ setMindState(prev=>{ const n=typeof fn==="function"?fn(prev):fn; idb.set("mind",n).catch(()=>{ if(!ls.set(K.mind,n)) toast("Storage full — delete some photos/voice notes"); }); return n; }); },[toast]);

  useEffect(()=>{ const t=settings.theme||"auto"; ls.set(K.theme,t); const apply=()=>{ const dark=t==="dark"||(t==="auto"&&matchMedia("(prefers-color-scheme: dark)").matches); document.documentElement.dataset.theme=dark?"dark":"light"; document.querySelector('meta[name=theme-color]')?.setAttribute("content",dark?"#16130f":"#bd5a37"); }; apply(); const mq=matchMedia("(prefers-color-scheme: dark)"); mq.addEventListener?.("change",apply); return ()=>mq.removeEventListener?.("change",apply); },[settings.theme]);
  useEffect(()=>{ const f=e=>{ e.preventDefault(); setInstallEvt(e); }; window.addEventListener("beforeinstallprompt",f); const se=()=>toast("Couldn't save — storage full. Export a backup and delete old media."); window.addEventListener("lh:storage-error",se); return ()=>{ window.removeEventListener("beforeinstallprompt",f); window.removeEventListener("lh:storage-error",se); }; },[]);
  useEffect(()=>{ history.replaceState(null,"","#"+tab); },[tab]);
  useEffect(()=>{ const f=()=>{ const h=location.hash.slice(1); if(TABS.some(t=>t[0]===h)) setTab(h); }; window.addEventListener("hashchange",f); return ()=>window.removeEventListener("hashchange",f); },[]);

  const goto=(t,areaId)=>{ setTab(t); window.scrollTo(0,0); if(areaId){ setAreas(as=>as.map(a=>a.id===areaId?{...a,collapsed:false}:a)); setTimeout(()=>document.getElementById("area-"+areaId)?.scrollIntoView({behavior:"smooth",block:"start"}),80); } };

  const mapItem=(aid,iid,fn)=>setAreas(as=>as.map(a=>a.id!==aid?a:{...a,items:a.items.map(i=>i.id===iid?fn(i):i)}));
  const api={
    toggle:(aid,iid)=>{ const prev=areas; const a=areas.find(x=>x.id===aid); const it=a?.items.find(i=>i.id===iid); if(!it) return;
      if(!it.done&&it.repeat&&it.repeat!=="none"&&it.due){ const next=addMonths(it.due,REPEATS[it.repeat][1]);
        mapItem(aid,iid,i=>({...i,status:"todo",done:false,due:next,paid:[{date:todayStr(),due:i.due,amount:i.amount},...(i.paid||[])].slice(0,36)}));
        toast(`✓ ${it.text} done · next due ${shortDate(next)}`,()=>setAreas(prev)); return; }
      mapItem(aid,iid,i=>({...i,done:!i.done,status:!i.done?"done":(i.status==="done"?"todo":i.status)})); },
    addItem:(aid,item)=>setAreas(as=>as.map(a=>a.id!==aid?a:{...a,items:[...a.items,item]})),
    saveItem:(aid,item)=>setAreas(as=>as.map(a=>a.id!==aid?a:{...a,items:a.items.some(i=>i.id===item.id)?a.items.map(i=>i.id===item.id?item:i):[...a.items,item]})),
    delItem:(aid,iid)=>{ const prev=areas; setAreas(as=>as.map(a=>a.id!==aid?a:{...a,items:a.items.filter(i=>i.id!==iid)})); toast("Item deleted",()=>setAreas(prev)); },
    collapse:aid=>setAreas(as=>as.map(a=>a.id!==aid?a:{...a,collapsed:!a.collapsed})),
    collapseAll:v=>setAreas(as=>as.map(a=>({...a,collapsed:v}))),
    editArea:a=>setAreaEd(a),
    openItem:(area,item)=>setItemEd({area,item}),
    checkin:(aid,val)=>setCheckins(c=>{ const d=todayStr(); const day={...(c[d]||{})}; if(val) day[aid]=val; else delete day[aid]; return {...c,[d]:day}; }),
    addLog:l=>setLogs(ls_=>[...ls_,l]),
    delLog:id=>{ const prev=logs; setLogs(ls_=>ls_.filter(l=>l.id!==id)); toast("Reading deleted",()=>setLogs(prev)); },
  };

  const exportAll=async()=>{
    const data={areas,logs,checkins,diary,mind,reportInputs,reportHistory,dailyLog,settings};
    const blob=new Blob([JSON.stringify({app:"family-life-hub",version:2,exportedAt:new Date().toISOString(),data},null,1)],{type:"application/json"});
    const name=`family-life-hub-backup-${todayStr()}.json`; const file=new File([blob],name,{type:"application/json"});
    if(navigator.canShare?.({files:[file]})&&/Android|iPhone|iPad/i.test(navigator.userAgent)){ try{ await navigator.share({files:[file],title:name}); return; }catch(e){ if(e.name==="AbortError") return; } }
    const u=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=u; a.download=name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(u),2000); toast("Backup downloaded");
  };
  const importAll=(text,mode)=>{
    let obj; try{ obj=JSON.parse(text); }catch{ toast("That isn't valid JSON"); return; }
    let d;
    if(obj&&obj.app==="family-life-hub"&&obj.data) d=obj.data;
    else if(obj&&Object.keys(obj).some(k=>k.startsWith("lh:"))){ const g=k=>{ const v=obj[k]; if(v==null) return undefined; try{ return typeof v==="string"?JSON.parse(v):v; }catch{ return undefined; } };
      d={ legacyCats:g(K.cats), diary:g(K.diary), mind:g(K.mind), reportInputs:g(K.reportInputs), reportHistory:g(K.reportHistory), dailyLog:g(K.dailyLog) }; }
    else { toast("Unrecognised backup file"); return; }
    if(mode==="replace"&&!confirm("Replace ALL current data with this backup?")) return;
    const byId=(a,b)=>{ const m=new Map(); [...(a||[]),...(b||[])].forEach(x=>m.set(x.id,x)); return [...m.values()]; };
    const merge=mode==="merge";
    if(d.legacyCats) setAreas(cur=>migrateOld(d.legacyCats, merge?cur:undefined));
    else if(d.areas) setAreas(cur=>{ if(!merge) return d.areas; const out=cur.map(a=>{ const inc=d.areas.find(x=>x.id===a.id||x.key===a.key); return inc?{...a,items:byId(a.items,inc.items)}:a; }); d.areas.forEach(x=>{ if(!out.some(a=>a.id===x.id||a.key===x.key)) out.push(x); }); return out; });
    if(d.logs) setLogs(cur=>merge?byId(cur,d.logs):d.logs);
    if(d.checkins) setCheckins(cur=>{ if(!merge) return d.checkins; const o={...cur}; for(const k in d.checkins) o[k]={...(o[k]||{}),...d.checkins[k]}; return o; });
    if(d.diary) setDiary(cur=>merge?{...cur,...d.diary}:d.diary);
    if(d.mind) setMind(cur=>(merge?byId(cur,d.mind):d.mind).sort((a,b)=>b.createdAt-a.createdAt));
    if(d.reportInputs) setReportInputs(cur=>merge?{...cur,...d.reportInputs}:d.reportInputs);
    if(d.reportHistory) setReportHistory(cur=>(merge?byId(cur,d.reportHistory):d.reportHistory).sort((a,b)=>b.ts-a.ts).slice(0,30));
    if(d.dailyLog) setDailyLog(cur=>merge?{...d.dailyLog,...cur}:d.dailyLog);
    if(d.settings&&!merge) setSettings(d.settings);
    setShowSet(false); toast("Import complete");
  };

  const total=areas.reduce((s,c)=>s+c.items.length,0), done=areas.reduce((s,c)=>s+c.items.filter(i=>i.done).length,0);
  const titles={today:"Today",areas:"Life areas",report:"Daily report",diary:"Daily diary",mind:"Mindspace"};
  const subs={today:new Date().toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"long"}),areas:`${areas.length} areas · ${done} of ${total} done · ${total-done} pending`,report:"Your briefing, on demand",diary:"A line a day keeps it close",mind:"Catch a thought before it flies"};
  const stats=useMemo(()=>{ let n=0; try{ for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); n+=(localStorage.getItem(k)||"").length; } }catch{} return `${Math.round(n/1024)} KB lists + ${mind.length} mind items`; },[areas,diary,logs,mind,showSet]);

  return <>
    <div className="glow" aria-hidden="true"/>
    <div className="wrap" style={{position:"relative"}}>
      <header className="top">
        <div style={{minWidth:0}}><div className="kicker">Family Life Hub</div><h1>{titles[tab]}</h1><p className="subt">{subs[tab]}</p></div>
        <div className="row" style={{gap:4}}>
          {tab==="areas"&&<Ring pct={total?Math.round(done/total*100):0} size={62}/>}
          <button className="ib" aria-label="Settings and backup" onClick={()=>setShowSet(true)}><Icon n="settings" size={21}/></button>
        </div>
      </header>
      <main>
        {tab==="today"&&<TodayView areas={areas} api={api} checkins={checkins} logs={logs} diary={diary} goto={goto}/>}
        {tab==="areas"&&<AreasView areas={areas} api={api} checkins={checkins} logs={logs}/>}
        {tab==="report"&&<ReportView inputs={reportInputs} persistInputs={setReportInputs} history={reportHistory} addReport={r=>setReportHistory(h=>[r,...h].slice(0,30))} delReport={id=>setReportHistory(h=>h.filter(r=>r.id!==id))} dailyLog={dailyLog} persistDailyLog={setDailyLog} areas={areas} settings={settings} toast={toast}/>}
        {tab==="diary"&&<DiaryView diary={diary} persist={setDiary} toast={toast}/>}
        {tab==="mind"&&<MindView mind={mind} addMind={m=>setMind(p=>[m,...p])} delMind={m=>{ const prev=mind; setMind(p=>p.filter(x=>x.id!==m.id)); toast("Deleted",()=>setMind(prev)); }} toast={toast}/>}
      </main>
    </div>
    <nav className="tabs" aria-label="Main"><div className="in">{TABS.map(([k,l,ic])=><button key={k} aria-current={tab===k?"page":undefined} onClick={()=>{setTab(k);window.scrollTo(0,0);}}><Icon n={ic} size={22}/>{l}</button>)}</div></nav>
    {itemEd&&<ItemSheet area={itemEd.area} item={itemEd.item} onSave={it=>api.saveItem(itemEd.area.id,it)} onDelete={iid=>api.delItem(itemEd.area.id,iid)} onClose={()=>setItemEd(null)}/>}
    {areaEd!==undefined&&<AreaSheet area={areaEd} onClose={()=>setAreaEd(undefined)}
      onSave={v=>areaEd?setAreas(as=>as.map(a=>a.id===areaEd.id?{...a,...v}:a)):setAreas(as=>[...as,{id:uid(),key:"custom-"+uid(),nums:[],title:v.title,emoji:v.emoji,sub:"",groups:null,metrics:[],bills:false,accent:ACCENTS[as.length%ACCENTS.length],collapsed:false,items:[]}])}
      onDelete={areaEd?()=>{ const prev=areas; setAreas(as=>as.filter(a=>a.id!==areaEd.id)); toast(`"${areaEd.title}" deleted`,()=>setAreas(prev)); }:null}/>}
    {showSet&&<SettingsSheet settings={settings} setSettings={setSettings} onExport={exportAll} onImport={importAll} onClose={()=>setShowSet(false)} installEvt={installEvt} stats={stats} onInstall={async()=>{ installEvt.prompt(); await installEvt.userChoice; setInstallEvt(null); }}/>}
    {toastS&&<div className="toast" role="status"><span>{toastS.msg}</span>{toastS.undo&&<button onClick={()=>{toastS.undo();setToastS(null);}}>Undo</button>}<button aria-label="Dismiss" onClick={()=>setToastS(null)} style={{color:"inherit"}}>✕</button></div>}
  </>;
}
