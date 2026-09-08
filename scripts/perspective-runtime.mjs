import assert from "node:assert/strict";

/** Verify the new preview interactions through the existing browser harness. */
export async function checkPerspective({ navigate, evaluate, click, pressKey, waitFor, report, send }) {
  await navigate("/?runtime=perspective", 320, 844);
  assert.equal(await evaluate(`document.querySelector('#hero-experiences').open`), false);
  assert.equal(
    await evaluate(
      `document.querySelector('#boundary-comparison').getBoundingClientRect().top < document.querySelector('#project-panel').getBoundingClientRect().top`,
    ),
    true,
  );
  await click("#hero-experiences > summary");
  await waitFor(`document.querySelector('#hero-experiences').open`, "optional experiences expand");
  await click(".lens-observatory-link");
  await waitFor(
    `document.querySelector('.lens-observatory')?.dataset.ready === 'true'`,
    "optional Observatory launch",
    30000,
  );
  await pressKey("Escape", 27);
  await waitFor(
    `document.activeElement?.matches('.lens-observatory-link') && document.querySelector('#hero-experiences').open`,
    "focus returns inside the expanded disclosure",
  );
  await click("#hero-experiences > summary");
  assert.equal(await evaluate(`document.querySelector('#hero-experiences').open`), false);
  report.checks.push({
    name: "One-decision entry precedes the studies; optional experiences disclose and restore focus",
    passed: true,
  });
  assert.equal(
    await evaluate(`performance.getEntriesByType('resource').some(r=>r.name.includes('secondary-study-styles'))`),
    false,
  );
  assert.equal(
    await evaluate(`performance.getEntriesByType('resource').some(r=>r.name.includes('secondary-studies-'))`),
    false,
  );
  await click("#tab-signal");
  await waitFor(`!!document.querySelector('.o-lab input[type=range]')`, "deferred study appears");
  assert.equal(
    await evaluate(`performance.getEntriesByType('resource').some(r=>r.name.includes('secondary-study-styles'))`),
    true,
  );
  assert.equal(
    await evaluate(`performance.getEntriesByType('resource').some(r=>r.name.includes('secondary-studies-'))`),
    true,
  );
  report.checks.push({ name: "Secondary study code and styling load on selection, not at entry", passed: true });

  await click("#tab-hermes");
  for (const study of ["cascade", "exposure", "briefing", "dashboards", "signal", "graphify"]) {
    await click(".o-study-continue");
    await waitFor(
      `document.querySelector('#tab-${study}').getAttribute('aria-selected') === 'true' && document.activeElement?.matches('.o-project-heading h3')`,
      "next question opens and focuses the named study",
    );
    await waitFor(
      `document.querySelector('.o-project-heading h3').getBoundingClientRect().top >= 90 && document.querySelector('.o-project-heading h3').getBoundingClientRect().bottom < innerHeight`,
      "next study heading is visible below the header",
    );
  }
  await click(".o-study-continue");
  await waitFor(`location.hash === '#universe'`, "last question continues to the system atlas");
  report.checks.push({
    name: "Next-question links connect all seven studies with visible keyboard focus, then continue to the universe",
    passed: true,
  });

  assert.equal(await evaluate(`document.querySelector('.o-boundary-decision > button').disabled`), true);
  for (const choice of [1, 2]) {
    await click(`.o-boundary-choices label:nth-child(${choice})`);
    await click(".o-boundary-decision > button");
    await waitFor(`document.activeElement?.classList.contains('o-boundary-verdict')`, "result receives keyboard focus");
    assert.equal(
      await evaluate(`document.querySelector('.o-boundary-route[data-private=true] strong').textContent`),
      "Human review",
    );
    assert.equal(await evaluate(`getComputedStyle(document.querySelector('.o-boundary-stop')).opacity`), "1");
    await click(".o-boundary-verdict button");
    await waitFor(
      `document.activeElement === document.querySelector('.o-boundary-choices input')`,
      "reset returns keyboard focus",
    );
    assert.equal(await evaluate(`document.querySelector('.o-boundary-decision > button').disabled`), true);
  }
  report.checks.push({
    name: "Both predictions reveal the model result and preserve keyboard focus on reveal/reset",
    passed: true,
  });

  await click(".mc-trigger");
  await waitFor(
    `document.querySelector('.mc-dialog')?.open && document.querySelector('.mc-missions')?.getBoundingClientRect().height > 0`,
    "Mission Control opens",
  );
  assert.equal(
    await evaluate(
      `document.querySelector('.mc-missions').getBoundingClientRect().top < document.querySelector('.mc-directory').getBoundingClientRect().top`,
    ),
    true,
  );
  await click(".mc-search-wrap input");

  // Native character input is sent by the harness only for Enter. Use the native
  // input setter plus its bubbling event for this controlled search field.
  await evaluate(
    `(() => {const input=document.querySelector('.mc-search-wrap input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'hermes');input.dispatchEvent(new Event('input',{bubbles:true}));})()`,
  );
  await waitFor(`document.querySelector('.mc-body')?.dataset.searching === 'true'`, "destination search");
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.mc-missions')).display`), "none");
  await pressKey("Escape", 27);
  report.checks.push({
    name: "Phone navigation prioritizes Start here and makes search results immediately available",
    passed: true,
  });

  await navigate("/?runtime=perspective-world#lensing", 1440, 1000);
  await waitFor(
    `document.querySelector('.lens-observatory')?.dataset.ready === 'true'`,
    "shareable world renderer",
    30000,
  );
  await click(".lens-light-options button:nth-child(2)");
  await click(".lens-orbit-tools button[aria-label='Rotate right']");
  await click(".lens-orbit-tools button[aria-label='Zoom in']");
  await evaluate(
    `Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('Clipboard unavailable')}}})`,
  );
  await click(".lens-share-world");
  await waitFor(
    `document.querySelector('.lens-share-result')?.textContent.includes('Select and copy')`,
    "share copy fallback",
  );
  const link = await evaluate(`document.querySelector('.lens-share-result input').value`);
  assert.match(
    await evaluate(`document.querySelector('.lens-share-result small').textContent`),
    /paused and ready to explore/,
  );
  assert.doesNotMatch(
    await evaluate(`document.querySelector('.lens-share-result small').textContent`),
    /preview|on this computer/i,
  );
  const original = JSON.parse(
    await evaluate(`document.querySelector('.lens-observatory canvas').dataset.lensingCamera`),
  );
  assert.equal(new URL(link).search, "", "preview/testing query flags do not enter shared views");
  assert.ok(new URL(link).hash.includes("camera="));
  await navigate(`/${new URL(link).hash}`, 1440, 1000);
  await waitFor(`document.querySelector('.lens-observatory')?.dataset.ready === 'true'`, "shared view arrival", 30000);
  const restored = JSON.parse(
    await evaluate(`document.querySelector('.lens-observatory canvas').dataset.lensingCamera`),
  );
  for (const key of Object.keys(original))
    assert.ok(Math.abs(original[key] - restored[key]) < 0.00001, `shared ${key} is restored`);
  assert.equal(await evaluate(`document.querySelector('.lens-observatory').dataset.motion`), "off");
  assert.equal(await evaluate(`document.querySelector('.lens-observatory').dataset.light`), "ion");
  await click(".lens-orbit-tools button[aria-label='Rotate right']");
  await waitFor(
    `JSON.parse(document.querySelector('.lens-observatory canvas').dataset.lensingCamera).yaw !== ${restored.yaw}`,
    "paused camera control is published on the next rendered frame",
  );
  assert.notEqual(
    JSON.parse(await evaluate(`document.querySelector('.lens-observatory canvas').dataset.lensingCamera`)).yaw,
    restored.yaw,
  );
  await pressKey("Escape", 27);
  await waitFor(
    `!document.querySelector('.lens-observatory') && !location.hash`,
    "shared view closes without reopening",
  );
  report.checks.push({
    name: "Observatory sharing restores the camera and light, supports clipboard fallback and paused controls, and closes cleanly",
    passed: true,
    evidence: { original, restored },
  });

  await send("Network.enable");
  await send("Network.setCacheDisabled", { cacheDisabled: true });
  await send("Network.setBlockedURLs", { urls: ["*secondary-study-styles*.css"] });
  try {
    await navigate("/?runtime=perspective-recovery#build=signal&deviation=62&corroborated=1", 390, 844);
    await waitFor(
      `document.querySelector('.o-study-loading button')?.textContent.includes('Reload')`,
      "unavailable instrument has a recovery action",
    );
    await send("Network.setBlockedURLs", { urls: [] });
    await click(".o-study-loading button");
    await waitFor(
      `document.querySelector('.o-lab input[type=range]')?.value === '62' && document.querySelector('.o-toggle input')?.checked`,
      "reload preserves the saved study and controls",
      30000,
    );
    assert.equal(await evaluate(`!!document.querySelector('.o-study-loading')`), false);
    report.checks.push({
      name: "A blocked optional stylesheet recovers through a fresh document while preserving the chosen experiment",
      passed: true,
    });
  } finally {
    await send("Network.setBlockedURLs", { urls: [] });
    await send("Network.setCacheDisabled", { cacheDisabled: false });
  }
}
