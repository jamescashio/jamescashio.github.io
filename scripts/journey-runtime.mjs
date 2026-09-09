import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// Optional local lab instrumentation; never included in the production bundle.
// Supply an installed web-vitals IIFE with JOURNEY_WEB_VITALS_PATH.
export async function measureJourney({ navigate, evaluate, click, pressKey, waitFor, send, report }) {
  assert.ok(process.env.JOURNEY_WEB_VITALS_PATH, "Set JOURNEY_WEB_VITALS_PATH to web-vitals.iife.js");
  const library = await readFile(process.env.JOURNEY_WEB_VITALS_PATH, "utf8");
  await send("Page.addScriptToEvaluateOnNewDocument", {
    source:
      library +
      `
      window.journeyLab = {vitals:{}};
      const record = m => window.journeyLab.vitals[m.name] = {value:m.value,rating:m.rating};
      webVitals.onLCP(record,{reportAllChanges:true});
      webVitals.onCLS(record,{reportAllChanges:true});
      webVitals.onINP(record,{reportAllChanges:true,durationThreshold:16});
    `,
  });
  report.measurements = [];
  for (const width of [1440, 390]) {
    await navigate("/?runtime=journey-measure", width, width === 1440 ? 1000 : 844);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await click(".mc-trigger");
    await pressKey("Escape", 27);
    await click(".continuum-first-flight");
    await waitFor("!!document.querySelector('.ff-stage-ready')", "active WebGL flight");
    // The browser's callback cadence is a proxy for scene smoothness, not proof of
    // display scanout or phone GPU performance. Sample after the renderer warms.
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const frames = await evaluate(`new Promise(resolve => {
      const intervals=[], renderIntervals=[]; let previous; let start; let previousRender;
      const canvas=document.querySelector('.ff-stage canvas');
      const initialFrameCount=Number(canvas.dataset.shipFrameCount);
      let lastFrameCount=initialFrameCount;
      function frame(now) {
        if (previous !== undefined) intervals.push(now-previous);
        previous=now; start ??= now;
        const count=Number(canvas.dataset.shipFrameCount);
        if (count>lastFrameCount) {
          if (previousRender !== undefined) renderIntervals.push(now-previousRender);
          previousRender=now; lastFrameCount=count;
        }
        if (now-start < 5000) {requestAnimationFrame(frame); return;}
        const sorted=[...intervals].sort((a,b)=>a-b);
        renderIntervals.sort((a,b)=>a-b);
        resolve({samples:intervals.length,meanMs:intervals.reduce((a,b)=>a+b,0)/intervals.length,
          p95Ms:sorted[Math.floor(sorted.length*.95)],maxMs:sorted.at(-1),
          over33ms:intervals.filter(n=>n>33.4).length,
          submittedFrames:lastFrameCount-initialFrameCount,
          submittedFps:(lastFrameCount-initialFrameCount)*1000/(now-start),
          renderP95Ms:renderIntervals[Math.floor(renderIntervals.length*.95)],
          drawCalls:Number(canvas.dataset.shipDrawCalls),triangles:Number(canvas.dataset.shipTriangles),
          canvasWidth:canvas.width,canvasHeight:canvas.height});
      }
      requestAnimationFrame(frame);
    })`);
    const vitals = await evaluate("window.journeyLab.vitals");
    report.measurements.push({ width, vitals, frames });
  }
  report.measurementMethod =
    "Local unthrottled Chrome; menu open, keyboard close, then 3D flight. web-vitals lab samples and 5-second requestAnimationFrame intervals after warm-up, with the renderer's existing frame submission counter. The renderer intentionally caps at 30 fps. Not field percentiles or physical mobile GPU measurements.";
  report.checks.push({ name: "Local interaction and 3D workload measurements collected", passed: true });
}

const outputDir = process.env.JOURNEY_OUTPUT_DIR;
async function screenshot(send, name, clip) {
  if (!outputDir) return;
  await mkdir(outputDir, { recursive: true });
  await send("Runtime.evaluate", {
    expression:
      "Promise.all([...document.querySelectorAll('.mc-dialog')].flatMap(e=>e.getAnimations()).map(a=>a.finished.catch(()=>null))).then(()=>true)",
    awaitPromise: true,
    returnByValue: true,
  });
  const result = await send("Page.captureScreenshot", {
    format: name.endsWith(".webp") ? "webp" : "png",
    ...(name.endsWith(".webp") ? { quality: 88 } : {}),
    captureBeyondViewport: !!clip,
    ...(clip ? { clip: { ...clip, scale: 1 } } : {}),
  });
  await writeFile(path.join(outputDir, name), Buffer.from(result.data, "base64"));
}

export async function captureWorkshop({ navigate, evaluate, click, waitFor, send, report }) {
  await navigate("/?capture=workshop#build=hermes&intent=draft&private=0&sources=0", 1440, 1200);
  await click('[aria-label="Motion on — pause ambient motion"]');
  await click(".o-run");
  await waitFor("document.querySelector('.o-result h4')?.textContent === 'Workhorse'", "routine request result");
  await evaluate(
    "window.scrollTo({top:document.querySelector('.o-lab').getBoundingClientRect().top+scrollY-120,behavior:'instant'})",
  );
  const clip = await evaluate(
    "(() => { const r=document.querySelector('.o-lab').getBoundingClientRect(); return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height}; })()",
  );
  await screenshot(send, "hermes-public-interface.webp", clip);
  if (outputDir)
    await writeFile(
      path.join(outputDir, "provenance.json"),
      JSON.stringify(
        {
          source: "https://github.com/jamescashio/jamescashio.github.io/tree/1f35f59363040a13fae309eb44116a2e8d94429a",
          capturedAtUtc: new Date().toISOString(),
          subject: "Actual rendered V37.13 public HERMES browser demonstration",
          settings: { intent: "draft", privateData: false, sources: false },
          result: "Workhorse",
          boundary:
            "This is a capture of shipped public software, not the private Atlas service or live routing telemetry.",
          image: { file: "hermes-public-interface.webp", ...clip },
          transform: "Native browser element screenshot encoded as WebP, quality 88. No visual content edited.",
        },
        null,
        2,
      ) + "\n",
    );
  report.checks.push({
    name: "Authentic released HERMES interface capture with explicit model settings",
    passed: true,
  });
}

export async function checkJourney({ navigate, evaluate, click, pressKey, waitFor, send, report }) {
  const audit = async (state) => {
    if (!process.env.JOURNEY_AXE_PATH) return;
    const scan =
      await evaluate(`axe.run(document, {runOnly:{type:'tag', values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}}).then(r => ({
      violations:r.violations.map(v=>({id:v.id,impact:v.impact,help:v.help,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),
      passedRules:r.passes.length,manualReviewRules:r.incomplete.map(v=>v.id)
    }))`);
    (report.accessibility ??= []).push({ state, ...scan });
  };
  if (process.env.JOURNEY_AXE_PATH) {
    await send("Page.addScriptToEvaluateOnNewDocument", {
      source: await readFile(process.env.JOURNEY_AXE_PATH, "utf8"),
    });
  }
  await send("Emulation.setEmulatedMedia", { features: [] });
  for (const width of [320, 390]) {
    await navigate("/?runtime=journey-menu", width, 740);
    await click(".mc-trigger");
    await waitFor(
      "document.querySelector('.mc-dialog')?.open && document.activeElement?.matches('.mc-search-wrap input')",
      "search focus",
    );
    const closeVisible =
      "(() => {const e=document.querySelector('.mc-close'),r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})()";
    assert.equal(await evaluate(closeVisible), true, "Close must remain visible after autofocus");
    await evaluate("document.querySelector('.mc-dialog').scrollTop = 10000");
    assert.equal(await evaluate(closeVisible), true, "Close must stay available after panel scrolling");
    await screenshot(send, "mission-control-" + width + ".png");
    await audit("Mission Control " + width);
    await pressKey("Escape", 27);
    await waitFor("document.activeElement?.matches('.mc-trigger')", "menu focus restoration");
  }
  report.checks.push({
    name: "320/390px Mission Control keeps Close visible after autofocus and scrolling",
    passed: true,
  });

  await navigate("/?runtime=journey-flight", 1440, 1000);
  await click('[aria-label="Motion on — pause ambient motion"]');
  await click(".continuum-first-flight");
  await waitFor("!!document.querySelector('.ff-stage-ready,.ff-stage-fallback')", "manual flight");
  await click(".ff-boundary-toggle");
  await click(".ff-chapters button:nth-child(4)");
  await click(".ff-playback button:last-child");
  await waitFor("!!document.querySelector('.ff-recap')", "decision recap");
  assert.match(await evaluate("document.querySelector('.ff-recap').textContent"), /YOUR LAST DECISION/);
  assert.deepEqual(
    await evaluate("[...document.querySelectorAll('.ff-recap-state:last-child dd')].map(e=>+e.textContent)"),
    [12, 0, 0],
  );
  assert.deepEqual(
    await evaluate("[...document.querySelectorAll('.ff-telemetry strong')].map(e=>+e.textContent)"),
    [12, 0, 0],
  );
  await screenshot(send, "first-flight-recap-desktop.png");
  await audit("Completed flight desktop");
  await click(".ff-next-primary");
  await waitFor(
    "!document.querySelector('.first-flight') && document.querySelector('.o-toggle input')?.checked",
    "private request handoff",
  );
  assert.equal(await evaluate("document.querySelector('.o-segment [aria-pressed=true]').textContent"), "Analyze");
  assert.equal(await evaluate("document.querySelectorAll('.o-toggle input')[1].checked"), true);
  assert.equal(await evaluate("document.querySelector('.o-result h4').textContent"), "Your intent. A reasoned route.");
  await click(".o-run");
  assert.equal(await evaluate("document.querySelector('.o-result h4').textContent"), "Human review");
  assert.equal(await evaluate("document.querySelector('.o-lab .o-human-review').dataset.motion"), "off");
  assert.equal(
    await evaluate("getComputedStyle(document.querySelector('.o-human-review-core'),'::after').animationName"),
    "none",
  );
  report.checks.push({
    name: "Decision recap, ship totals, and explicit private-request handoff agree; Bit respects paused motion",
    passed: true,
  });

  await navigate("/?runtime=journey-permission", 390, 844);
  await click('[aria-label="Motion on — pause ambient motion"]');
  await click(".continuum-first-flight");
  await waitFor("!!document.querySelector('.ff-stage-ready,.ff-stage-fallback')", "phone flight");
  await click(".ff-chapters button:nth-child(4)");
  await click(".ff-mobile-command button");
  await click(".ff-playback button:last-child");
  await waitFor("!!document.querySelector('.ff-recap')", "permission recap");
  assert.deepEqual(
    await evaluate("[...document.querySelectorAll('.ff-recap-state:first-child dd')].map(e=>+e.textContent)"),
    [0, 0, 12],
  );
  assert.deepEqual(
    await evaluate("[...document.querySelectorAll('.ff-recap-state:last-child dd')].map(e=>+e.textContent)"),
    [0, 12, 0],
  );
  assert.match(await evaluate("document.querySelector('.ff-recap').textContent"), /Permission off.*Permission on/);
  assert.equal(
    await evaluate("document.querySelector('.ff-mobile-command button').textContent"),
    "Test a private request →",
  );
  await evaluate("document.querySelector('.ff-story').scrollIntoView({block:'start',behavior:'instant'})");
  await screenshot(send, "first-flight-recap-phone.png");
  await audit("Completed flight phone");
  await click(".ff-mobile-command button");
  await waitFor(
    "!document.querySelector('.first-flight') && document.querySelector('.o-toggle input')?.checked",
    "phone handoff",
  );
  report.checks.push({
    name: "Phone recap compares permission consistently and retains the primary action",
    passed: true,
  });

  await navigate("/?runtime=journey-bit", 1440, 1000);
  await click(".o-story-comparison a:nth-child(2)");
  await click(".o-run");
  await waitFor("!!document.querySelector('.o-lab .o-human-review')", "human review signal");
  const pulse = await evaluate(
    "(() => {const e=document.querySelector('.o-human-review-core');const s=getComputedStyle(e,'::after');return {name:s.animationName,iterations:s.animationIterationCount,duration:s.animationDuration};})()",
  );
  assert.deepEqual(pulse, { name: "human-review-arrival", iterations: "1", duration: "0.9s" });
  await waitFor(
    "document.querySelector('.o-human-review-core').getAnimations({subtree:true}).every(a=>a.playState==='finished')",
    "finite gold response",
  );
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await navigate("/?runtime=journey-reduced#build=hermes&intent=analyze&private=1&sources=1", 320, 844);
  await waitFor(
    "document.querySelector('.o-segment [aria-pressed=true]')?.textContent === 'Analyze' && document.querySelectorAll('.o-toggle input')[0]?.checked && document.querySelectorAll('.o-toggle input')[1]?.checked && document.querySelector('[aria-label=\"Motion off — follows your system preference\"]')?.disabled",
    "hydrated deep-link inputs and system motion preference",
  );
  await click(".o-run");
  await waitFor("!!document.querySelector('.o-human-review')", "reduced-motion human signal");
  assert.equal(
    await evaluate("getComputedStyle(document.querySelector('.o-human-review-core'),'::after').animationName"),
    "none",
  );
  await send("Emulation.setEmulatedMedia", { features: [] });
  await audit("Private request with system reduced motion");
  report.checks.push({
    name: "Bit response finishes once and remains still under system reduced motion",
    passed: true,
  });

  await navigate("/?runtime=journey-story#smart-routing", 1440, 1000);
  await waitFor("document.querySelector('.o-workshop-capture img')?.naturalWidth > 0", "real interface capture");
  await evaluate("document.querySelector('.o-workshop-capture').scrollIntoView({block:'center',behavior:'instant'})");
  await screenshot(send, "workshop-story-desktop.png");
  await audit("Workshop and full page");
  if (report.accessibility) {
    assert.deepEqual(
      report.accessibility.flatMap((scan) => scan.violations),
      [],
      "No automated WCAG violations in the journey",
    );
  }
  assert.match(await evaluate("document.querySelector('.o-workshop-capture').textContent"), /public demonstration/i);
  assert.match(await evaluate("document.querySelector('.o-proof-date').textContent"), /July 2026/);
  report.checks.push({
    name: "Real shipped interface image loads beside unchanged historical cost evidence",
    passed: true,
  });
}

export async function checkFlightEnding({ navigate, evaluate, click, pressKey, waitFor, send, report }) {
  for (const [width, height] of [
    [1280, 712],
    [1024, 768],
  ]) {
    await navigate("/?runtime=hero-spacing", width, height);
    if (width === 1280) {
      assert.ok(
        await evaluate(
          'document.querySelector(".continuum-first-flight").getBoundingClientRect().bottom <= innerHeight',
        ),
        "Laptop flight invitation fits the opening viewport",
      );
    }
    const clearance = () =>
      evaluate(`(() => {
      const content=document.querySelector('.o-hero-content').getBoundingClientRect();
      const footer=document.querySelector('.o-hero-bottom').getBoundingClientRect();
      const hero=document.querySelector('.o-hero').getBoundingClientRect();
      return {gap:footer.top-content.bottom,contained:hero.bottom>=footer.bottom};
    })()`);
    for (const expanded of [false, true]) {
      if (expanded) await click(".perspective-discover summary");
      const rects = await clearance();
      assert.ok(
        rects.gap >= 24 && rects.contained,
        `${width}px hero content and credits remain separate (${rects.gap}px gap)`,
      );
    }
    if (width === 1280) await screenshot(send, "hero-expanded-laptop.png");
    report.checks.push({
      name: `${width}×${height}: hero credits clear the closed and expanded experience menu`,
      passed: true,
    });
  }
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  for (const [width, height] of [
    [1440, 1000],
    [390, 844],
    [320, 568],
    [640, 360],
  ]) {
    await navigate("/?runtime=flight-ending", width, height);
    await waitFor(
      "!!document.querySelector('[aria-label=\"Motion off — follows your system preference\"]')?.disabled",
      "system motion setting",
    );
    await click(".continuum-first-flight");
    await waitFor('!!document.querySelector(".ff-stage-ready,.ff-stage-fallback")', "ready flight");
    await click(".ff-chapters button:nth-child(4)");
    await click(".ff-playback button:last-child");
    await waitFor('document.activeElement?.id === "ff-scene-title"', "completion heading focus");
    const ending = await evaluate(`({
      playback:[...document.querySelectorAll('.ff-playback button')].map(e=>({text:e.textContent,disabled:e.disabled})),
      chaptersHidden:!document.querySelector('.ff-chapters').getClientRects().length,
      announcement:document.querySelector('.first-flight > [role="status"]').textContent,
      entireStoryLive:document.querySelector('.ff-story').hasAttribute('aria-live'),
      copyLabel:document.querySelector('.ff-share').getAttribute('aria-label'),
      overflow:document.querySelector('.first-flight').scrollWidth-document.querySelector('.first-flight').clientWidth
    })`);
    assert.deepEqual(ending.playback, [{ text: "Replay flight", disabled: false }]);
    assert.equal(ending.chaptersHidden, true);
    assert.equal(ending.entireStoryLive, false);
    assert.match(ending.announcement, /Flight complete.*12 onboard, 0 in cloud, 0 held/s);
    assert.equal(ending.copyLabel, "Copy this scenario");
    assert.ok(ending.overflow <= 1, "No horizontal dialog overflow");
    if (width === 320) await screenshot(send, "first-flight-recap-320.png");
    await click(".ff-playback button");
    assert.equal(await evaluate('!!document.querySelector(".ff-recap")'), false);
    assert.equal(
      await evaluate('document.querySelector(".ff-chapters [aria-current]").textContent.includes("Board")'),
      true,
    );
    assert.equal(await evaluate('document.activeElement?.matches(".ff-close")'), true);
    assert.equal(await evaluate('document.querySelector(".ff-body").scrollTop'), 0);
    assert.equal(await evaluate('document.querySelector(".first-flight").dataset.motion'), "off");
    await pressKey("Escape", 27);
    await waitFor('document.activeElement?.matches(".continuum-first-flight")', "flight trigger focus restoration");
    report.checks.push({
      name: `${width}×${height}: completed controls, keyboard focus, reduced-motion replay and restored start`,
      passed: true,
    });
  }
  await send("Emulation.setEmulatedMedia", { features: [] });
}
