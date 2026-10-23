import { useEffect, useRef, useState } from "react";
import Icon from "./icons.jsx";
import { todayStr, prettyDate, parseD } from "./data.js";
export function DiaryView({ diary, persist, toast }){
  const [date,setDate]=useState(todayStr()); const [text,setText]=useState(diary[todayStr()]||"");
  const [dirty,setDirty]=useState(false); const [q,setQ]=useState("");
  const cur=useRef({date,text,dirty}); cur.current={date,text,dirty};
  const saveNow=(d=date,t=text)=>{ const n={...diary}; if(t.trim()) n[d]=t; else delete n[d]; persist(n); setDirty(false); };
  // autosave 0.8s after typing stops (original lost unsaved text when switching dates)
  useEffect(()=>{ if(!dirty) return; const h=setTimeout(()=>saveNow(),800); return ()=>clearTimeout(h); },[text,dirty]);
  const switchTo=d=>{ if(cur.current.dirty) saveNow(); setDate(d); setText(diary[d]||""); setDirty(false); window.scrollTo({top:0,behavior:"smooth"}); };
  useEffect(()=>()=>{ const c=cur.current; if(c.dirty){ /* flush on unmount */ const n={...diary}; if(c.text.trim()) n[c.date]=c.text; else delete n[c.date]; persist(n);} },[]);
  const ql=q.trim().toLowerCase();
  const past=Object.keys(diary).sort((a,b)=>b.localeCompare(a)).filter(d=>!ql||diary[d].toLowerCase().includes(ql));
  const words=text.trim()?text.trim().split(/\s+/).length:0;
  const streak=(()=>{ let n=0; const d=new Date(); if(!diary[todayStr()]) d.setDate(d.getDate()-1); for(;;){ const s=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); if(diary[s]){n++;d.setDate(d.getDate()-1);} else break; } return n; })();
  return <div>
    <div className="card pad row" style={{marginBottom:12}}>
      <span style={{background:"color-mix(in srgb,var(--clay) 13%,transparent)",color:"var(--clay)",padding:9,borderRadius:12,display:"inline-flex"}}><Icon n="calendar" size={18}/></span>
      <div className="grow"><label className="xs faint" htmlFor="d-date" style={{fontWeight:700,textTransform:"uppercase",letterSpacing:".05em"}}>Entry for</label>
        <input id="d-date" type="date" value={date} max={todayStr()} onChange={e=>e.target.value&&switchTo(e.target.value)} className="serif" style={{display:"block",background:"transparent",border:0,fontWeight:600,fontSize:16,outline:"none",minHeight:32}}/></div>
      {date!==todayStr()&&<button className="btn ghost" onClick={()=>switchTo(todayStr())}>Today</button>}
      {streak>0&&<span className="chip ok">🔥 {streak}d</span>}
    </div>
    <p className="serif muted" style={{fontStyle:"italic",fontSize:"1.1rem",margin:"0 4px 8px"}}>{prettyDate(date)}</p>
    <textarea aria-label="Diary entry" className="inp" rows={10} style={{background:"var(--panel)",fontSize:16,lineHeight:1.7,padding:14,borderRadius:18}} value={text} onChange={e=>{setText(e.target.value);setDirty(true);}} placeholder="How was today? What happened, what you felt, what you're grateful for…"/>
    <div className="row" style={{justifyContent:"space-between",marginTop:8}}>
      <span className="xs faint">{words} words · {dirty?"saving…":"saved"}</span>
      <button className="btn primary" disabled={!dirty} onClick={()=>{saveNow();toast("Entry saved");}}><Icon n="save" size={15}/>Save entry</button>
    </div>
    {Object.keys(diary).length>0&&<>
      <h2 className="sec-h">Past entries</h2>
      <input type="search" aria-label="Search diary" className="inp" style={{marginBottom:10,background:"var(--panel)"}} placeholder="Search diary…" value={q} onChange={e=>setQ(e.target.value)}/>
      <div className="stack">{past.map(d=><button key={d} onClick={()=>switchTo(d)} className="card pad" style={{width:"100%",textAlign:"left",boxShadow:"none",...(d===date?{borderColor:"var(--clay)"}:{})}}>
        <div className="xs" style={{color:"var(--clay)",fontWeight:800,textTransform:"uppercase"}}>{parseD(d).toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric",year:"numeric"})}</div>
        <div className="small muted" style={{display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{diary[d]}</div></button>)}</div>
    </>}
  </div>;
}
