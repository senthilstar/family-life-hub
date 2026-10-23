import { chromium } from 'playwright';
const U='http://localhost:8765/family-life-hub/';
const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const p=await ctx.newPage(); const errs=[];
p.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); }); p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
// legacy data in old format to test migration on first run
await p.goto(U); await p.evaluate(()=>{ localStorage.clear(); localStorage.setItem('lh:categories',JSON.stringify([{title:"Office — Senthil",emoji:"🗂️",items:[{id:"a",text:"IT",done:true},{id:"b",text:"Old custom task",done:false}]},{title:"My Custom",emoji:"⭐",items:[{id:"c",text:"keep me",done:false}]}])); localStorage.setItem('lh:diary',JSON.stringify({"2026-10-20":"Old diary entry"})); });
await p.reload(); await p.waitForTimeout(800);
const S=n=>p.screenshot({path:`/workspace/webapp/shots/${n}.png`,fullPage:false});
// check-ins
for (const t of ['Office','Sashti','Parents']) await p.locator('.ci',{hasText:t}).first().click().then(()=>p.getByRole('button',{name:/^Check in$/}).click());
await p.locator('nav.tabs button',{hasText:'Areas'}).click(); await p.waitForTimeout(300);
const txt=await p.textContent('main'); console.log('migrated custom:',txt.includes('My Custom'),txt.includes('Old custom task'),'labels:',txt.includes('Office — Senthil (1)'),txt.includes('Office (17)'));
// set due date on LIC
await p.getByRole('button',{name:'Edit LIC premium'}).click(); await p.fill('#it-d','2026-10-25'); await p.fill('#it-a','24500'); await p.fill('#it-n','Policy 7xxxx'); await p.getByRole('button',{name:'Save',exact:true}).click();
await p.getByRole('button',{name:'Edit TDS'}).click(); const y=new Date(Date.now()-86400000); await p.fill('#it-d',y.toISOString().slice(0,10)); await p.getByRole('button',{name:'In progress'}).click(); await p.getByRole('button',{name:'Save',exact:true}).click();
// BP logs
const parents=p.locator('section.area',{hasText:'Parents'});
for (const [s,d] of [['142','90'],['138','86'],['131','84']]) { await parents.getByLabel('Sys').fill(s); await parents.getByLabel('Dia').fill(d); await parents.getByRole('button',{name:'Log'}).click(); }
await p.evaluate(()=>window.scrollTo(0,0)); await p.waitForTimeout(200); await S('02-areas'); await parents.scrollIntoViewIfNeeded(); await S('03-areas-parents-bp');
await p.locator('section.area',{hasText:'Bills'}).scrollIntoViewIfNeeded(); await S('04-areas-bills');
await p.locator('nav.tabs button',{hasText:'Today'}).click(); await p.waitForTimeout(300); await S('01-today'); await p.screenshot({path:'/workspace/webapp/shots/01b-today-full.png',fullPage:true});
await p.locator('nav.tabs button',{hasText:'Report'}).click(); await p.getByRole('button',{name:/Generate .* report/}).click(); await p.waitForTimeout(300); await S('05-report');
await p.locator('nav.tabs button',{hasText:'Diary'}).click(); await p.fill('textarea[aria-label="Diary entry"]','Clinic was busy. Took kids cycling.'); await p.waitForTimeout(1200); await S('06-diary');
await p.locator('nav.tabs button',{hasText:'Mind'}).click(); await p.fill('textarea[aria-label="New thought"]','Book resort weekend for Sashti birthday'); await p.getByRole('button',{name:'Add',exact:true}).click(); await p.waitForTimeout(300); await S('07-mind');
await p.getByRole('button',{name:'Settings and backup'}).click(); await p.getByRole('button',{name:'Dark'}).click(); await p.waitForTimeout(200); await S('08-settings-dark');
await p.getByRole('button',{name:'Close'}).click(); await p.locator('nav.tabs button',{hasText:'Today'}).click(); await p.waitForTimeout(300); await S('09-today-dark');
// export
const [dl]=await Promise.all([p.waitForEvent('download'), (async()=>{ await p.getByRole('button',{name:'Settings and backup'}).click(); await p.getByRole('button',{name:/Export backup/}).click(); })()]);
await dl.saveAs('/workspace/webapp/test-backup.json'); console.log('export ok');
// reload persistence + offline
await p.waitForTimeout(1000); await p.reload(); await p.waitForTimeout(1500);
await ctx.setOffline(true); await p.reload(); await p.waitForTimeout(800); const off=await p.textContent('h1'); console.log('offline h1:',off, 'ci persisted:', await p.locator('.ci[aria-pressed=true]').count());
await ctx.setOffline(false);
// import into fresh context
const c2=await b.newContext({viewport:{width:390,height:844}}); const p2=await c2.newPage(); p2.on('pageerror',e=>errs.push('P2 '+e.message)); await p2.goto(U); await p2.waitForTimeout(500);
p2.on('dialog',d=>d.accept()); await p2.getByRole('button',{name:'Settings and backup'}).click(); await p2.locator('input[type=file]').setInputFiles('/workspace/webapp/test-backup.json'); await p2.waitForTimeout(800);
await p2.locator('nav.tabs button',{hasText:'Diary'}).click(); console.log('import diary:', (await p2.textContent('main')).includes('Took kids cycling'));
console.log('ERRORS:',JSON.stringify(errs)); await b.close();
