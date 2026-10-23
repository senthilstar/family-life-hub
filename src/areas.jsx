import { useState } from "react";
import Icon from "./icons.jsx";
import { Sheet, Spark } from "./ui.jsx";
import { STATUS, REPEATS, METRICS, dueLabel, daysUntil, shortDate, todayStr, mkItem, uid, ACCENTS } from "./data.js";

export function ItemMeta({ it, area }){
  const ch=[];
  if(it.status&&it.status!=="todo"&&it.status!=="done") ch.push(<span key="s" className="chip gold">{STATUS[it.status]}</span>);
  if(it.due&&!it.done){ const n=daysUntil(it.due); ch.push(<span key="d" className={"chip "+(n<0?"warn":n<=2?"gold":"")}><Icon n="calendar" size={11}/>{dueLabel(it.due)}</span>); }
  if(it.amount) ch.push(<span key="a" className="chip">₹{Number(it.amount).toLocaleString("en-IN")}</span>);
  if(it.repeat&&it.repeat!=="none") ch.push(<span key="r" className="chip"><Icon n="refresh" size={11}/>{REPEATS[it.repeat][0]}</span>);
  if(it.notes) ch.push(<span key="n" className="chip"><Icon n="note" size={11}/>note</span>);
  if(it.paid?.length) ch.push(<span key="p" className="chip ok">paid {shortDate(it.paid[0].date)}</span>);
  return ch.length?<div className="meta">{ch}</div>:null;
}

export function ItemRow({ it, area, onToggle, onOpen }){
  return <li className={"item"+(it.done?" done":"")}>
    <button className="ib" aria-label={(it.done?"Mark not done: ":"Mark done: ")+it.text} aria-pressed={it.done} onClick={onToggle} style={{color:it.done?area.accent:"var(--faint)"}}><Icon n={it.done?"checkSquare":"square"} size={22}/></button>
    <button className="tx" onClick={onOpen} aria-label={"Edit "+it.text}><span className="t">{it.text}</span><ItemMeta it={it} area={area}/></button>
  </li>;
}

export function ItemSheet({ area, item, onSave, onDelete, onClose }){
  const [f,setF]=useState({...item}); const s=(k,v)=>setF(o=>({...o,[k]:v}));
  const isNew=!area.items.some(i=>i.id===item.id);
  const save=()=>{ if(!f.text.trim()) return; onSave({...f,text:f.text.trim(),done:f.status==="done"}); onClose(); };
  return <Sheet title={isNew?`Add to ${area.title}`:"Edit item"} onClose={onClose}>
    <div className="col">
      <div><label className="lbl" htmlFor="it-t">Item</label><input id="it-t" className="inp" value={f.text} onChange={e=>s("text",e.target.value)} onKeyDown={e=>e.key==="Enter"&&save()} placeholder="What needs doing?"/></div>
      {area.groups&&<div><span className="lbl">Section</span><div className="seg">{area.groups.map((g,i)=><button key={i} aria-pressed={f.group===i} onClick={()=>s("group",i)}>{g}</button>)}</div></div>}
      <div><span className="lbl">Status</span><div className="seg">{Object.entries(STATUS).map(([k,l])=><button key={k} aria-pressed={f.status===k} onClick={()=>s("status",k)}>{l}</button>)}</div></div>
      <div className="grid2">
        <div><label className="lbl" htmlFor="it-d">Due date</label><input id="it-d" type="date" className="inp" value={f.due} onChange={e=>s("due",e.target.value)}/></div>
        <div><label className="lbl" htmlFor="it-r">Repeats</label><select id="it-r" className="inp" value={f.repeat||"none"} onChange={e=>s("repeat",e.target.value)}>{Object.entries(REPEATS).map(([k,[l]])=><option key={k} value={k}>{l}</option>)}</select></div>
      </div>
      {(area.bills||area.key==="fin"||f.amount)&&<div><label className="lbl" htmlFor="it-a">Amount (₹)</label><input id="it-a" inputMode="decimal" className="inp" value={f.amount} onChange={e=>s("amount",e.target.value.replace(/[^\d.]/g,""))} placeholder="e.g. 12500"/></div>}
      <div><label className="lbl" htmlFor="it-n">Notes</label><textarea id="it-n" rows={3} className="inp" value={f.notes} onChange={e=>s("notes",e.target.value)} placeholder={area.bills?"Policy no., consumer no., how to pay…":"Details, phone numbers, documents needed…"}/></div>
      {f.paid?.length>0&&<div><span className="lbl">Payment history</span><div className="small muted">{f.paid.slice(0,8).map((p,i)=><div key={i}>✓ Paid {shortDate(p.date)}{p.due?` (due ${shortDate(p.due)})`:""}{p.amount?` · ₹${Number(p.amount).toLocaleString("en-IN")}`:""}</div>)}</div></div>}
      <button className="btn primary block" onClick={save} disabled={!f.text.trim()}><Icon n="save" size={16}/>{isNew?"Add item":"Save"}</button>
      {!isNew&&<button className="btn ghost block" style={{color:"var(--warn)"}} onClick={()=>{onDelete(item.id);onClose();}}><Icon n="trash" size={16}/>Delete item</button>}
    </div>
  </Sheet>;
}

export function AreaSheet({ area, onSave, onDelete, onClose }){
  const [t,setT]=useState(area?.title||""); const [e,setE]=useState(area?.emoji||"🗒️");
  return <Sheet title={area?"Edit list":"New list"} onClose={onClose}>
    <div className="col">
      <div className="row"><div style={{width:80}}><label className="lbl" htmlFor="a-e">Emoji</label><input id="a-e" className="inp" style={{textAlign:"center"}} value={e} onChange={x=>setE(x.target.value)}/></div>
      <div className="grow"><label className="lbl" htmlFor="a-t">Name</label><input id="a-t" className="inp" value={t} onChange={x=>setT(x.target.value)} onKeyDown={x=>x.key==="Enter"&&t.trim()&&(onSave({title:t.trim(),emoji:e||"🗒️"}),onClose())}/></div></div>
      <button className="btn primary block" disabled={!t.trim()} onClick={()=>{onSave({title:t.trim(),emoji:e||"🗒️"});onClose();}}>Save</button>
      {area&&onDelete&&<button className="btn ghost block" style={{color:"var(--warn)"}} onClick={()=>{ if(confirm(`Delete the "${area.title}" list and its items?`)){onDelete();onClose();} }}><Icon n="trash" size={16}/>Delete list</button>}
    </div>
  </Sheet>;
}

/* simple health logs: Parents BP / sugars, Umaa weight */
export function MetricPanel({ area, logs, addLog, delLog }){
  const [m,setM]=useState(area.metrics[0]); const M=METRICS[m];
  const [person,setPerson]=useState(M.people[0]); const [kind,setKind]=useState(M.kinds?.[0]||"");
  const [v1,setV1]=useState(""); const [v2,setV2]=useState(""); const [date,setDate]=useState(todayStr());
  const pickM=k=>{ setM(k); setPerson(METRICS[k].people[0]); setKind(METRICS[k].kinds?.[0]||""); setV1(""); setV2(""); };
  const mine=logs.filter(l=>l.metric===m&&l.person===person&&(!M.kinds||l.kind===kind)).sort((a,b)=>(a.date+a.ts).localeCompare(b.date+b.ts));
  const ok=v1&&(!M.dual||v2);
  const add=()=>{ if(!ok) return; addLog({id:uid(),metric:m,person,kind,v1:+v1,v2:M.dual?+v2:null,date,ts:String(Date.now())}); setV1(""); setV2(""); };
  const last=mine[mine.length-1], prev=mine[mine.length-2];
  const delta=last&&prev?(last.v1-prev.v1):null;
  return <div className="card pad" style={{background:"var(--soft)",margin:"4px 10px 10px",boxShadow:"none"}}>
    <div className="row" style={{justifyContent:"space-between",marginBottom:8}}><strong className="small"><Icon n="heart" size={14}/> Health log</strong>
      {area.metrics.length>1&&<div className="seg" style={{flex:"none"}}>{area.metrics.map(k=><button key={k} aria-pressed={m===k} onClick={()=>pickM(k)}>{METRICS[k].label}</button>)}</div>}</div>
    {M.people.length>1&&<div className="seg" style={{marginBottom:8}}>{M.people.map(p=><button key={p} aria-pressed={person===p} onClick={()=>setPerson(p)}>{p}</button>)}</div>}
    {M.kinds&&<div className="seg" style={{marginBottom:8}}>{M.kinds.map(k=><button key={k} aria-pressed={kind===k} onClick={()=>setKind(k)}>{k}</button>)}</div>}
    <div className="row" style={{flexWrap:"wrap"}}>
      <input aria-label={M.dual?M.dual[0]:M.label} className="inp" style={{width:M.dual?80:100,flex:"none"}} inputMode="decimal" placeholder={M.dual?M.dual[0]:M.unit} value={v1} onChange={e=>setV1(e.target.value.replace(/[^\d.]/g,""))}/>
      {M.dual&&<><span className="faint">/</span><input aria-label={M.dual[1]} className="inp" style={{width:80,flex:"none"}} inputMode="decimal" placeholder={M.dual[1]} value={v2} onChange={e=>setV2(e.target.value.replace(/[^\d.]/g,""))}/></>}
      <input aria-label="Date" type="date" className="inp" style={{width:150,flex:"none"}} value={date} max={todayStr()} onChange={e=>setDate(e.target.value||todayStr())}/>
      <button className="btn primary" disabled={!ok} onClick={add}><Icon n="plus" size={16}/>Log</button>
    </div>
    <div className="row" style={{marginTop:10,justifyContent:"space-between"}}>
      <div><div className="xs faint">Latest {M.label}{M.kinds?` (${kind})`:""} · {person}</div>
        <div className="serif" style={{fontSize:20,fontWeight:600}}>{last?`${last.v1}${M.dual?"/"+last.v2:""}`:"—"} <span className="xs faint">{M.unit}</span>
        {delta!=null&&<span className={"chip "+(delta>0?"warn":"ok")} style={{marginLeft:6}}>{delta>0?"▲":"▼"} {Math.abs(Math.round(delta*10)/10)}</span>}</div></div>
      <Spark values={mine.slice(-14).map(l=>l.v1)} color={area.accent}/>
    </div>
    {mine.length>0&&<table className="log"><tbody>{mine.slice(-6).reverse().map(l=><tr key={l.id}><td className="muted">{shortDate(l.date)}</td><td><strong>{l.v1}{M.dual?"/"+l.v2:""}</strong> <span className="faint xs">{M.unit}</span></td><td style={{textAlign:"right"}}><button className="ib" style={{minHeight:36}} aria-label="Delete reading" onClick={()=>delLog(l.id)}><Icon n="trash" size={14}/></button></td></tr>)}</tbody></table>}
  </div>;
}

export function AreaCard({ area, items, idx, api, checkedIn, logs }){
  const total=area.items.length, done=area.items.filter(i=>i.done).length, pct=total?done/total*100:0;
  const [ciOpen,setCiOpen]=useState(false);
  const groups=area.groups?area.groups.map((g,gi)=>[g,items.filter(i=>(i.group||0)===gi)]):[[null,items]];
  return <section className="card area" style={{"--a":area.accent,animationDelay:Math.min(idx*30,300)+"ms"}} id={"area-"+area.id}>
    <div className="ahead">
      <button className="tbtn" aria-expanded={!area.collapsed} onClick={()=>api.collapse(area.id)}>
        <span className="emoji">{area.emoji}</span>
        <span className="grow"><span className="ttl" style={{display:"flex",gap:6,alignItems:"center"}}>{area.title}{total>0&&done===total&&<Icon n="checkCircle" size={15} style={{color:area.accent}}/>}</span>
          <span className="xs faint">{area.nums?.length?"#"+area.nums.join(" + #")+" · ":""}{area.sub?area.sub+" · ":""}{done}/{total} done</span></span>
      </button>
      <button className="ib" aria-pressed={!!checkedIn} aria-label={checkedIn?"Checked in today — tap to edit":"Check in today"} onClick={()=>setCiOpen(true)} style={{color:checkedIn?"var(--ok)":"var(--faint)"}}><Icon n={checkedIn?"checkCircle":"clock"} size={20}/></button>
      <button className="ib" aria-label={"Edit list "+area.title} onClick={()=>api.editArea(area)}><Icon n="edit" size={17}/></button>
    </div>
    <div className="bar" style={{margin:"0 14px"}}><div style={{width:pct+"%",background:area.accent}}/></div>
    {!area.collapsed&&<div style={{padding:"6px 0 8px"}}>
      {area.metrics?.length>0&&<MetricPanel area={area} logs={logs} addLog={api.addLog} delLog={api.delLog}/>}
      {groups.map(([g,its],gi)=><div key={gi}>
        {g&&<div className="grp">{g}</div>}
        {its.length===0?<p className="faint small" style={{padding:"6px 16px",fontStyle:"italic",margin:0}}>Nothing here.</p>:
        <ul style={{listStyle:"none",margin:0,padding:"0 4px"}}>{its.map(it=><ItemRow key={it.id} it={it} area={area} onToggle={()=>api.toggle(area.id,it.id)} onOpen={()=>api.openItem(area,it)}/>)}</ul>}
      </div>)}
      <QuickAdd area={area} api={api}/>
    </div>}
    {ciOpen&&<CheckinSheet area={area} value={checkedIn} onSave={v=>api.checkin(area.id,v)} onClose={()=>setCiOpen(false)}/>}
  </section>;
}

function QuickAdd({ area, api }){
  const [v,setV]=useState(""); const [g,setG]=useState(0);
  const add=()=>{ const t=v.trim(); if(!t) return; api.addItem(area.id,mkItem({text:t,group:g,repeat:area.bills?"monthly":"none"})); setV(""); };
  return <div className="row" style={{padding:"4px 12px 4px"}}>
    {area.groups&&<select aria-label="Section" className="inp" style={{width:84,flex:"none",padding:"0 6px"}} value={g} onChange={e=>setG(+e.target.value)}>{area.groups.map((x,i)=><option key={i} value={i}>{i===0?"#1":"#17"}</option>)}</select>}
    <input className="inp" aria-label={"Add item to "+area.title} placeholder="Add an item…" value={v} onChange={e=>setV(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()}/>
    <button className="ib" aria-label="Add with details" onClick={()=>api.openItem(area,mkItem({text:v,group:g,repeat:area.bills?"monthly":"none"}))}><Icon n="edit" size={17}/></button>
    <button className="btn primary" style={{background:area.accent,padding:"0 14px"}} onClick={add} disabled={!v.trim()} aria-label="Add">Add</button>
  </div>;
}

export function CheckinSheet({ area, value, onSave, onClose }){
  const [note,setNote]=useState(value?.note||"");
  return <Sheet title={`${area.emoji} ${area.title} — today`} onClose={onClose}>
    <div className="col">
      <p className="muted small" style={{margin:0}}>Daily check-in: did you look at {area.title} today? Add a one-line note (optional).</p>
      <textarea className="inp" rows={3} value={note} onChange={e=>setNote(e.target.value)} placeholder="e.g. Called school about certificate; follow up Monday"/>
      <button className="btn primary block" onClick={()=>{onSave({note:note.trim(),ts:Date.now()});onClose();}}><Icon n="checkCircle" size={16}/>{value?"Update check-in":"Check in"}</button>
      {value&&<button className="btn ghost block" onClick={()=>{onSave(null);onClose();}}>Undo check-in</button>}
    </div>
  </Sheet>;
}

export function AreasView({ areas, api, checkins, logs }){
  const [q,setQ]=useState(""); const [filter,setFilter]=useState("all");
  const ql=q.trim().toLowerCase(); const today=checkins[todayStr()]||{};
  const cards=areas.map((c,idx)=>{
    const matchTitle=!ql||c.title.toLowerCase().includes(ql)||(c.groups||[]).some(g=>g.toLowerCase().includes(ql));
    const vis=c.items.filter(i=>{ if(filter==="pending"&&i.done)return false; if(filter==="done"&&!i.done)return false; if(ql&&!matchTitle&&!(i.text+" "+(i.notes||"")).toLowerCase().includes(ql))return false; return true; });
    if(ql&&!matchTitle&&vis.length===0) return null;
    if(!ql&&filter==="pending"&&c.items.length&&c.items.every(i=>i.done)) return null;
    if(!ql&&filter==="done"&&!c.items.some(i=>i.done)) return null;
    return <AreaCard key={c.id} area={c} items={vis} idx={idx} api={api} checkedIn={today[c.id]} logs={logs}/>;
  }).filter(Boolean);
  const allCollapsed=areas.every(a=>a.collapsed);
  return <div>
    <div className="row" style={{marginBottom:10,position:"relative"}}>
      <span className="faint" style={{position:"absolute",left:12,top:13}}><Icon n="search" size={17}/></span>
      <input type="search" aria-label="Search" className="inp" style={{paddingLeft:38,background:"var(--panel)"}} value={q} onChange={e=>setQ(e.target.value)} placeholder="Search items, notes, lists…"/>
    </div>
    <div className="row" style={{marginBottom:14}}>
      <div className="seg grow">{[["all","All"],["pending","To do"],["done","Done"]].map(([k,l])=><button key={k} aria-pressed={filter===k} onClick={()=>setFilter(k)}>{l}</button>)}</div>
      <button className="btn ghost" onClick={()=>api.collapseAll(!allCollapsed)}>{allCollapsed?"Expand":"Collapse"} all</button>
    </div>
    <div className="stack">{cards.length?cards:<p className="faint" style={{textAlign:"center",padding:30}}>No matches.</p>}</div>
    <button className="btn ghost block" style={{marginTop:14,borderStyle:"dashed",minHeight:52}} onClick={()=>api.editArea(null)}><Icon n="plus" size={16}/>New list</button>
  </div>;
}
export { ACCENTS };
