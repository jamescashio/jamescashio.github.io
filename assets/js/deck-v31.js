/* ZEUSAPOLLO V31 "The Grid" — deck logic.
   Vanilla port of the Dyson-deck design component: no framework, no build
   step, no network calls. Content data lives here; every figure matches the
   owner-verified 08-10-2026 public architecture snapshot in /status.json. */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var sfx = function (name) { if (window.ZASFX) window.ZASFX.play(name); };

  /* ── verified data · 08-10-2026 ─────────────────────────────────────── */

  var NODES = [
    { n: 'hermes', h: 'ZEUS', ct: 'CT-105', r: 'AI orchestration', p: 'Routes every request through one gateway and keeps the fleet reconciled.' },
    { n: 'mcp-gateway', h: 'ZEUS', ct: 'CT-112', r: 'Tool fabric', p: 'One authenticated surface for every model-callable tool, with scope and rate policy enforced before a call goes out.' },
    { n: 'n8n', h: 'ZEUS', ct: 'CT-104', r: 'Automation engine', p: 'Scheduled and event-driven jobs. Operational at the 08-10-2026 check; live job counts stay private.' },
    { n: 'wazuh', h: 'APOLLO', ct: 'CT-201', r: 'Security monitoring', p: 'Intrusion detection, file integrity and log correlation across every container on both hosts.' },
    { n: 'vaultwarden', h: 'APOLLO', ct: 'CT-203', r: 'Secret custody', p: 'Credentials never leave owned hardware. No third-party vault holds a key to this fleet.' },
    { n: 'prometheus', h: 'ZEUS', ct: 'CT-108', r: 'Metrics + monitoring', p: 'Metrics collection and alerting. If a service degrades, it is visible before anyone reports it.' },
    { n: 'technitium-sec', h: 'APOLLO', ct: 'CT-205', r: 'Secondary DNS', p: 'Second authoritative resolver so name resolution survives one host going down for maintenance.' },
    { n: 'ollama-zeus', h: 'ZEUS', ct: 'CT-115', r: 'Local inference', p: 'On-box model serving for work that must never leave the property.' },
    { n: 'litellm-zeus', h: 'ZEUS', ct: 'CT-116', r: 'Lane proxy', p: 'Normalizes the capability lanes behind one interface, so routing policy is a config change and not a rewrite.' },
    { n: 'firecrawl', h: 'ZEUS', ct: 'CT-118', r: 'Retrieval', p: 'Owned crawl and extraction for research lanes, keeping source fetching inside the perimeter.' },
    { n: 'tools', h: 'ZEUS', ct: 'CT-119', r: 'Utility surface', p: 'Shared internal utilities the automation lanes call, versioned alongside the fleet.' },
    { n: 'backup-verifier', h: 'APOLLO', ct: 'CT-207', r: 'Restore proof', p: 'A backup nobody has restored is a rumor. This one proves the chain.' },
    { n: 'control-plane', h: 'ZEUS', ct: 'CT-101', r: 'Fleet control', p: 'Reconciliation and lifecycle for every container, driven from declared state rather than memory.' },
    { n: 'technitium-dns', h: 'ZEUS', ct: 'CT-102', r: 'Primary DNS', p: 'Primary resolver on owned hardware. Nothing is handed to a third-party resolver to be logged.' },
    { n: 'pbs', h: 'APOLLO', ct: 'CT-209', r: 'Backup server', p: 'Deduplicated, verified backup target for the fleet, held on owned disks.' },
    { n: 'litellm-state', h: 'ZEUS', ct: 'CT-117', r: 'Routing state', p: 'Health and failover state for the lane proxy, kept separate from the proxy itself.' },
    { n: 'media-stack', h: 'APOLLO', ct: 'CT-211', r: 'Media services', p: 'Household media services, isolated from the AI fabric and from anything holding credentials.' },
    { n: 'plex-backup', h: 'ZEUS', ct: 'CT-121', r: 'Media backup', p: 'Second copy of library metadata and configuration so a rebuild is an afternoon, not a weekend.' },
    { n: 'rclone-onedrive', h: 'ZEUS', ct: 'CT-122', r: 'Offsite sync', p: 'Encrypted offsite copy closing the 3-2-1 rule without handing plaintext to anybody.' }
  ];

  var SERVICES = [
    { n: 'Atlas LiteLLM gateway', s: 'OPERATIONAL' },
    { n: 'Technitium DNS · primary + secondary', s: 'OPERATIONAL' },
    { n: 'Wazuh security monitoring', s: 'OPERATIONAL' },
    { n: 'Prometheus monitoring', s: 'OPERATIONAL' },
    { n: 'n8n automation', s: 'OPERATIONAL' },
    { n: 'PBS backup service', s: 'OPERATIONAL' },
    { n: 'Media services', s: 'OPERATIONAL' }
  ];

  var LANES = [
    { t: '00 // FREE CLASSIFY', m: 'Kimi K3', c: 4, d: 'Triage and classification at no marginal cost. Nothing reaches a paid lane before this one has read it.' },
    { t: '01 // WORKHORSE', m: 'DeepSeek V4 Flash', c: 12, d: 'The default lane, available through the Atlas gateway. Routine drafting, extraction and summarizing.' },
    { t: '02 // EXCEPTION', m: 'DeepSeek V4 Pro', c: 24, d: 'Available through the Atlas gateway. Takes the work the workhorse flags as ambiguous, where a second pass beats a wrong answer.' },
    { t: '03A // MULTIMODAL', m: 'Gemini 3.6 Flash', c: 34, d: 'Anything with an image, a scan or a screenshot in it, where reading the artifact is the task.' },
    { t: '03B // ADVERSARIAL', m: 'Grok 4.5', c: 46, d: 'Deliberate disagreement. Runs against a conclusion to find what the first pass wanted to be true.' },
    { t: '04A // SYNTHESIS', m: 'Sol 5.6 Luna', c: 66, d: 'Architecture and cross-domain reasoning, where the answer has to hold together across systems.' },
    { t: '04B // RESEARCH', m: 'Sonar Pro', c: 58, d: 'Sourced research with citations attached, for claims that have to survive somebody checking them.' },
    { t: '05 // ADJUDICATION', m: 'GPT-5.6 Sol', c: 100, d: 'Final call on high-consequence work. Wakes up only when being wrong costs more than the lane does.' },
    { t: 'LOCAL // FALLBACK', m: 'Gemma 4 26B', c: 2, d: 'Runs on Atlas. If every gateway is unreachable, the fleet still answers — slower, private, and free.' },
    { t: 'FABRIC // GATEWAYS', m: 'Atlas LiteLLM · OpenRouter · ZenMux', c: 0, d: 'Three independent paths to the lanes, so one vendor outage does not take routing offline.' }
  ];

  var PLATES = [
    { n: 'HARDWARE', d: 'Two Proxmox hosts bought, racked and maintained personally, with Atlas carrying the gateway and local inference and Athena keeping the cluster quorate. No rented control plane.', a: '2 hosts online', b: 'Owner-racked, owner-maintained' },
    { n: 'NETWORK', d: 'Every lookup in the house resolves on owned hardware, with a primary and a secondary Technitium resolver so name service survives maintenance on either host.', a: 'Primary + secondary', b: 'Technitium DNS' },
    { n: 'STORAGE', d: 'Deduplicated backup to an owned target with Proxmox Backup Server, plus an encrypted offsite copy closing the 3-2-1 rule. Recovery telemetry stays private.', a: 'PBS operational', b: 'Restore chain verified' },
    { n: 'MODELS', d: 'Ten public capability lanes in front of a private catalog of thirty-six entries, normalized behind one gateway so routing is policy rather than plumbing.', a: '10 public lanes', b: '36 private entries' },
    { n: 'POLICY', d: 'Scope and privacy resolve before execution. Secrets stay in owned custody and egress is deliberate, not incidental.', a: 'Private by default', b: 'Egress is deliberate' },
    { n: 'PROOF', d: 'Nothing is published without a date and a stated limit. Figures that cannot be freshly measured are removed rather than estimated.', a: 'Verified 08-10-2026', b: 'Stale figures removed' }
  ];

  var HEROES = [
    { n: 'YEAGER', y: '14 OCT 1947', tag: 'BELL X-1 · MUROC ARMY AIR FIELD',
      sub: 'MACH 1.06 AT 43,000 FEET', gauge: 'MACHMETER',
      body: 'Two ribs cracked in a fall two nights before the flight, and a sawed-off broom handle rigged to latch a hatch he could not reach. He did not argue the sound barrier away. He flew through it and let the instruments file the report.',
      rule: 'Never fake a number. The claim comes from the flight, not the forecast.',
      stats: [{ v: '1.06', k: 'MACH · FIRST MEASURED SUPERSONIC FLIGHT' }, { v: '43,000', k: 'FEET AT THE RUN' }, { v: '2', k: 'CRACKED RIBS, UNREPORTED' }] },
    { n: 'JOHNSON', y: 'SKUNK WORKS', tag: 'LOCKHEED SKUNK WORKS · U-2 · SR-71',
      sub: 'BE QUICK, BE QUIET, BE ON TIME', gauge: 'ALTIMETER',
      body: 'Forty-odd aircraft out of a shop that stayed deliberately small. His fourteen rules are mostly one rule written fourteen ways: keep the team tiny and the lines of authority short enough that a decision survives contact with the work.',
      rule: 'One operator, short lines, ship the capability that earns its place.',
      stats: [{ v: '3.2', k: 'MACH · SR-71 CRUISE' }, { v: '85,000', k: 'FEET · OPERATING ALTITUDE' }, { v: '14', k: 'RULES, MOSTLY ABOUT PEOPLE' }] },
    { n: 'RUTAN', y: '1986 · 2004', tag: 'SCALED COMPOSITES · VOYAGER · SPACESHIPONE',
      sub: 'AROUND THE WORLD, THEN OUT OF IT', gauge: 'FUEL REMAINING',
      body: 'Voyager flew around the world without stopping or refueling in December 1986. SpaceShipOne took the Ansari X Prize on 4 October 2004 — a small shop that preferred flying hardware to slideware, and canard layouts nobody else would draw.',
      rule: 'Try the weird thing, at a scale where evidence arrives before opinion hardens.',
      stats: [{ v: '9 DAYS', k: 'VOYAGER · NONSTOP, UNREFUELED' }, { v: '2004', k: 'ANSARI X PRIZE' }, { v: '1', k: 'SMALL SHOP, PRIVATELY FUNDED' }] }
  ];

  var DECKS = [
    ['conn', 'DECK 00 // SNAPSHOT', 'Public architecture snapshot, verified 10 August 2026.', 'YES // WELCOME ABOARD'],
    ['grid', 'DECK 01 // THE GRID', 'Two Proxmox hosts, nineteen containers, cluster quorate.', 'WITNESS // 19/19 VERIFIED RUNNING · 08-10-2026'],
    ['routing', 'DECK 02 // ROUTING', 'Quality picks the model. Cost only breaks a tie.', 'YES // QUALITY GATES FIRST'],
    ['iron', 'DECK 03 // THE IRON', 'Six plates on the bar. One operator under it.', 'WITNESS // SIX DOCUMENTED PLATES. ONE OPERATOR.'],
    ['lineage', 'DECK 03B // LINEAGE', 'Yeager, Johnson, Rutan. Fly it, then say it.', 'WITNESS // FLY IT, THEN SAY IT'],
    ['builds', 'DECK 04 // BUILDS', 'Seven builds. One operating doctrine.', 'WITNESS // SEVEN DOCUMENTED BUILDS'],
    ['operator', 'DECK 05 // OPERATOR', 'A system is only as honest as its builder.', 'YES // NEVER FAKE A NUMBER'],
    ['console', 'DECK 06 // E.V.E.', 'Local, read-only, no network calls.', 'YES // TRY: MAKE IT SO'],
    ['hail', 'DECK 07 // CONTACT', 'Hailing frequencies open. doug@cashio.us', 'YES // HAILING FREQUENCIES OPEN']
  ];

  var C_OK = 'var(--green)', C_DIM = 'var(--text-dim)', C_CY = 'var(--cyan)', C_AC = 'var(--accent)', C_ER = 'var(--red)';

  /* ── sfx delegation ─────────────────────────────────────────────────── */

  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-sfx]');
    if (el) sfx(el.getAttribute('data-sfx'));
  });
  document.addEventListener('pointerenter', function (e) {
    if (e.target && e.target.closest && e.target.closest('[data-sfx]')) sfx('tick');
  }, true);

  /* ── audio toggle ───────────────────────────────────────────────────── */

  var sndBtn = $('[data-snd-toggle]');
  function paintSound() {
    var on = !!(window.ZASFX && window.ZASFX.enabled);
    if (!sndBtn) return;
    $('[data-snd-label]', sndBtn).textContent = on ? 'AUDIO ON' : 'AUDIO OFF';
    var dot = $('[data-snd-dot]', sndBtn);
    dot.style.background = on ? 'var(--green)' : 'var(--text-dim)';
    dot.style.boxShadow = on ? '0 0 9px var(--green)' : 'none';
  }
  if (sndBtn) sndBtn.addEventListener('click', function () {
    if (window.ZASFX) window.ZASFX.toggle();
    paintSound();
  });
  paintSound();

  /* ── boot overlay ───────────────────────────────────────────────────── */

  var boot = $('[data-boot]');
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  (function () {
    if (!boot) return;
    var seen = true;
    try { seen = sessionStorage.getItem('za-boot2') === '1'; } catch (e) {}
    if (seen || reduced) { boot.remove(); boot = null; return; }
    try { sessionStorage.setItem('za-boot2', '1'); } catch (e) {}
    boot.hidden = false;
    var t = setTimeout(closeBoot, 3600);
    function closeBoot() {
      clearTimeout(t);
      if (!boot) return;
      boot.style.transition = 'opacity .5s var(--ease)';
      boot.style.opacity = '0';
      setTimeout(function () { if (boot) { boot.remove(); boot = null; } }, 520);
    }
    $('[data-boot-skip]', boot).addEventListener('click', closeBoot);
  })();

  /* ── reveal on scroll (with safety) ─────────────────────────────────── */

  var revealEls = $$('[data-reveal]');
  if (!reduced && 'IntersectionObserver' in window) {
    var reveal = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.style.opacity = '1';
          en.target.style.transform = 'none';
          reveal.unobserve(en.target);
        }
      });
    }, { rootMargin: '-6% 0px -12% 0px' });
    revealEls.forEach(function (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(22px)';
      el.style.transition = 'opacity .8s var(--ease), transform .8s var(--ease)';
      reveal.observe(el);
    });
    setTimeout(function () {
      revealEls.forEach(function (el) { el.style.opacity = '1'; el.style.transform = 'none'; });
    }, 11000);
  }

  /* ── smooth section jump ────────────────────────────────────────────── */

  function goTo(id) {
    var el = document.getElementById(id);
    if (!el) return;
    window.scrollTo({ top: el.getBoundingClientRect().top + (window.scrollY || 0) - 54, behavior: reduced ? 'auto' : 'smooth' });
  }

  /* ── deck 01 · fleet ring ───────────────────────────────────────────── */

  var orbit = $('[data-orbit]');
  var nodeBtns = [];
  var selNode = 0;
  function paintNode() {
    var n = NODES[selNode];
    $('[data-sel-role]').textContent = '◈ ' + n.r.toUpperCase();
    $('[data-sel-name]').textContent = n.n;
    $('[data-sel-meta]').textContent = n.h + ' // ' + n.ct + ' · RUNNING';
    $('[data-sel-p]').textContent = n.p;
    nodeBtns.forEach(function (b, i) {
      var on = i === selNode, zeus = NODES[i].h === 'ZEUS';
      b.style.background = on ? 'rgba(255,149,0,.20)' : 'rgba(8,10,18,.88)';
      b.style.borderColor = on ? 'var(--accent)' : (zeus ? 'rgba(255,149,0,.34)' : 'rgba(0,249,255,.34)');
      b.style.color = on ? 'var(--accent)' : 'var(--text-dim)';
      b.style.boxShadow = on ? '0 0 22px var(--accent-glow)' : 'none';
    });
  }
  if (orbit) {
    NODES.forEach(function (n, i) {
      var zeus = n.h === 'ZEUS';
      var list = NODES.filter(function (x) { return (x.h === 'ZEUS') === zeus; });
      var a = (list.indexOf(n) / list.length) * Math.PI * 2 - Math.PI / 2;
      var rx = zeus ? 34 : 17, ry = zeus ? 38 : 19;
      var wrap = document.createElement('span');
      wrap.className = 'za-node-wrap';
      wrap.style.left = (50 + Math.cos(a) * rx) + '%';
      wrap.style.top = (50 + Math.sin(a) * ry) + '%';
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'za-node';
      b.title = n.n; b.setAttribute('aria-label', n.n);
      b.innerHTML = '<i></i>' + n.ct.replace('CT-', '');
      b.addEventListener('click', function () { selNode = i; paintNode(); sfx('select'); });
      wrap.appendChild(b);
      orbit.appendChild(wrap);
      nodeBtns.push(b);
    });
    paintNode();
  }

  /* ── deck 02 · lanes + trace ────────────────────────────────────────── */

  var laneBtns = $$('[data-lane]');
  var selLane = 1;
  function paintLane() {
    var l = LANES[selLane];
    $('[data-lane-t]').textContent = l.t;
    $('[data-lane-m]').textContent = l.m;
    $('[data-lane-d]').textContent = l.d;
    $('[data-lane-cost]').textContent = l.c === 0 ? 'FABRIC' : l.c;
    laneBtns.forEach(function (b, i) { b.classList.toggle('is-on', i === selLane); });
  }
  laneBtns.forEach(function (b, i) {
    b.addEventListener('click', function () { selLane = i; paintLane(); });
  });
  if (laneBtns.length) paintLane();

  var traceT = null;
  var traceBtn = $('[data-trace-run]');
  if (traceBtn) traceBtn.addEventListener('click', function () {
    var out = $('[data-trace-out]');
    var cards = $$('[data-flow]');
    var steps = [
      ['▸ INTENT      request accepted · scope resolved', C_DIM],
      ['▸ POLICY      privacy gate pass · guardrails set', C_CY],
      ['▸ QUALIFY     workhorse lane qualified', C_CY],
      ['▸ EXECUTE     DeepSeek V4 Flash · one pass', C_AC],
      ['✔ TRANSLATE   traced, measured, handed back in plain language', C_OK]
    ];
    var i = 0;
    clearInterval(traceT);
    cards.forEach(function (c) { c.classList.remove('is-on'); });
    traceT = setInterval(function () {
      if (i >= steps.length) { clearInterval(traceT); return; }
      out.textContent = steps[i][0];
      out.style.color = steps[i][1];
      if (cards[i]) cards[i].classList.add('is-on');
      sfx(i === 4 ? 'select' : 'tick');
      i++;
    }, reduced ? 1 : 640);
  });

  /* ── deck 03 · plates ───────────────────────────────────────────────── */

  var plateBtns = $$('[data-plate]');
  var selPlate = 0, plateSeen = 1, racked = false, rackT = null;
  function paintPlates() {
    var p = PLATES[selPlate];
    $('[data-plate-no]').textContent = 'PLATE ' + String(selPlate + 1).padStart(2, '0') + ' // ' + p.n;
    $('[data-plate-n]').textContent = p.n;
    $('[data-plate-d]').textContent = p.d;
    $('[data-plate-a]').textContent = p.a;
    $('[data-plate-b]').textContent = p.b;
    $('[data-plate-fill]').style.width = Math.round((plateSeen / 6) * 100) + '%';
    $('[data-plate-count]').textContent = '0' + plateSeen;
    plateBtns.forEach(function (b, i) {
      b.classList.toggle('is-on', i === selPlate);
      b.classList.toggle('is-seen', i < plateSeen);
    });
  }
  plateBtns.forEach(function (b, i) {
    b.addEventListener('click', function () { selPlate = i; paintPlates(); });
  });
  function rack() {
    if (racked) return; racked = true;
    if (reduced) { plateSeen = 6; paintPlates(); return; }
    rackT = setInterval(function () {
      if (plateSeen >= 6) return clearInterval(rackT);
      plateSeen++;
      paintPlates();
    }, 420);
  }
  if (plateBtns.length) paintPlates();

  /* ── deck 03B · lineage record card ─────────────────────────────────── */

  var heroBtns = $$('[data-hero]');
  var selHero = 0;
  function paintHero() {
    var h = HEROES[selHero];
    $('[data-hero-tag]').textContent = h.tag;
    $('[data-hero-n]').textContent = h.n;
    $('[data-hero-sub]').textContent = h.sub;
    $('[data-hero-body]').textContent = h.body;
    $('[data-hero-rule]').textContent = h.rule;
    $('[data-hero-gauge]').textContent = h.gauge;
    $$('[data-hero-stat]').forEach(function (el, i) {
      $('b', el).textContent = h.stats[i].v;
      $('span', el).textContent = h.stats[i].k;
    });
    heroBtns.forEach(function (b, i) { b.classList.toggle('is-on', i === selHero); });
  }
  heroBtns.forEach(function (b, i) {
    b.addEventListener('click', function () { selHero = i; paintHero(); });
  });
  if (heroBtns.length) paintHero();

  /* ── deck 06 · E.V.E. console ───────────────────────────────────────── */

  var log = $('[data-term-log]');
  var input = $('[data-term-input]');
  var hist = [], hi = 0;

  function say(entries) {
    if (!log) return;
    entries.forEach(function (ln) {
      var d = document.createElement('div');
      d.style.color = ln.c;
      d.textContent = ln.t;
      log.appendChild(d);
    });
    while (log.children.length > 160) log.removeChild(log.firstChild);
    log.scrollTop = log.scrollHeight;
  }

  function pad(s, w) { s = String(s); while (s.length < w) s += ' '; return s; }

  function run(cmd) {
    var c = (cmd || '').trim();
    if (!c) return;
    hist.push(c); hi = hist.length;
    say([{ c: C_CY, t: 'doug@zeus:~$ ' + c }]);
    var k = c.toLowerCase();
    if (k === 'clear') { log.innerHTML = ''; return; }
    if (k === 'help') return say([
      { c: C_AC, t: 'COMMANDS' },
      { c: C_DIM, t: '  status     the public snapshot, verified 08-10-2026' },
      { c: C_DIM, t: '  fleet      the nineteen container roles' },
      { c: C_DIM, t: '  services   what is operational right now' },
      { c: C_DIM, t: '  routes     the ten public capability lanes' },
      { c: C_DIM, t: '  catalog    public lanes vs private catalog' },
      { c: C_DIM, t: '  eve        what E.V.E. is and how figures get verified' },
      { c: C_DIM, t: '  lineage    Yeager · Johnson · Rutan' },
      { c: C_DIM, t: '  creed      standing orders' },
      { c: C_DIM, t: '  whoami     the operator' },
      { c: C_DIM, t: '  bit        hail the deck guide' },
      { c: C_DIM, t: '  engage     jump to the fleet map' },
      { c: C_DIM, t: '  archive    previous releases of this site' },
      { c: C_DIM, t: '  clear      clear the log' }
    ]);
    if (k === 'status') return say([
      { c: C_OK, t: 'Public architecture snapshot · verified 08-10-2026' },
      { c: C_DIM, t: '19 of 19 containers running · 2 Proxmox hosts online · cluster quorate' },
      { c: C_DIM, t: '10 public capability lanes · 36 private catalog entries' },
      { c: C_DIM, t: 'Cost figures and job counts are withheld until freshly measured.' }
    ]);
    if (k === 'fleet') return say(NODES.map(function (n) {
      return { c: C_DIM, t: '  ' + pad(n.ct, 8) + pad(n.h, 8) + pad(n.n, 18) + n.r };
    }).concat([{ c: C_OK, t: '19 roles documented · 19 verified running 08-10-2026' }]));
    if (k === 'services') return say(SERVICES.map(function (s) {
      return { c: C_DIM, t: '  ' + pad(s.n, 40) + s.s };
    }).concat([{ c: C_OK, t: 'All listed services operational at the 08-10-2026 check.' }]));
    if (k === 'routes') return say(LANES.map(function (l) {
      return { c: C_DIM, t: '  ' + pad(l.t, 24) + l.m };
    }).concat([{ c: C_OK, t: 'Quality picks the model. Cost only breaks a tie.' }]));
    if (k === 'catalog') return say([
      { c: C_AC, t: '10 public capability lanes — the abstraction this page publishes.' },
      { c: C_CY, t: '36 private model catalog entries — behind the gateway, not published.' },
      { c: C_DIM, t: 'The two are deliberately not the same number.' }
    ]);
    if (k === 'eve') return say([
      { c: C_AC, t: 'E.V.E. — Evaluation Verification Engine.' },
      { c: C_DIM, t: 'Owner-run live check over cluster SSH. No self-reported numbers.' },
      { c: C_DIM, t: 'Last run 08-10-2026. A figure without a fresh measurement is withheld, not estimated.' }
    ]);
    if (k === 'lineage' || k === 'yeager' || k === 'johnson' || k === 'rutan') return say([
      { c: C_AC, t: 'YEAGER  · 14 Oct 1947 · Bell X-1 · Mach 1.06 at 43,000 ft' },
      { c: C_DIM, t: '  Two cracked ribs and a broom handle. Never fake a number.' },
      { c: C_CY, t: 'JOHNSON · Skunk Works · U-2 · SR-71 at Mach 3.2' },
      { c: C_DIM, t: '  Be quick, be quiet, be on time. Short lines of authority.' },
      { c: C_OK, t: 'RUTAN   · Voyager 1986 · SpaceShipOne · X Prize 4 Oct 2004' },
      { c: C_DIM, t: '  Try the weird thing at a scale where evidence arrives first.' }
    ]);
    if (k === 'creed') return say([
      { c: C_AC, t: 'Never fake a number. Never bury the tradeoff. Lift the iron.' },
      { c: C_DIM, t: 'Models advise. The operator decides.' }
    ]);
    if (k === 'whoami') return say([
      { c: C_OK, t: 'doug@zeus · Doug Cashio · Pensacola, Florida' },
      { c: C_DIM, t: '20+ years enterprise · sovereign architecture · doug@cashio.us' }
    ]);
    if (k === 'archive') return say([
      { c: C_DIM, t: 'Previous releases stay reachable, figures frozen as historical:' },
      { c: C_CY, t: '  /grid.html       V31 first stage — the 1982 grid' },
      { c: C_CY, t: '  /index-v44.html  v44 "Aurora" deck' },
      { c: C_CY, t: '  /command.html    v21.2a command center (archived build)' }
    ]);
    if (k === 'engage' || k === 'make it so' || k === 'makeitso') {
      sfx('warp');
      say([{ c: C_OK, t: k === 'engage' ? 'Course laid in. ▸ Engage.' : 'Aye. Course laid in. ▸ Engage.' }]);
      goTo('grid');
      return;
    }
    if (k === 'bit') {
      say([{ c: C_AC, t: 'YES.' }]);
      bitFlash('YES // AT YOUR SERVICE', 'yes', 1800);
      return;
    }
    if (k === 'greetings') return say([{ c: C_AC, t: 'GREETINGS, PROGRAM.' }]);
    if (k === 'endofline' || k === 'end of line') return say([{ c: C_AC, t: 'END OF LINE.' }]);
    if (k === 'mcp') return say([{ c: C_AC, t: 'the MCP was retired in 1982. this house answers to one operator.' }]);
    if (k === 'tron') return say([{ c: C_AC, t: 'he fights for the users.' }]);
    if (k === 'butlerian') return say([
      { c: C_AC, t: 'thou shalt not make a machine in the likeness of a human mind.' },
      { c: C_DIM, t: 'noted. models advise; the operator decides.' }
    ]);
    say([{ c: C_DIM, t: 'Unknown command: ' + c + '. Type "help".' }]);
  }

  if (input) {
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { run(input.value); input.value = ''; sfx('press'); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); if (hi > 0) { hi--; input.value = hist[hi] || ''; } }
      else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (hi < hist.length - 1) { hi++; input.value = hist[hi] || ''; }
        else { hi = hist.length; input.value = ''; }
      }
      else if (e.key === 'Escape') { input.value = ''; }
    });
    $$('[data-hint]').forEach(function (b) {
      b.addEventListener('click', function () { run(b.getAttribute('data-hint')); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === '/' && document.activeElement !== input && !/^(INPUT|TEXTAREA)$/.test((document.activeElement || {}).tagName || '')) {
        e.preventDefault();
        input.focus();
        goTo('console');
      }
    });
  }

  /* ── Bit · the deck guide ───────────────────────────────────────────── */

  var bitDock = $('[data-bit]');
  var bitLabel = $('[data-bit-label]');
  var bitT = null;
  function bitFlash(msg, mood, holdMs) {
    if (!bitDock) return;
    bitDock.setAttribute('data-mood', mood || 'yes');
    if (bitLabel) bitLabel.textContent = msg;
    if (window.ZABit) window.ZABit.setState(mood === 'no' ? 'no' : 'yes');
    clearTimeout(bitT);
    bitT = setTimeout(function () {
      bitDock.setAttribute('data-mood', 'idle');
      if (window.ZABit) window.ZABit.setState('idle');
      if (bitLabel) bitLabel.textContent = 'BIT // DECK GUIDE';
    }, holdMs || 2600);
  }
  if (bitDock && window.ZABit) {
    var cv = document.createElement('canvas');
    cv.width = 112; cv.height = 112;
    $('button', bitDock).appendChild(cv);
    window.ZABit.mount(cv);
    if (reduced) window.ZABit.setStill(true);
    $('button', bitDock).addEventListener('click', function () {
      bitFlash(DECKS[curDeck][3], 'yes', 2200);
      sfx('select');
    });
  }

  /* ── deck tracking · HUD strip + Bit lines + iron rack ──────────────── */

  var curDeck = 0;
  function paintDeck() {
    var d = DECKS[curDeck];
    var now = $('[data-deck-now]'), strip = $('[data-deck-strip]');
    if (now) now.textContent = d[1];
    if (strip) strip.textContent = d[2];
  }
  if ('IntersectionObserver' in window) {
    var deckObs = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        var i = -1;
        DECKS.forEach(function (d, j) { if (d[0] === en.target.id) i = j; });
        if (i > -1 && i !== curDeck) {
          curDeck = i;
          paintDeck();
          bitFlash(DECKS[i][3], DECKS[i][3].indexOf('WITNESS') === 0 ? 'no' : 'yes', 2600);
          if (DECKS[i][0] === 'iron') rack();
        }
      });
    }, { threshold: 0.34 });
    DECKS.forEach(function (d) {
      var el = document.getElementById(d[0]);
      if (el) deckObs.observe(el);
    });
  }
  paintDeck();
  if (reduced) rack();
})();
