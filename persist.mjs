import {chromium} from 'playwright';
const URL=process.argv[2]; const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto(URL+'#areas'); await p.waitForTimeout(2500); await p.reload(); await p.waitForTimeout(1500);
const adds=p.locator('input[placeholder^="Add an item"]'); const n=await adds.count();
for(const i of [0,1,4]){ if(i>=n)break; await adds.nth(i).fill('PT-'+i); await adds.nth(i).press('Enter'); await p.waitForTimeout(150);}
await p.goto(URL+'#diary'); await p.waitForTimeout(600);
await p.fill('textarea[aria-label="Diary entry"]','PT diary line'); await p.waitForTimeout(100);  // reload quickly, before the debounce fires
await p.reload(); await p.waitForTimeout(800);
await p.goto(URL+'#report'); await p.waitForTimeout(600);
await p.getByText('Your data for the report').click(); await p.waitForTimeout(200); await p.locator('textarea[id^="rf-"]').first().fill('PT report field'); await p.waitForTimeout(100);
const check=async(lbl)=>{ const s=await p.evaluate(()=>({a:localStorage.getItem('lh2:areas')||'',d:localStorage.getItem('lh:diary')||'',r:localStorage.getItem('lh:report:inputs')||''}));
 console.log(lbl,{areas:['PT-0','PT-1','PT-4'].map(x=>s.a.includes(x)),diary:s.d.includes('PT diary'),report:s.r.includes('PT report')}); };
await p.reload(); await p.waitForTimeout(1500); await check('reload');
const c=await ctx.newCDPSession(p); await c.send('Network.setCacheDisabled',{cacheDisabled:true}); await p.reload(); await p.waitForTimeout(1500); await check('hard');
await p.close(); const p2=await ctx.newPage(); await p2.goto(URL); await p2.waitForTimeout(1500);
console.log('reopen areas', (await p2.evaluate(()=>localStorage.getItem('lh2:areas')||'')).includes('PT-4'), 'errs',errs); await b.close();
