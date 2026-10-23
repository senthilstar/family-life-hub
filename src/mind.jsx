import { useRef, useState } from "react";
import Icon from "./icons.jsx";
import { uid } from "./data.js";
export function MindView({ mind, addMind, delMind, toast }){
  const [note,setNote]=useState(""); const [recording,setRecording]=useState(false); const [recTime,setRecTime]=useState(0);
  const [err,setErr]=useState(""); const [q,setQ]=useState("");
  const recRef=useRef(null), chunks=useRef([]), timer=useRef(null), fileRef=useRef(null), t0=useRef(0);
  const saveNote=()=>{ if(!note.trim())return; addMind({id:uid(),type:"note",title:note.slice(0,40),text:note.trim(),createdAt:Date.now()}); setNote(""); };
  const startRec=async()=>{ setErr(""); try{
    const stream=await navigator.mediaDevices.getUserMedia({audio:true});
    const mr=new MediaRecorder(stream); chunks.current=[];
    mr.ondataavailable=e=>e.data.size&&chunks.current.push(e.data);
    mr.onstop=()=>{ stream.getTracks().forEach(t=>t.stop()); clearInterval(timer.current);
      const dur=Math.round((Date.now()-t0.current)/1000); // fix: original read a stale recTime (always 0)
      const blob=new Blob(chunks.current,{type:mr.mimeType||"audio/webm"}); // fix: Safari records mp4, not webm
      const fr=new FileReader(); fr.onloadend=()=>{ addMind({id:uid(),type:"audio",title:"Voice note",dataUrl:fr.result,dur,createdAt:Date.now()}); setRecTime(0); }; fr.readAsDataURL(blob); };
    mr.start(); recRef.current=mr; t0.current=Date.now(); setRecording(true); setRecTime(0); timer.current=setInterval(()=>setRecTime(Math.round((Date.now()-t0.current)/1000)),500);
  }catch(e){ setErr("Microphone unavailable here. Add a note or photo instead."); } };
  const stopRec=()=>{ recRef.current&&recRef.current.state!=="inactive"&&recRef.current.stop(); setRecording(false); };
  const onImage=e=>{ const f=e.target.files&&e.target.files[0]; if(!f)return; setErr("");
    const fr=new FileReader(); fr.onload=()=>{ const img=new Image(); img.onload=()=>{ const max=1200; let{width,height}=img;
      if(width>max||height>max){ const r=Math.min(max/width,max/height); width=Math.round(width*r); height=Math.round(height*r); }
      const cv=document.createElement("canvas"); cv.width=width; cv.height=height; cv.getContext("2d").drawImage(img,0,0,width,height);
      addMind({id:uid(),type:"image",title:f.name,dataUrl:cv.toDataURL("image/jpeg",0.78),caption:note.trim(),createdAt:Date.now()}); setNote(""); };
      img.onerror=()=>setErr("Couldn't read that image."); img.src=fr.result; }; fr.readAsDataURL(f); e.target.value=""; };
  const ql=q.trim().toLowerCase(); const list=mind.filter(m=>!ql||((m.text||"")+(m.caption||"")+(m.title||"")).toLowerCase().includes(ql));
  const mmss=s=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  return <div>
    <div className="card pad" style={{marginBottom:14}}>
      <textarea aria-label="New thought" className="inp" style={{background:"transparent",border:0,padding:0,minHeight:70}} rows={3} value={note} onChange={e=>setNote(e.target.value)} placeholder="Drop a thought, idea, or reminder…"/>
      <div className="row" style={{borderTop:"1px solid var(--line)",paddingTop:10,flexWrap:"wrap"}}>
        {!recording?<button className="btn" style={{background:"color-mix(in srgb,var(--teal) 14%,transparent)",color:"var(--teal)"}} onClick={startRec}><Icon n="mic" size={16}/>Record</button>
          :<button className="btn" style={{background:"var(--clayD)",color:"#fff"}} onClick={stopRec}>● Stop · {mmss(recTime)}</button>}
        <button className="btn" style={{background:"color-mix(in srgb,var(--sage) 14%,transparent)",color:"var(--sage)"}} onClick={()=>fileRef.current?.click()}><Icon n="image" size={16}/>Photo</button>
        <input ref={fileRef} type="file" accept="image/*" onChange={onImage} hidden/>
        <span className="grow"/>
        <button className="btn primary" disabled={!note.trim()} onClick={saveNote}><Icon n="plus" size={15}/>Add</button>
      </div>
      {err&&<p className="err"><Icon n="alert" size={14}/>{err}</p>}
    </div>
    {mind.length>3&&<input type="search" aria-label="Search mindspace" className="inp" style={{marginBottom:12,background:"var(--panel)"}} placeholder="Search notes…" value={q} onChange={e=>setQ(e.target.value)}/>}
    {mind.length===0?<div className="faint" style={{textAlign:"center",padding:"50px 0"}}><Icon n="sparkles" size={28}/><p className="small">Your mindspace is empty. Add a thought, voice note, or picture.</p></div>:
    <div className="masonry">{list.map(m=><MindCard key={m.id} m={m} onDelete={()=>delMind(m)}/>)}</div>}
  </div>;
}
function MindCard({ m, onDelete }){
  const [playing,setPlaying]=useState(false); const a=useRef(null);
  const tone={note:"var(--gold)",audio:"var(--teal)",image:"var(--sage)"}[m.type];
  return <div className="card pad">
    <div className="row" style={{justifyContent:"space-between"}}>
      <span className="chip" style={{color:tone,textTransform:"uppercase"}}><Icon n={m.type==="audio"?"mic":m.type} size={12}/>{m.type}</span>
      <button className="ib" aria-label="Delete" onClick={onDelete}><Icon n="trash" size={15}/></button>
    </div>
    {m.type==="note"&&<p style={{whiteSpace:"pre-wrap",lineHeight:1.55,margin:"4px 0"}}>{m.text}</p>}
    {m.type==="image"&&<><img src={m.dataUrl} alt={m.caption||m.title} loading="lazy" style={{width:"100%",borderRadius:12,display:"block",marginTop:4}}/>{m.caption&&<p className="small" style={{margin:"6px 0 0"}}>{m.caption}</p>}</>}
    {m.type==="audio"&&<div className="row" style={{marginTop:4}}>
      <button className="ib" aria-label={playing?"Pause":"Play"} style={{background:tone,color:"#fff",borderRadius:99}} onClick={()=>{ const el=a.current; if(!el) return; playing?el.pause():el.play().catch(()=>{}); }}><Icon n={playing?"pause":"play"} size={16}/></button>
      <div><div className="small" style={{fontWeight:700}}>Voice note</div><div className="xs faint">{m.dur?`${Math.floor(m.dur/60)}:${String(m.dur%60).padStart(2,"0")}`:""}</div></div>
      <audio ref={a} src={m.dataUrl} preload="none" onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onEnded={()=>setPlaying(false)}/>
    </div>}
    <div className="xs faint" style={{marginTop:8}}>{new Date(m.createdAt).toLocaleString(undefined,{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}</div>
  </div>;
}
