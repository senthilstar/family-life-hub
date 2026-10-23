export const ACCENTS = ["#bd5a37","#5d7355","#3f7a78","#bb872b","#7a4d6b","#c2783c","#4f7a4a","#8a5a2b","#9d4527","#577e7c"];
export const uid = () => Math.random().toString(36).slice(2,10) + Date.now().toString(36).slice(-4);
// LOCAL date (original used toISOString => UTC date, so in IST before 05:30 it showed yesterday)
export const dstr = (d=new Date()) => { const z=n=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}`; };
export const todayStr = () => dstr();
export const parseD = s => new Date(s+"T00:00:00");
export const prettyDate = s => parseD(s).toLocaleDateString(undefined,{weekday:"long",year:"numeric",month:"long",day:"numeric"});
export const shortDate = s => parseD(s).toLocaleDateString(undefined,{day:"numeric",month:"short"});
export const daysUntil = s => Math.round((parseD(s)-parseD(todayStr()))/86400000);
export const addMonths = (s,m) => { const d=parseD(s); const day=d.getDate(); d.setDate(1); d.setMonth(d.getMonth()+m); const last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate(); d.setDate(Math.min(day,last)); return dstr(d); };
export const REPEATS = { none:["One-off",0], monthly:["Monthly",1], quarterly:["Quarterly",3], half:["Half-yearly",6], yearly:["Yearly",12] };
export const STATUS = { todo:"To do", doing:"In progress", waiting:"Waiting", done:"Done" };
export const dueLabel = s => { const n=daysUntil(s); return n===0?"Today":n===1?"Tomorrow":n===-1?"Yesterday":n<0?`${-n}d overdue`:n<7?`in ${n}d`:shortDate(s); };

export const METRICS = {
  bp:{ label:"BP", unit:"mmHg", dual:["Sys","Dia"], people:["Amma","Appa"] },
  sugar:{ label:"Sugar", unit:"mg/dL", kinds:["Fasting","Post-meal","Random"], people:["Amma","Appa"] },
  weight:{ label:"Weight", unit:"kg", people:["Umaa"] },
};

/* Senthil's 18 life areas. #1 Office and #17 Office are merged into one area with two visible labels. */
export const AREAS_SEED = [
  { key:"office", nums:[1,17], title:"Office", emoji:"🗂️", groups:["🗂️ Office — Senthil (1)","🏢 Office (17)"],
    items:[["293",0],["TDS",0],["LPC",0],["Leave particulars",0],["Article",0],["IT",0],["Pay drawn",0],["Xerox",1],["EC",1],["Immuno-oncology",1]] },
  { key:"sashti", nums:[2], title:"Sashti", emoji:"👧", sub:"Class 4", items:["Dance","Tooth","Aadhaar update","Project","Global Art"] },
  { key:"aathiran", nums:[3], title:"Aathiran", emoji:"👦", sub:"Class 1", items:["School","Community certificate","Aadhaar","Potty training"] },
  { key:"umaa", nums:[4], title:"Umaa", emoji:"💁‍♀️", metrics:["weight"], items:["Weight","IT","Diabetology","Car documents","Voter ID","Ration card","UDID"] },
  { key:"parents", nums:[5], title:"Parents", emoji:"👴👵", metrics:["bp","sugar"], items:["BP","Sugars","Dental","Colonoscopy"] },
  { key:"medical", nums:[6], title:"Medical", emoji:"💊", items:["Amma — cataract"] },
  { key:"bills", nums:[7], title:"Bills", emoji:"💡", bills:true, items:[{text:"EB",repeat:"monthly"},{text:"LIC premium",repeat:"yearly"}] },
  { key:"pending", nums:[8], title:"Pending Tasks", emoji:"📌", items:["Laptop"] },
  { key:"academic", nums:[9], title:"Academic", emoji:"📖", items:["Article"] },
  { key:"play", nums:[10], title:"Play", emoji:"🏐", items:["Maadi","Cycle","New park"] },
  { key:"grocery", nums:[11], title:"Grocery", emoji:"🛒", items:["Fruits"] },
  { key:"clothes", nums:[12], title:"Clothes", emoji:"👚", items:["Stitched clothes"] },
  { key:"clean", nums:[13], title:"Cleanliness", emoji:"🧹", items:["Bed","Bedroom drawers"] },
  { key:"health", nums:[14], title:"Health", emoji:"🍎", items:["Fruits","Walking","Cycling","Sleep early","Sports shoes","Morning milk & coffee"] },
  { key:"exercise", nums:[15], title:"Exercise", emoji:"🏃‍♂️", items:["Walking","Everyday with kids"] },
  { key:"leisure", nums:[16], title:"Leisure", emoji:"📺", items:["Movie","PPT shows for kids","Monthly novels","Plan a vacation","Special birthday parties for kids","Resort weekend stay"] },
  { key:"fin", nums:[18], title:"Financials", emoji:"💵", items:["No salary","Stock"] },
];

/* original static daily discussion checklist (Report tab), kept verbatim so old lh:daily:log ticks line up */
export const DAILY = [
  { emoji:"🗂️", title:"Office", items:["293","TDS","LPC","Leave particulars","Article"] },
  { emoji:"👧", title:"Sashti", items:["Dance","Tooth"] },
  { emoji:"👦", title:"Aathiran", items:["School","Community certificate"] },
  { emoji:"💁‍♀️", title:"Umaa", items:["WT"] },
  { emoji:"👴👵", title:"Parents", items:["BP","Sugars"] },
  { emoji:"💊", title:"Medical", items:["Amma — cataract"] },
  { emoji:"💡", title:"Bills", items:[] },
  { emoji:"📌", title:"Pending Tasks", items:[] },
  { emoji:"📖", title:"Academic", items:["Article"] },
  { emoji:"🏐", title:"Play", items:["Maadi","Cycle"] },
  { emoji:"🛒", title:"Grocery", items:[] },
  { emoji:"👚", title:"Clothes", items:[] },
  { emoji:"🧹", title:"Cleanliness", items:["Bed"] },
  { emoji:"🍎", title:"Health", items:["Fruits"] },
  { emoji:"🏃‍♂️", title:"Exercise", items:["Walking"] },
  { emoji:"📺", title:"Leisure", items:[] },
  { emoji:"🏢", title:"Office", items:[] },
  { emoji:"💵", title:"Financials", items:[] },
];

export const mkItem = (o) => ({ id:uid(), text:"", done:false, status:"todo", due:"", notes:"", group:0, amount:"", repeat:"none", paid:[], createdAt:Date.now(), ...o });

export function seedAreas(){
  return AREAS_SEED.map((a,i)=>({
    id:uid(), key:a.key, nums:a.nums, title:a.title, emoji:a.emoji, sub:a.sub||"", groups:a.groups||null,
    metrics:a.metrics||[], bills:!!a.bills, accent:ACCENTS[i%ACCENTS.length], collapsed:false,
    items:a.items.map(it=> Array.isArray(it)? mkItem({text:it[0],group:it[1]}) : typeof it==="string"? mkItem({text:it}) : mkItem(it)),
  }));
}

const norm = s => (s||"").toLowerCase().replace(/[^a-z0-9]/g,"");
const TITLE_MAP = { officesenthil:["office",0], office:["office",1], sashti:["sashti"], aathiran:["aathiran"], umaa:["umaa"], parents:["parents"], medical:["medical"], bills:["bills"], pendingtasks:["pending"], academic:["academic"], play:["play"], grocery:["grocery"], clothes:["clothes"], cleanliness:["clean"], health:["health"], exercise:["exercise"], leisure:["leisure"], financials:["fin"] };
/* migrate the original app's lh:categories lists into the 18 areas, keeping every item and its done state */
export function migrateOld(oldCats, base){
  const areas = base ? JSON.parse(JSON.stringify(base)) : seedAreas();
  for(const c of oldCats||[]){
    const m = TITLE_MAP[norm(c.title)];
    let area = m && areas.find(a=>a.key===m[0]);
    if(!area){ area={ id:uid(), key:"custom-"+uid(), nums:[], title:c.title, emoji:c.emoji||"🗒️", sub:"", groups:null, metrics:[], bills:false, accent:c.accent||ACCENTS[areas.length%ACCENTS.length], collapsed:!!c.collapsed, items:[] }; areas.push(area); }
    for(const it of c.items||[]){
      const g = m && m[1]!=null ? m[1] : 0;
      const ex = area.items.find(x=>norm(x.text)===norm(it.text) && (!area.groups || x.group===g));
      if(ex){ ex.done=!!it.done; if(it.done) ex.status="done"; }
      else area.items.push(mkItem({ text:it.text, done:!!it.done, status:it.done?"done":"todo", group:g }));
    }
  }
  return areas;
}
