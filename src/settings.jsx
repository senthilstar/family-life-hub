import { useRef, useState } from "react";
import Icon from "./icons.jsx";
import { Sheet } from "./ui.jsx";
import { defaultEndpoint } from "./report.jsx";
export const BOOKMARKLET = `javascript:(()=>{const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith('lh:'))o[k]=localStorage.getItem(k)}const t=JSON.stringify(o);navigator.clipboard.writeText(t).then(()=>alert('Life Hub data copied ('+t.length+' chars). Paste it in the new app: Settings → Import → Paste.'),()=>prompt('Copy this:',t))})()`;
export function SettingsSheet({ settings, setSettings, onExport, onImport, onClose, installEvt, onInstall, stats }){
  const fileRef=useRef(null); const [paste,setPaste]=useState(""); const [showPaste,setShowPaste]=useState(false); const [mode,setMode]=useState("replace");
  const readFile=e=>{ const f=e.target.files?.[0]; if(!f) return; f.text().then(t=>onImport(t,mode)); e.target.value=""; };
  return <Sheet title="Settings & backup" onClose={onClose}>
    <div className="col">
      <div><span className="lbl">Theme</span><div className="seg">{[["auto","Auto"],["light","Light"],["dark","Dark"]].map(([k,l])=><button key={k} aria-pressed={(settings.theme||"auto")===k} onClick={()=>setSettings({...settings,theme:k})}>{l}</button>)}</div></div>
      {installEvt&&<button className="btn primary block" onClick={onInstall}><Icon n="download" size={16}/>Install app on this phone</button>}
      <div className="card pad" style={{boxShadow:"none",background:"var(--soft)"}}>
        <strong>Backup</strong>
        <p className="small muted" style={{margin:"4px 0 10px"}}>Data lives only on this device ({stats}). Export a JSON backup regularly (e.g. save it to Drive) — it includes photos & voice notes.</p>
        <button className="btn primary block" onClick={onExport}><Icon n="download" size={16}/>Export backup (.json)</button>
        <div className="seg" style={{margin:"10px 0"}}>{[["replace","Import: replace"],["merge","Import: merge"]].map(([k,l])=><button key={k} aria-pressed={mode===k} onClick={()=>setMode(k)}>{l}</button>)}</div>
        <div className="grid2"><button className="btn ghost" onClick={()=>fileRef.current?.click()}><Icon n="upload" size={16}/>From file</button><button className="btn ghost" onClick={()=>setShowPaste(s=>!s)}><Icon n="copy" size={16}/>Paste</button></div>
        <input ref={fileRef} type="file" accept="application/json,.json,text/plain" hidden onChange={readFile}/>
        {showPaste&&<><textarea className="inp" rows={4} style={{marginTop:8}} value={paste} onChange={e=>setPaste(e.target.value)} placeholder="Paste backup JSON (or data copied from the old app)"/><button className="btn primary block" style={{marginTop:8}} disabled={!paste.trim()} onClick={()=>onImport(paste,mode)}>Import pasted data</button></>}
      </div>
      <details className="card pad" style={{boxShadow:"none"}}><summary style={{fontWeight:700,minHeight:32,cursor:"pointer"}}>Move data from the old Netlify app</summary>
        <p className="small muted" style={{lineHeight:1.55}}>Browsers keep data per website, so the old app's lists, diary and notes don't appear here automatically. To copy them: save the bookmark below, open the old app (elaborate-mooncake-db9113.netlify.app) in the same browser, run the bookmark (on Android Chrome: type its name in the address bar and tap it), then come back here → Import → Paste. Old lists are merged into the 18 areas.</p>
        <textarea readOnly className="inp xs" rows={3} value={BOOKMARKLET} onFocus={e=>e.target.select()}/>
        <button className="btn ghost block" style={{marginTop:8}} onClick={()=>navigator.clipboard?.writeText(BOOKMARKLET)}><Icon n="copy" size={15}/>Copy bookmark code</button>
      </details>
      <div><label className="lbl" htmlFor="s-ep">AI report endpoint (optional)</label>
        <input id="s-ep" className="inp" value={settings.endpoint??defaultEndpoint()} onChange={e=>setSettings({...settings,endpoint:e.target.value})} placeholder="https://your-site.netlify.app/.netlify/functions/report"/>
        <p className="xs faint" style={{lineHeight:1.5}}>Leave empty to use the free “Open in ChatGPT / Claude” flow. If you keep the old Netlify function (with ANTHROPIC_API_KEY), put its full URL here and allow CORS for this site.</p></div>
      <p className="xs faint" style={{textAlign:"center"}}>Family Life Hub · works offline</p>
    </div>
  </Sheet>;
}
