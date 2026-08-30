import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
const EXE='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL='http://127.0.0.1:8099/';
const b=await chromium.launch({executablePath:EXE,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const sizes=[
 {n:'desktop',w:1440,h:900,dpr:1},
 {n:'laptop',w:1024,h:640,dpr:1},
 {n:'tablet',w:834,h:1112,dpr:2,mobile:false},
 {n:'phone',w:390,h:844,dpr:3,mobile:true},
 {n:'phone-sm',w:320,h:568,dpr:2,mobile:true},
];
for (const s of sizes){
  const ctx=await b.newContext({viewport:{width:s.w,height:s.h},deviceScaleFactor:s.dpr,isMobile:!!s.mobile,hasTouch:!!s.mobile,
    userAgent:s.mobile?'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1':undefined});
  const p=await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message.slice(0,140))); p.on('console',m=>{if(m.type()==='error')errs.push('c:'+m.text().slice(0,140));});
  await p.goto(URL,{waitUntil:'load'}); await p.waitForTimeout(4500);
  const m=await p.evaluate(()=>{
    const d=document.documentElement;
    const els=[...document.querySelectorAll('a[href],button,[role="button"],input,select')];
    const small=[];
    for(const e of els){ const r=e.getBoundingClientRect(); if(r.width===0||r.height===0) continue;
      const st=getComputedStyle(e,'::after'); const grown=st && parseFloat(st.minHeight)>=44;
      if((r.width<44||r.height<44) && !grown) small.push({t:(e.textContent||'').trim().slice(0,24),w:Math.round(r.width),h:Math.round(r.height)}); }
    // collision sweep: any two visible text boxes that overlap materially
    const boxes=[...document.querySelectorAll('body *')].filter(e=>{
      const st=getComputedStyle(e); const r=e.getBoundingClientRect();
      return r.width>50&&r.height>12&&st.visibility!=='hidden'&&+st.opacity>0.15&&st.display!=='none'
        && e.children.length===0 && (e.textContent||'').trim().length>4 && r.top>-20 && r.bottom<innerHeight+20;
    }).map(e=>({t:(e.textContent||'').trim().slice(0,30),r:e.getBoundingClientRect()}));
    const hits=[];
    for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
      const a=boxes[i].r,c=boxes[j].r;
      const ox=Math.min(a.right,c.right)-Math.max(a.left,c.left), oy=Math.min(a.bottom,c.bottom)-Math.max(a.top,c.top);
      if(ox>30&&oy>10) hits.push(boxes[i].t+' || '+boxes[j].t);
    }
    return { ovf:d.scrollWidth>d.clientWidth+1, sw:d.scrollWidth, cw:d.clientWidth,
      small:small.length, smallSample:small.slice(0,6), collisions:[...new Set(hits)].slice(0,5),
      links:[...document.querySelectorAll('a[href^="http"]')].map(a=>a.hostname),
      lede:document.querySelector('.za-snapshot-lede')?.textContent?.slice(0,60) };
  });
  let axe='n/a';
  try{ const r=await new AxeBuilder({page:p}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();
    axe=r.violations.map(v=>`${v.impact}:${v.id}x${v.nodes.length}`).join(', ')||'0 violations'; }catch(e){axe='axe fail '+e.message.slice(0,50);}
  console.log(`${s.n.padEnd(9)} ovf=${m.ovf} ${m.sw}/${m.cw} | small=${m.small} | collisions=${m.collisions.length} ${JSON.stringify(m.collisions)} | errs=${errs.length} | AXE ${axe}`);
  if(m.small) console.log('           small:', JSON.stringify(m.smallSample));
  await p.screenshot({path:`/root/audit/v35-${s.n}.png`});
  await ctx.close();
}
await b.close();
