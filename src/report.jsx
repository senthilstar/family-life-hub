import { useState } from "react";
import Icon from "./icons.jsx";
import { Section } from "./ui.jsx";
import { DAILY, todayStr, prettyDate, uid, daysUntil } from "./data.js";

const SLOTS=["06:00","08:00","10:00","12:00","14:00","16:00","18:00","20:00","22:00","00:00"];
function nearestSlot(){ const h=new Date().getHours()||24; let best=SLOTS[0],bd=99; SLOTS.forEach(s=>{ const sh=parseInt(s,10)||24; const d=Math.abs(sh-h); if(d<bd){bd=d;best=s;} }); return best; }
export function defaultEndpoint(){ return location.hostname.endsWith("netlify.app")?"/.netlify/functions/report":""; }

function CheckRow({ checked, onClick, label, muted }){
  return <button onClick={onClick} aria-pressed={checked} className="row" style={{width:"100%",minHeight:40,textAlign:"left"}}>
    <span style={{color:checked?"var(--clay)":"var(--faint)",display:"inline-flex"}}><Icon n={checked?"checkSquare":"square"} size={19}/></span>
    <span style={{color:checked||muted?"var(--faint)":"var(--ink)",textDecoration:checked?"line-through":"none",fontStyle:muted?"italic":"normal",fontSize:15}}>{label}</span>
  </button>;
}

export function ReportView({ inputs, persistInputs, history, addReport, delReport, dailyLog, persistDailyLog, areas, settings, toast }){
  const [slot,setSlot]=useState(nearestSlot()); const [loading,setLoading]=useState(false); const [err,setErr]=useState(""); const [open,setOpen]=useState({});
  const [paste,setPaste]=useState("");
  const today=todayStr(); const doneToday=dailyLog[today]||{};
  const toggleDaily=key=>persistDailyLog({...dailyLog,[today]:{...doneToday,[key]:!doneToday[key]}});
  const dailyDone=Object.values(doneToday).filter(Boolean).length;
  const dailyTotal=DAILY.reduce((a,c)=>a+Math.max(c.items.length,1),0);
  const endpoint=(settings.endpoint??defaultEndpoint()).trim();
  const buildPrompt=()=>{
    const cl=DAILY.map(c=>`${c.emoji} ${c.title}: ${c.items.length?c.items.join(", "):"—"}`).join("\n");
    const open_=[]; areas.forEach(a=>a.items.forEach(it=>{ if(!it.done&&(it.due&&daysUntil(it.due)<=7||it.status==="doing")) open_.push(`${a.emoji} ${a.title}: ${it.text}${it.due?` (due ${it.due})`:""}`); }));
    return `You are my personal daily-briefing assistant. Today is ${prettyDate(today)}, generating the ${slot} update (two-hourly cadence, 6am-midnight). Be concise and skimmable. Use live web search for current data.

Produce a report with these short sections:
A) India Markets Pulse - Nifty/Sensex latest level & direction, top movers, IT/banking/energy, 3 risk flags, 5 watch-items for next session.
B) Financials - notable RBI / rupee / earnings / policy items.
C) Social Pulse (themes on X/Twitter & news) - dominant market & tech narratives. Note these are themes from web sources, not a direct X feed.
D) Oncology World - recent FDA approvals, guideline updates (ASCO/NCCN), upcoming action dates.
E) Tech + AI News - top 5 items with one-line "why it matters".
F) My day - weave in anything actionable from my pasted data below.

My calendar: ${inputs.calendar||"(none)"}
My email notes: ${inputs.email||"(none)"}
My WhatsApp notes: ${inputs.whatsapp||"(none)"}
Standing extra focus: ${inputs.extra||"(none)"}

Today's discussion checklist (context, don't just repeat):
${cl}

Open items due this week / in progress:
${open_.join("\n")||"(none)"}

End with a line "-> Data I still need from you:" listing 2-3 specific things that would sharpen the next update.`;
  };
  const gen=async()=>{ setErr(""); if(!endpoint){ setErr("No AI endpoint configured on this host. Use “Copy prompt” or “Open in ChatGPT / Claude” below, then paste the answer back to save it."); setOpen(o=>({...o,manual:true})); return; }
    setLoading(true); try{
      const res=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:buildPrompt()})});
      if(!res.ok) throw new Error("HTTP "+res.status); const data=await res.json(); if(!data.text) throw new Error("empty");
      addReport({id:uid(),ts:Date.now(),slot,date:today,text:data.text});
    }catch(e){ setErr(`Live report failed (${e.message}). The endpoint needs a server with an API key. Meanwhile use the manual option below.`); setOpen(o=>({...o,manual:true})); }
    finally{ setLoading(false); } };
  const copy=async t=>{ try{ await navigator.clipboard.writeText(t); toast("Copied"); }catch{ toast("Copy failed — long-press to select"); } };
  const shareWA=t=>window.open("https://wa.me/?text="+encodeURIComponent(t),"_blank","noopener");
  const shareNative=async t=>{ if(navigator.share){ try{ await navigator.share({title:"Daily report",text:t}); return; }catch(e){ if(e?.name==="AbortError") return; } } shareWA(t); };
  const openAI=url=>{ const p=buildPrompt(); copy(p); window.open(url+encodeURIComponent(p),"_blank","noopener"); };
  return <div>
    <Section open={open} setOpen={setOpen} id="generate" defOpen icon="trending" title="Generate live briefing" hint="Markets · financials · oncology · tech · AI">
      <div className="row" style={{flexWrap:"wrap",gap:6,marginBottom:12}}>
        {SLOTS.map(s=><button key={s} aria-pressed={slot===s} onClick={()=>setSlot(s)} className="chip" style={{minHeight:36,padding:"0 10px",fontSize:13,...(slot===s?{background:"var(--clay)",color:"#fff",borderColor:"var(--clay)"}:{})}}>{s}</button>)}
      </div>
      <button className="btn primary block" onClick={gen} disabled={loading}>{loading?<><span className="spin"><Icon n="loader" size={16}/></span>Searching & writing…</>:<><Icon n="refresh" size={16}/>Generate {slot} report</>}</button>
      {err&&<p className="err"><Icon n="alert" size={14}/>{err}</p>}
      <div className="grid2" style={{marginTop:10}}>
        <button className="btn ghost" onClick={()=>openAI("https://chatgpt.com/?q=")}><Icon n="link" size={15}/>ChatGPT</button>
        <button className="btn ghost" onClick={()=>openAI("https://claude.ai/new?q=")}><Icon n="link" size={15}/>Claude</button>
      </div>
      <button className="btn ghost block" style={{marginTop:10}} onClick={()=>copy(buildPrompt())}><Icon n="copy" size={15}/>Copy prompt</button>
      <p className="faint xs" style={{lineHeight:1.5}}>The prompt includes your pasted data, the daily checklist and items due this week. Free option: open it in ChatGPT/Claude (prompt also copied), then paste the answer below to keep it.</p>
    </Section>
    <Section open={open} setOpen={setOpen} id="manual" icon="save" title="Save a report you got elsewhere" hint="Paste an AI answer to keep & share it">
      <textarea className="inp" rows={5} value={paste} onChange={e=>setPaste(e.target.value)} placeholder="Paste the briefing here…"/>
      <button className="btn primary block" style={{marginTop:8}} disabled={!paste.trim()} onClick={()=>{ addReport({id:uid(),ts:Date.now(),slot,date:today,text:paste.trim()}); setPaste(""); setOpen(o=>({...o,history:true})); toast("Report saved"); }}><Icon n="save" size={16}/>Save as {slot} report</button>
    </Section>
    {history.length>0&&<Section open={open} setOpen={setOpen} id="history" icon="newspaper" title="Reports" hint={`${history.length} saved · newest first`}>
      <div className="stack">{history.map(r=><article key={r.id} className="card pad" style={{background:"var(--soft)",boxShadow:"none"}}>
        <div className="row" style={{justifyContent:"space-between"}}><span className="xs" style={{color:"var(--clay)",fontWeight:800,textTransform:"uppercase",letterSpacing:".05em"}}>{r.slot} · {new Date(r.ts).toLocaleString(undefined,{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}</span>
          <span><button className="ib" aria-label="Copy" onClick={()=>copy(r.text)}><Icon n="copy" size={16}/></button><button className="ib" aria-label="Share" onClick={()=>shareNative(r.text)} style={{color:"var(--sage)"}}><Icon n="share" size={16}/></button><button className="ib" aria-label="Delete report" onClick={()=>{ if(confirm("Delete this report?")) delReport(r.id); }}><Icon n="trash" size={16}/></button></span></div>
        <pre className="rep">{r.text}</pre>
        <button className="btn wa block" style={{marginTop:10}} onClick={()=>shareWA(r.text)}><Icon n="message" size={15}/>Send to WhatsApp</button>
      </article>)}</div>
    </Section>}
    <Section open={open} setOpen={setOpen} id="checklist" defOpen icon="checkCircle" title="Daily discussion checklist" hint={`${dailyDone}/${dailyTotal} today · resets each day`}>
      {DAILY.map((c,ci)=><div key={ci} style={{marginBottom:6}}>
        <div className="row" style={{gap:6}}><span>{c.emoji}</span><span className="serif" style={{fontWeight:600}}>{c.title}{ci===0?" — Senthil":""}</span></div>
        {c.items.length===0?<CheckRow checked={!!doneToday[`${ci}:_`]} onClick={()=>toggleDaily(`${ci}:_`)} label="(note for today)" muted/>:c.items.map((it,ii)=><CheckRow key={ii} checked={!!doneToday[`${ci}:${ii}`]} onClick={()=>toggleDaily(`${ci}:${ii}`)} label={it}/>)}
      </div>)}
    </Section>
    <Section open={open} setOpen={setOpen} id="data" icon="calendar" title="Your data for the report" hint="Paste here — the app can't auto-read your accounts">
      {[["calendar","Calendar — today's events","calendar","09:00 Tumour board · 14:00 Clinic · 18:00 School pickup…"],["email","Email — items to triage","mail","Paste subjects / threads needing replies, approvals, finance alerts…"],["whatsapp","WhatsApp — key messages","message","Paste important messages to extract tasks from…"],["extra","Standing extra focus (asked each time)","help","e.g. Track SBI & Reliance; watch CAR-T approvals"]].map(([k,l,ic,ph])=>
        <div key={k} style={{marginBottom:10}}><label className="lbl" htmlFor={"rf-"+k}><Icon n={ic} size={12}/> {l}</label><textarea id={"rf-"+k} className="inp" rows={3} value={inputs[k]||""} onChange={e=>persistInputs({...inputs,[k]:e.target.value})} placeholder={ph}/></div>)}
    </Section>
    <Section open={open} setOpen={setOpen} id="sched" icon="clock" title="Two-hourly schedule (6am–midnight)" hint="How automatic delivery works">
      <p className="muted small" style={{lineHeight:1.6}}>Your cadence: {SLOTS.join(", ")}. Tap a slot, generate (or use ChatGPT/Claude), then share to WhatsApp.</p>
      <p className="muted small" style={{lineHeight:1.6}}>Fully hands-off delivery (a report that builds and pings WhatsApp while the app is closed) needs a scheduler on a server — not possible in a static offline app.</p>
    </Section>
  </div>;
}
