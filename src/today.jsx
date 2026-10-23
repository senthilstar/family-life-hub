import { useState } from "react";
import Icon from "./icons.jsx";
import { Ring, Spark } from "./ui.jsx";
import { ItemRow, CheckinSheet } from "./areas.jsx";
import { todayStr, daysUntil, METRICS, shortDate } from "./data.js";

export function TodayView({ areas, api, checkins, logs, diary, goto }){
  const today=todayStr(); const ci=checkins[today]||{};
  const [ciArea,setCiArea]=useState(null);
  const nIn=areas.filter(a=>ci[a.id]).length, pct=areas.length?Math.round(nIn/areas.length*100):0;
  const due=[]; areas.forEach(a=>a.items.forEach(it=>{ if(!it.done&&it.due&&daysUntil(it.due)<=(a.bills?7:3)) due.push([a,it]); }));
  due.sort((x,y)=>x[1].due.localeCompare(y[1].due));
  const doing=[]; areas.forEach(a=>a.items.forEach(it=>{ if(!it.done&&it.status==="doing"&&!(it.due&&daysUntil(it.due)<=3)) doing.push([a,it]); }));
  const latest=(metric,person,kind)=>logs.filter(l=>l.metric===metric&&l.person===person&&(!kind||l.kind===kind)).sort((a,b)=>(a.date+a.ts).localeCompare(b.date+b.ts));
  const vitals=[["bp","Amma"],["bp","Appa"],["sugar","Amma","Fasting"],["sugar","Appa","Fasting"],["weight","Umaa"]].map(([m,p,k])=>{ const L=latest(m,p,k); return {m,p,k,L,last:L[L.length-1]}; }).filter(v=>v.L.length||v.m!=="sugar");
  const areaOf=k=>areas.find(a=>a.key===k);
  const hr=new Date().getHours(); const greet=hr<12?"Good morning":hr<17?"Good afternoon":"Good evening";
  return <div>
    <div className="card pad row" style={{marginBottom:14}}>
      <Ring pct={pct} label={`${nIn} of ${areas.length} areas checked in`}/>
      <div className="grow"><div className="serif" style={{fontSize:"1.15rem",fontWeight:600}}>{greet}, Senthil</div>
        <div className="small muted">{nIn}/{areas.length} life areas checked in today · {due.length} due soon</div>
        {!diary[today]&&<button className="small" style={{color:"var(--clay)",fontWeight:700,minHeight:36}} onClick={()=>goto("diary")}>✎ Write today's diary line</button>}</div>
    </div>

    <h2 className="sec-h">Daily check-in</h2>
    <div className="cigrid">{areas.map(a=><button key={a.id} className="ci" aria-pressed={!!ci[a.id]} onClick={()=>setCiArea(a)} title={ci[a.id]?.note||""}><span className="e">{a.emoji}</span><span style={{maxWidth:"100%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",padding:"0 4px"}}>{a.title}</span></button>)}</div>
    {Object.keys(ci).length>0&&areas.some(a=>ci[a.id]?.note)&&<div className="card pad small" style={{marginTop:10}}>{areas.filter(a=>ci[a.id]?.note).map(a=><div key={a.id} style={{padding:"3px 0"}}>{a.emoji} <strong>{a.title}:</strong> <span className="muted">{ci[a.id].note}</span></div>)}</div>}

    <h2 className="sec-h">Due & overdue</h2>
    {due.length===0?<div className="card pad faint small">Nothing due in the next few days. Add due dates to items to see them here.</div>:
    <div className="card" style={{padding:"4px 0"}}><ul style={{listStyle:"none",margin:0,padding:"0 4px"}}>{due.map(([a,it])=><div key={it.id} style={{"--a":a.accent}}><div className="xs faint" style={{padding:"6px 12px 0"}}>{a.emoji} {a.title}{a.groups?` · ${a.groups[it.group||0]}`:""}</div><ItemRow it={it} area={a} onToggle={()=>api.toggle(a.id,it.id)} onOpen={()=>api.openItem(a,it)}/></div>)}</ul></div>}

    {doing.length>0&&<><h2 className="sec-h">In progress</h2><div className="card" style={{padding:"4px 0"}}><ul style={{listStyle:"none",margin:0,padding:"0 4px"}}>{doing.slice(0,8).map(([a,it])=><div key={it.id}><div className="xs faint" style={{padding:"6px 12px 0"}}>{a.emoji} {a.title}</div><ItemRow it={it} area={a} onToggle={()=>api.toggle(a.id,it.id)} onOpen={()=>api.openItem(a,it)}/></div>)}</ul></div></>}

    <h2 className="sec-h">Health trends</h2>
    <div className="grid2">{vitals.map(v=>{ const M=METRICS[v.m]; const a=areaOf(v.m==="weight"?"umaa":"parents");
      return <button key={v.m+v.p+(v.k||"")} className="card pad" style={{textAlign:"left"}} onClick={()=>a&&goto("areas",a.id)}>
        <div className="xs faint">{v.p} · {M.label}{v.k?` (${v.k})`:""}</div>
        <div className="serif" style={{fontSize:19,fontWeight:600}}>{v.last?`${v.last.v1}${M.dual?"/"+v.last.v2:""}`:"—"} <span className="xs faint">{M.unit}</span></div>
        <div className="row" style={{justifyContent:"space-between"}}><Spark values={v.L.slice(-10).map(l=>l.v1)} w={90} h={26} color={a?.accent}/><span className="xs faint">{v.last?shortDate(v.last.date):"tap to log"}</span></div>
      </button>; })}</div>
    {ciArea&&<CheckinSheet area={ciArea} value={ci[ciArea.id]} onSave={val=>api.checkin(ciArea.id,val)} onClose={()=>setCiArea(null)}/>}
  </div>;
}
