import { useEffect, useRef } from "react";
import Icon from "./icons.jsx";
export function Sheet({ title, onClose, children }){
  const ref=useRef(null);
  useEffect(()=>{ const k=e=>e.key==="Escape"&&onClose(); window.addEventListener("keydown",k); const el=ref.current?.querySelector("input,textarea,select"); el&&setTimeout(()=>el.focus(),60); return ()=>window.removeEventListener("keydown",k); },[]);
  return <div className="sheet-bg" onClick={e=>e.target===e.currentTarget&&onClose()}>
    <div className="sheet" role="dialog" aria-modal="true" aria-label={title} ref={ref}>
      <div className="grabber"/>
      <div className="row" style={{marginBottom:10}}><h2 className="serif grow" style={{margin:0,fontSize:"1.3rem"}}>{title}</h2><button className="ib" aria-label="Close" onClick={onClose}><Icon n="x"/></button></div>
      {children}
    </div>
  </div>;
}
export function Ring({ pct, size=70, label }){
  const r=size/2-9, c=2*Math.PI*r;
  return <div style={{position:"relative",width:size,height:size,flex:"none"}} role="img" aria-label={label||`${pct}%`}>
    <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}><circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--line)" strokeWidth="6"/><circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--clay)" strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c-c*pct/100} style={{transition:"stroke-dashoffset .6s"}}/></svg>
    <div className="serif" style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:600,fontSize:17}}>{pct}%</div>
  </div>;
}
export function Spark({ values, color="var(--clay)", w=110, h=32 }){
  const v=values.filter(x=>x!=null&&!isNaN(x)); if(v.length<2) return <span className="faint xs">{v.length?"1 reading":"no data"}</span>;
  const mn=Math.min(...v), mx=Math.max(...v), rg=mx-mn||1;
  const pts=v.map((x,i)=>`${(i/(v.length-1)*(w-4)+2).toFixed(1)},${(h-2-(x-mn)/rg*(h-4)).toFixed(1)}`).join(" ");
  return <svg width={w} height={h} aria-hidden="true"><polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/></svg>;
}
export function Section({ id, open, setOpen, icon, title, hint, children, defOpen }){
  const isOpen=open[id]??!!defOpen;
  return <section className="card" style={{marginBottom:12,overflow:"hidden"}}>
    <button aria-expanded={isOpen} onClick={()=>setOpen(o=>({...o,[id]:!isOpen}))} className="row" style={{width:"100%",padding:"12px 14px",textAlign:"left",minHeight:56}}>
      <span style={{background:"color-mix(in srgb,var(--clay) 13%,transparent)",color:"var(--clay)",padding:8,borderRadius:12,display:"inline-flex"}}><Icon n={icon} size={18}/></span>
      <span className="grow"><span className="serif" style={{display:"block",fontWeight:600,fontSize:"1.05rem"}}>{title}</span>{hint&&<span className="faint xs">{hint}</span>}</span>
      <Icon n={isOpen?"chevDown":"chevRight"} size={18} style={{color:"var(--faint)"}}/>
    </button>
    {isOpen&&<div style={{padding:"0 14px 14px"}}>{children}</div>}
  </section>;
}
