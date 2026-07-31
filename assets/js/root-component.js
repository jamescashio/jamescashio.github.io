/* Generated from index.html's data-dc root logic.
   A first-party factory lets the runtime instantiate the component without
   eval/new Function, so the production CSP can remain free of unsafe-eval. */
(function () {
  window.__cashioRootComponentFactory = function (DCLogic, StreamableLogic, React) {
    const BOOT = [
      ['0.00', 'ZEUSAPOLLO CORE', 'COLD START', 'var(--text-dim)'],
      ['0.31', 'OPERATOR AUTH', 'DOUG CASHIO', 'var(--cyan)'],
      ['0.62', 'CLUSTER QUORUM', 'ZEUS · APOLLO · ATHENA · 3/3', 'var(--cyan)'],
      ['0.94', 'CONTAINER ROLES', '19 DOCUMENTED', 'var(--cyan)'],
      ['1.26', 'LIVE CHECK 07-30-2026', '19 OF 19 RUNNING', 'var(--green)'],
      ['1.58', 'MODEL LANES', '10 CONFIGURED', 'var(--cyan)'],
      ['1.90', 'BACKUP CHAIN', '18 OF 19 INSIDE 24H', 'var(--green)'],
      ['2.21', 'PATCH POSTURE', '0 SECURITY UPDATES DUE', 'var(--green)'],
      ['2.53', 'OPERATING COST', '$0.26 / DAY', 'var(--green)'],
      ['2.84', 'ACCESS GRANTED', 'WELCOME TO THE GRID', 'var(--accent)']
    ];
    
    const ZEUS = [
      ['hermes', 105, 'Autonomous AI orchestration', 64, 'Routes every request through one gateway, reconciles the fleet, and files the dated public-safe export this page reads from.'],
      ['mcp-gateway', 106, 'Public-safe tool sharing', 66, 'Agent tooling with explicit scope boundaries and human approval gates. Highest disk on Zeus and watched for it.'],
      ['n8n', 107, 'Low-code automation engine', 42, 'Carries the scheduled fleet work — briefings, health checks, release monitoring, failover rehearsals.'],
      ['wazuh', 104, 'SIEM + CVE scanning', 30, 'Continuous detection across the fleet. Segmentation and least privilege are enforced, not assumed.'],
      ['vaultwarden', 114, 'Self-hosted secret custody', 28, 'Credentials never leave owned infrastructure. Nothing in this projection exposes one.'],
      ['kuma-grafana', 102, 'Uptime + operational dashboards', 48, 'Dead-man switch and metrics in one node. If the fleet goes quiet, the silence itself raises the alarm.'],
      ['technitium-sec', 109, 'Clustered DNS failover', 23, 'Secondary sovereign resolver. If the primary drops, name resolution never notices.'],
      ['ollama-zeus', 110, 'Local model inference', 34, 'Privacy-bound work never leaves the house. The local lane is the floor, not the fallback.'],
      ['litellm-zeus', 113, 'Model gateway node', 11, 'Policy enforcement point for the ten lanes — capability, privacy and severity decide before price does.'],
      ['firecrawl', 103, 'Structured web extraction', 55, 'Turns pages into clean structured input for the research lanes instead of scraped noise.'],
      ['tools', 115, 'Shared operator tooling', 35, 'The utility bench: one-off jobs, migrations and maintenance scripts kept out of production nodes.'],
      ['backup-verifier', 119, 'Restore rehearsal', 11, 'Proves the backups actually restore. A backup nobody has restored is a rumour, not a control.'],
      ['control-plane', 200, 'Fleet control + reconciliation', 30, 'Where declared state meets running state, and the difference gets reported rather than hidden.']
    ];
    
    const APOLLO = [
      ['technitium-dns', 101, 'Sovereign DNS + tracker blocking', 31, 'Primary resolver for the house. Every lookup stays on owned iron; 220,780 blocklist entries applied at the resolver.'],
      ['pbs', 300, 'Proxmox Backup Server', 62, 'Deduplicated snapshots for the whole fleet. 18 of 19 guests backed up inside 24 hours at the last check.'],
      ['litellm-state', 111, 'PostgreSQL + Redis shared state', 4, 'Routing state, budgets and traces shared across gateway nodes.'],
      ['media-stack', 112, 'Media services', 56, 'Self-hosted media pipeline. Kept on Apollo so it never contends with security or inference work.'],
      ['plex-backup', 108, 'Media state protection', 14, 'Separate protection path for media state, isolated from the fleet backup chain.'],
      ['rclone-onedrive', 117, 'Offsite replication', 8, 'The offsite leg of the 3-2-1 rule. Local snapshots alone are not a backup strategy.']
    ];
    
    const LANES = [
      ['00 // FREE CLASSIFY', 'Kimi K3', 'Free-tier classification and drafts through ZenMux. The entry lane clears routine work at zero marginal cost.', 4, 'var(--green)', 'green'],
      ['01 // WORKHORSE', 'DeepSeek V4 Flash', 'Monitoring, health checks and scheduled briefings — the lane that carries most of the daily volume.', 12, 'var(--green)', 'green'],
      ['02 // EXCEPTION', 'DeepSeek V4 Pro', 'Warning-level analysis and escalation when a routine check comes back wrong.', 24, 'var(--cyan)', 'cyan'],
      ['03A // MULTIMODAL', 'Gemini 3.6 Flash', 'Code review, dashboard QA and multimodal analysis where a screenshot is part of the evidence.', 32, 'var(--cyan)', 'cyan'],
      ['03B // ADVERSARIAL', 'Grok 4.5', 'Second-opinion code review and strategy A/B testing. Disagreement is a feature of this lane.', 46, 'var(--purple)', 'purple'],
      ['04A // SYNTHESIS', 'Sol 5.6 Luna', 'Architecture and cross-domain reasoning where the answer has to hold together across systems.', 66, 'var(--accent)', 'accent'],
      ['04B // RESEARCH', 'Sonar Pro', 'Research-grade intelligence gathering with sources attached to the conclusion.', 58, 'var(--accent)', 'accent'],
      ['05 // ADJUDICATION', 'GPT-5.6 Sol', 'Catastrophic analysis and frontier reasoning. Reserved for consequences that justify the spend.', 92, 'var(--red)', 'red'],
      ['LOCAL // FALLBACK', 'Gemma 4 26B', 'Local classification and draft generation on owned hardware. Privacy-bound work never leaves the house.', 2, 'var(--green)', 'green'],
      ['FABRIC // GATEWAYS', 'Atlas · OpenRouter · ZenMux', 'Routing, failover and free-tier access. One gateway, no bridge tax.', 8, 'var(--amber)', 'amber']
    ];
    
    const IRON = [
      ['HARDWARE', 'PLATE 01 // HARDWARE', 'Two core hosts bought, racked and maintained personally — a Ryzen 7 5800H compute node and an i7-7700T storage node — with Atlas carrying standalone local inference and Athena holding the physical edge and cluster quorum. No rented control plane, no vendor cage.', 'var(--cyan)', 168],
      ['NETWORK', 'PLATE 02 // NETWORK', 'Sovereign DNS on Technitium, primary and clustered secondary, with tracker blocking at the resolver. Segmentation and fail-closed service behaviour are the default, not a hardening pass added later.', 'var(--green)', 186],
      ['STORAGE', 'PLATE 03 // STORAGE', 'Proxmox Backup Server with deduplicated snapshots and rehearsed restores. Recovery is a drill that has been run, not a hope written in a runbook.', 'var(--amber)', 200],
      ['MODELS', 'PLATE 04 // MODELS', 'Ten configured lanes from free classification and local Gemma inference up to frontier adjudication, behind one Hermes gateway with fallbacks in every direction.', 'var(--accent)', 186],
      ['POLICY', 'PLATE 05 // POLICY', 'Quality, privacy, task fit and severity qualify a route before price is consulted. Premium capability stays available; it just has to be earned by consequence.', 'var(--purple)', 168],
      ['PROOF', 'PLATE 06 // PROOF', 'Dated, scoped, reproducible receipts. Baseline, intervention, result and verification stay separate — and the caveat is published next to the number, every time.', 'var(--red)', 150]
    ];
    
    const BUILDS = [
      ['01', 'GATEWAY', 'Hermes Orchestrator', 'One gateway in front of every model lane: policy enforcement, budget ceilings, health reconciliation, failover in both directions, and a dated public-safe export of its own state.', 'v0.19', 'Quicksilver release', 'accent', '◈', 'var(--accent)'],
      ['02', 'SECURITY', 'Exposure Assessment', 'Cloud-exposure scanning, multi-source OSINT and domain intelligence combined into one prioritized remediation picture with a full audit trail.', 'MULTI', 'Source correlation', 'red', '🛡', 'var(--red)'],
      ['03', 'OPERATIONS', 'ZeusApollo Dashboard Suite', 'Interactive operations and briefing dashboards covering fleet health, model routing, spend and automation status across the homelab.', '8', 'Dashboards', 'cyan', '🛰', 'var(--cyan)'],
      ['04', 'INTELLIGENCE', 'Sovereign Intelligence Briefing', 'Executive-facing analysis of AI, security and infrastructure developments — written to be acted on by decision makers, not just read by engineers.', 'DAILY', 'Cadence', 'purple', '▸', 'var(--purple)'],
      ['05', 'INDUSTRY', 'The Shop Floor Signal', 'Practical operations intelligence for industrial teams, translating automation and AI capability into decisions the floor can actually use.', 'APPLIED', 'Operations focus', 'amber', '🖧', 'var(--amber)'],
      ['06', 'TOOLING', 'Graphify', 'A navigable code graph with community-driven documentation, turning a sprawling codebase into a queryable map of how everything actually connects.', '353,437', 'Nodes · 560,042 edges', 'green', '▣', 'var(--green)'],
      ['07', 'AUTONOMY', 'Escalation Cascade', 'Four-tier autonomous exception detection: free local checks escalate through DeepSeek and Sol 5.6 Luna to frontier adjudication only when severity earns it.', '15 MIN', 'Detection interval', 'cyan', '◉', 'var(--cyan)']
    ];
    
    const THEMES = {
      lcars: ['#ff9500', '#ff6a00', 'rgba(255,149,0,.35)'],
      tron: ['#00d0ff', '#0072ff', 'rgba(0,208,255,.38)'],
      ds9: ['#ffc14d', '#ff8a00', 'rgba(255,193,77,.35)']
    };
    
    const DECKS = [
      ['conn', 'DECK 00 // VIEWSCREEN ENGAGED', 'YES // WELCOME TO THE GRID'],
      ['grid', 'DECK 01 // THE GRID ENGAGED', 'YES // 19 OF 19 RUNNING'],
      ['routing', 'DECK 02 // ROUTING LAW ENGAGED', 'YES // QUALITY GATES FIRST'],
      ['iron', 'DECK 03 // THE IRON ENGAGED', 'YES // SIX PLATES. ONE OPERATOR.'],
      ['builds', 'DECK 04 // BUILDS ENGAGED', 'YES // SEVEN SHIPPED'],
      ['operator', 'DECK 05 // OPERATOR ENGAGED', 'YES // NEVER FAKE A NUMBER'],
      ['console', 'DECK 06 // CONSOLE ENGAGED', 'YES // TRY: MAKE IT SO'],
      ['hail', 'DECK 07 // CHANNEL OPEN', 'YES // HAILING FREQUENCIES OPEN']
    ];
    
    const BIT_QUIPS = [
      'YES // I AM BIT. I KNOW TWO WORDS.',
      'YES // 18.3% OF DNS QUERIES BLOCKED AT SOURCE.',
      'YES // $0.26 A DAY. THAT IS THE WHOLE BILL.',
      'NO // NO ADDRESSES. NO PORTS. NO CREDENTIALS.',
      'YES // TEN LANES. ONE GATEWAY. NO BRIDGE TAX.',
      'NO // NOTHING HERE CALLS A LIVE SYSTEM.',
      'YES // SIX PLATES ON THE BAR. LIFT THE IRON.',
      'NO // ZERO SECURITY UPDATES OUTSTANDING.',
      'YES // END OF LINE.'
    ];
    
    /* mirrors bitPalette() + .bit-companion[data-answer] in the source deck */
    const BIT_COLOR = {
      idle: ['rgb(200,252,255)', 'rgba(0,249,255,0.46)', '#00f9ff'],
      yes: ['rgb(255,248,176)', 'rgba(255,204,0,0.5)', '#ffcc00'],
      no: ['rgb(255,154,170)', 'rgba(255,0,51,0.52)', '#ff0033']
    };
    
    function makeStars(n, alpha) {
      const out = [];
      for (let i = 0; i < n; i++) {
        out.push(Math.round(Math.random() * 1800) + 'px ' + Math.round(Math.random() * 1300) + 'px rgba(255,255,255,' + alpha + ')');
      }
      return out.join(', ');
    }
    
    class Component extends DCLogic {
      state = {
        bootStep: 0, booted: false, hidBoot: false,
        alert: false, warp: false,
        snd: false, fx: true, bitMood: 'idle', bitMsg: '', toast: '', quip: 0, deck: 0, stageW: 0,
        compareOpen: false, copied: false,
        node: 0, lane: 5, ironOn: [], ironPick: 0,
        clock: '--:--:--', sd: '2026.000',
        term: [
          { k: 'sys', t: 'HERMES local console — v0.19 QUICKSILVER' },
          { k: 'dim', t: 'Read-only narrative interface. Zero network calls, zero credentials.' },
          { k: 'hint', t: 'Type  help  for available commands.' }
        ]
      };
    
      termWrap = React.createRef();
      stageRef = React.createRef();
      ironRef = React.createRef();
      ribbonRef = React.createRef();
      bitCanvas = React.createRef();
      streaks = (function () {
        const out = [];
        for (let i = 0; i < 44; i++) {
          const a = Math.random() * 360, d = 70 + Math.random() * 90;
          out.push({
            style: {
              position: 'absolute', left: 0, top: 0, width: (Math.random() < .3 ? 3 : 1.5) + 'px', height: 0,
              transformOrigin: '50% 100%', transform: 'rotate(' + a.toFixed(1) + 'deg) translateY(-' + d.toFixed(0) + 'px)',
              background: 'linear-gradient(180deg, transparent, ' + (i % 4 === 0 ? 'var(--accent)' : '#ffffff') + ')',
              animation: 'za-streak .95s cubic-bezier(.23,1,.32,1) ' + (Math.random() * .18).toFixed(2) + 's forwards'
            }
          });
        }
        return out;
      })();
      starsA = makeStars(150, .62);
      starsB = makeStars(46, .95);
      rot = 0; vel = .11; dragging = false; lastX = 0;
      px = 0; py = 0; pxs = 0; pys = 0; pxw = 9; pyw = 9; nodeEls = null;
    
      componentDidMount() {
        this.applyTheme();
        try {
          if (localStorage.getItem('za_snd') === '1') { this.setState({ snd: true }); if (window.ZAAudio) window.ZAAudio.setOn(true); }
          if (localStorage.getItem('za_fx') === '0') this.setState({ fx: false });
        } catch (e) {}
        this.onMove = (e) => {
          this.px = (e.clientX / Math.max(1, window.innerWidth) - .5) * 2;
          this.py = (e.clientY / Math.max(1, window.innerHeight) - .5) * 2;
        };
        window.addEventListener('pointermove', this.onMove, { passive: true });
        this.initMotion();
        this.measureStage();
        this.onResize = () => this.measureStage();
        window.addEventListener('resize', this.onResize, { passive: true });
        this.mountBit();
        this.startOrbit();
        this.observeDecks();
        this.initIronSequence();
        this.setClock();
        this.clockT = setInterval(() => this.setClock(), 1000);
        this.onSlash = (e) => {
          const tag = (e.target && e.target.tagName || '').toLowerCase();
          if (e.key === '/' && tag !== 'input' && tag !== 'textarea') { e.preventDefault(); this.goConsole(); }
        };
        window.addEventListener('keydown', this.onSlash);
        if (this.props.bootSequence === false || this.stillWanted()) { this.setState({ bootStep: BOOT.length, booted: true, hidBoot: true }); return; }
        this.bootT0 = Date.now();
        this.bootFail = setTimeout(() => { this.setState({ bootStep: BOOT.length, booted: true }); this.b2 = setTimeout(() => this.setState({ hidBoot: true }), 500); }, 5200);
        this.bootT = setInterval(() => {
          const n = Math.min(BOOT.length, Math.max(1, Math.round((Date.now() - this.bootT0) / 205)));
          if (n >= BOOT.length) this.finishBoot();
          this.setState({ bootStep: n });
        }, 205);
      }
    
      componentDidUpdate(prev) {
        if (prev.signature !== this.props.signature || prev.alertMode !== this.props.alertMode) this.applyTheme();
        if (prev.alertMode !== this.props.alertMode) this.setState({ alert: !!this.props.alertMode });
        if (prev.state && prev.state.alert !== this.state.alert) this.applyTheme();
      }
    
      componentWillUnmount() {
        clearInterval(this.clockT); clearInterval(this.bootT); clearTimeout(this.rackT);
        clearTimeout(this.b1); clearTimeout(this.b2); clearTimeout(this.w1); clearTimeout(this.bootFail);
        clearTimeout(this.bitT); clearTimeout(this.bitM); clearTimeout(this.toastT); clearTimeout(this.copyT); clearTimeout(this.shockT);
        clearTimeout(this.ironInitT);
        cancelAnimationFrame(this.raf); cancelAnimationFrame(this.cRaf); clearTimeout(this.printT); this.printing = false;
        if (this.io) this.io.disconnect();
        window.removeEventListener('keydown', this.onSlash);
        if (this.onMove) window.removeEventListener('pointermove', this.onMove);
        if (this.onResize) window.removeEventListener('resize', this.onResize);
        if (this.onIronScroll) window.removeEventListener('scroll', this.onIronScroll);
        cancelAnimationFrame(this.ironRaf);
        clearTimeout(this.msT); clearTimeout(this.motionT);
        if (this.revealIO) this.revealIO.disconnect();
        if (this.ironIO) this.ironIO.disconnect();
        clearInterval(this.guard);
        clearTimeout(this.roT);
        if (this.lenis) { try { this.lenis.destroy(); } catch (e) {} this.lenis = null; }
        clearInterval(this.pingT); clearTimeout(this.bitT2);
        if (window.ZABit) window.ZABit.stop();
      }
    
      mountBit(tries) {
        const n = tries || 0;
        const ok = window.ZABit && this.bitCanvas.current && window.ZABit.mount(this.bitCanvas.current);
        if (ok) { window.ZABit.setStill(this.stillWanted()); return; }
        if (n < 40) this.bitT2 = setTimeout(() => this.mountBit(n + 1), 120);
      }
    
      initIronSequence(tries) {
        const n = tries || 0;
        const panel = this.ironRef.current || document.querySelector('[data-anim="ironpanel"]');
        if (!panel) {
          if (n < 20) this.ironInitT = setTimeout(() => this.initIronSequence(n + 1), 100);
          return;
        }
        if (this.ironIO) this.ironIO.disconnect();
        if (this.onIronScroll) window.removeEventListener('scroll', this.onIronScroll);
        if (this.stillWanted()) {
          this.setState({ ironOn: IRON.map((_, i) => i), ironPick: IRON.length - 1 });
          return;
        }
        this.setState({ ironOn: [], ironPick: 0 });
        this.ironVisible = false;
        this.onIronScroll = () => {
          cancelAnimationFrame(this.ironRaf);
          this.ironRaf = requestAnimationFrame(() => {
            const r = panel.getBoundingClientRect();
            const visible = Math.max(0, Math.min(r.bottom, window.innerHeight * .9) - Math.max(r.top, window.innerHeight * .06));
            const ratio = visible / Math.max(1, Math.min(r.height, window.innerHeight * .84));
            if (ratio >= .24 && !this.ironVisible) {
              this.ironVisible = true;
              this.rackSet();
            } else if (ratio < .04) {
              this.ironVisible = false;
            }
          });
        };
        window.addEventListener('scroll', this.onIronScroll, { passive: true });
        this.onIronScroll();
      }
    
      initMotion(tries) {
        const n = tries || 0;
        const G = window.gsap, ST = window.ScrollTrigger;
        if (!G || !ST) {
          if (n < 50) this.motionT = setTimeout(() => this.initMotion(n + 1), 140);
          return;
        }
        if (this.motionReady) return;
        this.motionReady = true;
        G.registerPlugin(ST);
        if (window.SplitText) G.registerPlugin(window.SplitText);
        G.ticker.lagSmoothing(0);
    
        if (!this.stillWanted() && window.Lenis && this.props.smoothScroll !== false) {
          this.lenis = new window.Lenis({ autoRaf: false, lerp: 0.1, wheelMultiplier: 0.9 });
          this.lenis.on('scroll', ST.update);
          G.ticker.add((t) => { if (this.lenis) this.lenis.raf(t * 1000); });
        }
        const settle = (last, stable) => {
          const h = document.documentElement.scrollHeight;
          const s = h === last ? stable + 1 : 0;
          if (s < 3) { this.roT = setTimeout(() => settle(h, s), 120); return; }
          this.buildMotion(G, ST);
          ST.refresh();
        };
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => settle(-1, 0));
        else settle(-1, 0);
        if (this.state.hidBoot) this.heroIn();
      }
    
      buildMotion(G, ST) {
        if (this.stillWanted()) { this.showAll(G); return; }
    
        /* Reveals run off an IntersectionObserver rather than ScrollTrigger-attached from() tweens:
           in this runtime those triggers were being dropped after creation, which left the from-state
           applied and content invisible. An observer + to() tweens cannot fail that way — the resting
           state in the markup is the visible one. */
        const groups = [];
        G.utils.toArray('[data-anim="h2"]').forEach((el) => {
          let parts = null;
          if (window.SplitText && !el.querySelector('.za-l')) {
            try {
              const sp = new window.SplitText(el, { type: 'lines', linesClass: 'za-l' });
              G.set(sp.lines, { display: 'block' });
              parts = sp.lines;
              this.splits.push(sp);
            } catch (err) { parts = null; }
          }
          groups.push({ el: el, items: parts && parts.length ? parts : [el], y: 30, x: 0, each: 0.09 });
        });
        [['[data-anim="pipeline"]', 0.05, 0, -22], ['[data-anim="lanes"]', 0.045, 0, -26],
         ['[data-anim="builds"]', 0.07, 34, 0], ['[data-anim="method"]', 0.06, 26, 0],
         ['[data-anim="creed"]', 0.07, 26, 0]].forEach((r) => {
          const box = document.querySelector(r[0]);
          if (box && box.children.length) groups.push({ el: box, items: [].slice.call(box.children).filter((n) => n.getAttribute('aria-hidden') !== 'true'), each: r[1], y: r[2], x: r[3] });
        });
        const ribbon = this.ribbonRef.current;
        if (ribbon && ribbon.children.length) {
          groups.push({ el: ribbon, items: [].slice.call(ribbon.children), each: 0.075, y: 30, x: 0, from: 'center', onPlay: () => this.countUp() });
        }
    
        groups.forEach((g) => { G.set(g.items, { opacity: 0, y: g.y || 0, x: g.x || 0 }); g.el.__anim = g; });
    
        this.revealIO = new IntersectionObserver((ents) => {
          ents.forEach((en) => {
            if (!en.isIntersecting) return;
            const g = en.target.__anim;
            this.revealIO.unobserve(en.target);
            if (!g || g.done) return;
            g.done = true;
            this.revealed = true;
            if (g.onPlay) g.onPlay();
            G.to(g.items, { opacity: 1, y: 0, x: 0, duration: 1, ease: 'expo.out', stagger: { each: g.each, from: g.from || 'start' }, overwrite: 'auto' });
          });
        }, { rootMargin: '0px 0px -14% 0px', threshold: 0.01 });
        groups.forEach((g) => this.revealIO.observe(g.el));
    
        /* Guard: anything on screen but still invisible is a bug — reveal it. Off-screen groups keep
           their pending reveal, so the effect survives while invisible content cannot. */
        clearInterval(this.guard);
        this.guard = setInterval(() => {
          groups.forEach((g) => {
            if (g.done) return;
            const r = g.el.getBoundingClientRect();
            if (r.bottom < 40 || r.top > window.innerHeight - 40) return;
            g.done = true;
            if (g.onPlay) g.onPlay();
            G.to(g.items, { opacity: 1, y: 0, x: 0, duration: 0.8, ease: 'expo.out', stagger: { each: g.each, from: g.from || 'start' }, overwrite: 'auto' });
          });
        }, 1400);
      }
    
      showAll(G) {
        document.querySelectorAll('[data-anim]').forEach((el) => {
          const list = [el].concat([].slice.call(el.children), [].slice.call(el.querySelectorAll('.za-l')));
          list.forEach((n) => {
            if (n.getAttribute && n.getAttribute('aria-hidden') === 'true') return;
            G.set(n, { opacity: 1, x: 0, y: 0 });
          });
        });
      }
    
      heroIn() {
        const G = window.gsap;
        if (!G || this.heroDone || this.stillWanted()) return;
        this.heroDone = true;
        const tl = G.timeline({ defaults: { ease: 'expo.out' } });
        tl.from('[data-anim="eyebrow"]', { y: -14, opacity: 0, duration: 0.7 })
          .from('[data-anim="title"] h1', { yPercent: 112, duration: 1.45 }, 0.05)
          .from('[data-anim="lead"]', { y: 22, opacity: 0, duration: 1 }, 0.5)
          .from('[data-anim="cta"] > *', { y: 22, opacity: 0, duration: 0.9, stagger: 0.08 }, 0.62);
        const sub = document.querySelector('[data-anim="sub"]');
        if (sub && window.SplitText) {
          const s = new window.SplitText(sub, { type: 'chars' });
          tl.from(s.chars, { opacity: 0, yPercent: 60, duration: 0.6, stagger: { each: 0.022, from: 'start' } }, 0.34);
        } else if (sub) {
          tl.from(sub, { opacity: 0, duration: 0.8 }, 0.34);
        }
      }
    
      measureStage = () => {
        const el = this.stageRef.current;
        if (!el) { this.msT = setTimeout(this.measureStage, 150); return; }
        const w = Math.round(el.clientWidth);
        if (w && w !== this.state.stageW) this.setState({ stageW: w });
      };
    
      sfx(n) { if (window.ZAAudio) window.ZAAudio.play(n); }
    
      toggleSound = () => {
        const v = !this.state.snd;
        this.setState({ snd: v });
        if (window.ZAAudio) window.ZAAudio.setOn(v);
        try { localStorage.setItem('za_snd', v ? '1' : '0'); } catch (e) {}
        if (v) { this.sfx('granted'); this.bitSay('YES // AUDIO ONLINE', 'yes', 2600); }
      };
    
      stillWanted() {
        if (this.props.reduceMotion) return true;
        try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
      }
    
      startOrbit() {
        const rs = document.documentElement.style;
        const step = () => {
          if (!this.dragging && !this.stillWanted()) { this.vel += (.11 - this.vel) * .05; this.rot += this.vel; }
          this.pxs += (this.px - this.pxs) * .07;
          this.pys += (this.py - this.pys) * .07;
          const moved = Math.abs(this.pxs - this.pxw) > .004 || Math.abs(this.pys - this.pyw) > .004;
          const mid = window.scrollY + window.innerHeight / 2;
          let cur = 0;
          for (let i = 0; i < DECKS.length; i++) {
            const el = document.getElementById(DECKS[i][0]);
            if (el && el.offsetTop <= mid) cur = i;
          }
          if (cur !== this.state.deck) this.setState({ deck: cur });
          const range = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
          const sp = Math.min(1, Math.max(0, window.scrollY / range)).toFixed(4);
          if (sp !== this.spw) { this.spw = sp; rs.setProperty('--scrollp', sp); }
          if (moved) {
            this.pxw = this.pxs; this.pyw = this.pys;
            rs.setProperty('--px', this.pxs.toFixed(3));
            rs.setProperty('--py', this.pys.toFixed(3));
          }
          const el = this.stageRef.current;
          if (el) {
            el.style.setProperty('--za-rot', this.rot.toFixed(2) + 'deg');
            if (!this.nodeEls || this.nodeEls.length !== 19) this.nodeEls = [].slice.call(el.querySelectorAll('[data-a]'));
            for (let i = 0; i < this.nodeEls.length; i++) {
              const w = this.nodeEls[i];
              const z = Math.cos((parseFloat(w.getAttribute('data-a')) + this.rot) * Math.PI / 180);
              const t = (z + 1) / 2;
              const chip = w.firstElementChild && w.firstElementChild.firstElementChild;
              if (chip) {
                chip.style.opacity = (.3 + .7 * t).toFixed(3);
                chip.style.filter = 'brightness(' + (.62 + .58 * t).toFixed(2) + ')';
                chip.style.zIndex = String(Math.round(t * 40));
              }
            }
          }
          this.raf = requestAnimationFrame(step);
        };
        this.raf = requestAnimationFrame(step);
      }
    
      dragStart = (e) => {
        if (e.target && e.target.closest && e.target.closest('button')) return;
        this.dragging = true; this.lastX = e.clientX;
        const el = this.stageRef.current;
        if (el) { el.style.cursor = 'grabbing'; try { el.setPointerCapture(e.pointerId); } catch (err) {} }
      };
    
      dragMove = (e) => {
        if (!this.dragging) return;
        const dx = e.clientX - this.lastX;
        this.lastX = e.clientX;
        this.rot += dx * .42; this.vel = dx * .42;
      };
    
      dragEnd = (e) => {
        if (!this.dragging) return;
        this.dragging = false;
        const el = this.stageRef.current;
        if (el) { el.style.cursor = 'grab'; try { el.releasePointerCapture(e.pointerId); } catch (err) {} }
      };
    
      observeDecks() {
        if (!('IntersectionObserver' in window)) return;
        this.io = new IntersectionObserver((ents) => {
          ents.forEach((en) => {
            if (!en.isIntersecting) return;
            const d = DECKS.filter(x => x[0] === en.target.id)[0];
            if (!d || this.lastDeck === d[0]) return;
            this.lastDeck = d[0];
            this.setState({ deck: DECKS.map(x => x[0]).indexOf(d[0]) });
            if (!this.stillWanted()) {
              en.target.style.animation = 'none';
              void en.target.offsetWidth;
              en.target.style.animation = 'za-deckin .85s cubic-bezier(.23,1,.32,1)';
            }
            this.setState({ toast: d[1] });
            clearTimeout(this.toastT);
            this.toastT = setTimeout(() => this.setState({ toast: '' }), 2600);
            this.sfx('scan');
            clearInterval(this.pingT);
            if (d[0] === 'grid') this.pingT = setInterval(() => this.sfx('ping'), 6000);
            this.bitSay(d[2], d[2].indexOf('NO') === 0 ? 'no' : 'yes', 3400);
          });
        }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
        DECKS.forEach(d => { const el = document.getElementById(d[0]); if (el) this.io.observe(el); });
      }
    
      bitSay(msg, mood, ms) {
        clearTimeout(this.bitT); clearTimeout(this.bitM);
        this.setState({ bitMsg: msg, bitMood: mood || 'yes' });
        if (window.ZABit) window.ZABit.setState(mood || 'yes');
        this.bitM = setTimeout(() => { this.setState({ bitMood: 'idle' }); if (window.ZABit) window.ZABit.setState('idle'); }, 1500);
        this.bitT = setTimeout(() => this.setState({ bitMsg: '' }), ms || 3200);
      }
    
      bitPoke = () => {
        const q = BIT_QUIPS[this.state.quip % BIT_QUIPS.length];
        const no = q.indexOf('NO') === 0;
        this.setState({ quip: this.state.quip + 1 });
        this.sfx(no ? 'no' : 'yes');
        this.bitSay(q, no ? 'no' : 'yes', 4200);
      };
    
      applyTheme() {
        const t = THEMES[this.props.signature] || THEMES.lcars;
        const r = document.documentElement.style;
        if (this.state.alert) { r.setProperty('--accent', '#ff0033'); r.setProperty('--accent-2', '#ff5a1f'); r.setProperty('--accent-glow', 'rgba(255,0,51,.45)'); }
        else { r.setProperty('--accent', t[0]); r.setProperty('--accent-2', t[1]); r.setProperty('--accent-glow', t[2]); }
      }
    
      finishBoot() {
        clearInterval(this.bootT); clearTimeout(this.bootFail);
        this.sfx('granted');
        this.b1 = setTimeout(() => this.setState({ booted: true }), 560);
        this.b2 = setTimeout(() => { this.setState({ hidBoot: true }); this.bitSay('YES // WELCOME TO THE GRID', 'yes', 3600); this.countUp(); this.heroIn(); }, 1500);
      }
    
      skip = () => { clearInterval(this.bootT); clearTimeout(this.bootFail); this.sfx('blip'); this.setState({ bootStep: BOOT.length, booted: true }); this.b2 = setTimeout(() => { this.setState({ hidBoot: true }); this.countUp(); this.heroIn(); }, 700); };
    
      setClock() {
        const d = new Date();
        const p = (n) => String(n).padStart(2, '0');
        const start = Date.UTC(d.getUTCFullYear(), 0, 0);
        const day = Math.floor((d.getTime() - start) / 86400000);
        this.setState({
          clock: p(d.getUTCHours()) + ':' + p(d.getUTCMinutes()) + ':' + p(d.getUTCSeconds()),
          sd: d.getUTCFullYear() + '.' + String(day).padStart(3, '0')
        });
      }
    
      scrollTo(id) {
        const el = document.getElementById(id);
        if (!el) return;
        const y = el.getBoundingClientRect().top + window.scrollY - 60;
        if (this.lenis) this.lenis.scrollTo(y, { duration: 1.15 });
        else window.scrollTo({ top: y, behavior: 'smooth' });
      }
    
      goConsole = () => { this.scrollTo('console'); setTimeout(() => { const i = document.getElementById('za-cmd'); if (i) i.focus(); }, 520); };
      goGrid = () => { this.sfx('impact'); this.scrollTo('grid'); };
    
      toggleAlert = () => {
        this.setState(s => ({ alert: !s.alert }), () => {
          this.applyTheme();
          const a = this.state.alert;
          this.sfx(a ? 'alert' : 'standdown');
          this.bitSay(a ? 'NO // RED ALERT. ALL DECKS.' : 'YES // STAND DOWN. CONDITION GREEN.', a ? 'no' : 'yes', 3200);
          this.push(a ? [['err', '⚠ RED ALERT — all decks. This is a drill.']] : [['ok', '✔ STAND DOWN — condition green restored.']]);
        });
      };
    
      doWarp = () => { this.sfx('warp'); this.sfx('impact'); this.setState({ warp: true }); clearTimeout(this.w1); this.w1 = setTimeout(() => this.setState({ warp: false }), 950); };
    
      rackSet = () => {
        clearTimeout(this.rackT);
        this.ironRuns = (this.ironRuns || 0) + 1;
        const ironPanel = this.ironRef.current;
        if (ironPanel) ironPanel.setAttribute('data-sequence-run', String(this.ironRuns));
        if (this.stillWanted()) {
          this.setState({ ironOn: IRON.map((_, i) => i), ironPick: IRON.length - 1, shock: false });
          return;
        }
        this.setState({ ironOn: [], ironPick: 0, shock: false });
        let i = 0;
        const lift = () => {
          const next = i;
          this.sfx('plate');
          this.setState(s => ({ ironOn: s.ironOn.indexOf(next) >= 0 ? s.ironOn : s.ironOn.concat([next]), ironPick: next }));
          i += 1;
          if (i < IRON.length) {
            this.rackT = setTimeout(lift, 165);
            return;
          }
          this.bitSay('YES // SET COMPLETE. SIX PLATES.', 'yes', 3200);
          this.setState({ shock: true });
          clearTimeout(this.shockT);
          this.shockT = setTimeout(() => this.setState({ shock: false }), 620);
          const ir = this.ironRef.current;
          if (ir) { ir.style.animation = 'none'; void ir.offsetWidth; ir.style.animation = 'za-shake .34s cubic-bezier(.23,1,.32,1)'; }
        };
        this.rackT = setTimeout(lift, 120);
      };
    
      scrollTerm = () => {
        const w = this.termWrap.current;
        if (!w) return;
        const all = w.querySelectorAll('div');
        for (let i = 0; i < all.length; i++) {
          if (getComputedStyle(all[i]).overflowY === 'auto') { all[i].scrollTop = all[i].scrollHeight; break; }
        }
      };
    
      push(lines) {
        this.printQ = (this.printQ || []).concat(lines);
        this.drain();
      }
    
      drain() {
        if (this.printing) return;
        this.printing = true;
        const tick = () => {
          const q = this.printQ || [];
          if (!q.length) { this.printing = false; this.printT = null; return; }
          const batch = q.splice(0, q.length > 9 ? 2 : 1);
          this.sfx('key');
          this.setState(s => ({ term: s.term.concat(batch.map(l => ({ k: l[0], t: l[1] }))).slice(-160) }), this.scrollTerm);
          this.printT = setTimeout(tick, 46);
        };
        tick();
      }
    
      hoverSfx = () => this.sfx('hover');
    
      toggleFx = () => {
        const v = !this.state.fx;
        this.setState({ fx: v });
        try { localStorage.setItem('za_fx', v ? '1' : '0'); } catch (e) {}
        this.sfx(v ? 'yes' : 'blip');
        this.bitSay(v ? 'YES // EFFECTS ONLINE' : 'NO // EFFECTS DAMPENED', v ? 'yes' : 'no', 2600);
      };
    
      engage = () => {
        this.sfx('impact');
        this.doWarp();
        this.bitSay('YES // MISSION ENGAGED', 'yes', 3200);
        setTimeout(() => this.scrollTo('grid'), 320);
      };
    
      hail = () => {
        const open = !this.state.compareOpen;
        this.sfx(open ? 'granted' : 'blip');
        this.setState({ compareOpen: open, copied: false });
        this.bitSay(open ? 'YES // DIRECT CHANNEL READY' : 'YES // CHANNEL STANDING BY', 'yes', 3000);
      };
    
      copyEmail = () => {
        const addr = 'doug@cashio.us';
        let settled = false;
        const finish = (ok) => {
          if (settled) return;
          settled = true;
          this.sfx(ok ? 'yes' : 'blip');
          this.setState({ copied: ok, toast: ok ? 'DIRECT ADDRESS COPIED // ' + addr.toUpperCase() : 'COPY BLOCKED // ADDRESS SELECTED BELOW' });
          clearTimeout(this.toastT); clearTimeout(this.copyT);
          this.toastT = setTimeout(() => this.setState({ toast: '' }), 3200);
          this.copyT = setTimeout(() => this.setState({ copied: false }), 3600);
          this.bitSay(ok ? 'YES // ADDRESS COPIED' : 'NO // COPY BLOCKED. ADDRESS STILL VISIBLE.', ok ? 'yes' : 'no', 3200);
        };
        const fallback = () => {
          let ok = false;
          try {
            const field = document.createElement('textarea');
            field.value = addr;
            field.setAttribute('readonly', '');
            field.style.position = 'fixed'; field.style.left = '-9999px';
            document.body.appendChild(field); field.select();
            ok = document.execCommand('copy');
            document.body.removeChild(field);
          } catch (e) {}
          finish(ok);
        };
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(addr).then(() => finish(true)).catch(fallback);
          else fallback();
        } catch (e) { fallback(); }
      };
    
      countUp = () => {
        if (this.stillWanted()) return;
        const box = this.ribbonRef.current; if (!box) return;
        const cells = box.querySelectorAll('.za-statcell');
        if (cells.length < 5) return;
        const fmt = [
          (p) => Math.round(19 * p) + '/19',
          (p) => String(Math.round(10 * p)),
          () => '0',
          (p) => '$' + (0.26 * p).toFixed(2),
          (p) => (18.3 * p).toFixed(1) + '%'
        ];
        this.sfx('arp');
        const t0 = performance.now();
        const step = () => {
          const q = Math.min(1, (performance.now() - t0) / 1500);
          const e = 1 - Math.pow(1 - q, 3);
          for (let i = 0; i < 5; i++) {
            const n = cells[i].firstElementChild;
            if (n) n.textContent = fmt[i](e);
          }
          if (q < 1) this.cRaf = requestAnimationFrame(step);
        };
        cancelAnimationFrame(this.cRaf);
        this.cRaf = requestAnimationFrame(step);
      };
    
      run = (raw) => {
        const cmd = String(raw || '').trim().toLowerCase().replace(/^cashio\s+/, '');
        if (!cmd) return;
        const out = [['in', 'doug@zeus:~$ ' + cmd]];
        if (cmd === 'clear') {
          clearTimeout(this.printT); this.printT = null; this.printQ = []; this.printing = false;
          this.setState({ term: [{ k: 'hint', t: 'Buffer cleared. Type  help  for commands.' }] });
          return;
        }
        const add = (k, t) => out.push([k, t]);
        switch (cmd) {
          case 'help':
            add('ok', 'AVAILABLE — status · fleet · dns · backups · routes · cost · iron · builds · whoami · contact · alert · warp · clear');
            add('dim', 'Also: hail · topology · models · projects · end of line');
            add('hint', 'Try  make it so');
            break;
          case 'status':
            add('ok', '● 19/19 containers running — live check 07-30-2026 22:30 CDT over cluster SSH');
            add('ok', '● quorum 3/3 — Zeus · Apollo · Athena answering');
            add('ok', '● 0 security updates outstanding across the fleet');
            add('ok', '● 18/19 guests backed up inside 24 hours');
            add('ok', '● observed AI cost $0.26/day · $6.49 estimated monthly run rate');
            add('dim', '  watch: mcp-gateway 66% root disk, pbs 62%, Apollo host 57%');
            break;
          case 'fleet': case 'topology':
            add('ok', 'ZEUS   // 13 containers · Ryzen 7 5800H · 1.5/16 cores · 13/28 GiB · root 38%');
            add('ok', 'APOLLO //  6 containers · i7-7700T · 0.4/8 cores · 3.2/15 GiB · root 57%');
            add('ok', 'ATLAS  // standalone Ollama inference · qwen2.5:35b + laguna-xs-2.1 · outside quorum');
            add('ok', 'ATHENA // physical edge node + third quorum vote');
            add('dim', 'Roles and CT ids are public. Addresses, ports and access paths are not.');
            break;
          case 'routes': case 'models':
            LANES.forEach(l => add('dim', l[0].padEnd(22, ' ') + l[1]));
            add('ok', '10 configured lanes — verified 07-22-2026. Configured, not live traffic.');
            break;
          case 'dns': case 'resolver':
            add('ok', '12,100 queries · 2,218 blocked (18.3%) · 4,560 served from cache');
            add('ok', '56 active clients · 220,780 blocklist entries · 0 failures, 0 refused');
            add('dim', 'Primary technitium-dns on Apollo, clustered secondary technitium-sec on Zeus.');
            break;
          case 'backups': case 'backup':
            add('ok', '18/19 guests backed up inside 24 hours (06:00-07:07 UTC)');
            add('dim', 'media-stack last ran yesterday — inside policy.');
            add('dim', 'pbs backs the fleet up; its own snapshot is 18 days old and deliberately lowest priority.');
            add('ok', 'backup-verifier rehearses restores. An unrestored backup is a rumour, not a control.');
            break;
          case 'cost':
            add('ok', '$0.26 observed per day · $6.49 estimated monthly run rate');
            add('dim', 'Scope: provider usage in the 07-21 → 07-22 sample. Excludes owned infrastructure, electricity, and my time.');
            break;
          case 'iron':
            IRON.forEach((p, i) => add(i === IRON.length - 1 ? 'ok' : 'dim', '▮ ' + p[0]));
            add('ok', 'Six layers under load. Own the route end to end. Lift the iron.');
            break;
          case 'builds': case 'projects':
            BUILDS.forEach(b => add('dim', b[0] + ' // ' + b[2] + ' — ' + b[4] + ' ' + b[5].toLowerCase()));
            break;
          case 'whoami': case 'operator':
            add('ok', 'Doug Cashio — sovereign AI, cybersecurity, human command.');
            add('dim', '20+ years enterprise · sovereign infrastructure · Pensacola, Florida.');
            add('dim', 'Standing order: never fake a number. Never bury the tradeoff.');
            break;
          case 'contact': case 'hail':
            add('ok', 'doug@cashio.us · linkedin.com/in/dougcashio');
            add('dim', 'Verified credentials on Credly. Hailing frequencies are always open.');
            this.scrollTo('hail');
            break;
          case 'alert': case 'red alert':
            this.toggleAlert(); return;
          case 'warp': case 'engage':
            add('ok', 'Warp field stable. Course laid in.');
            this.doWarp();
            break;
          case 'make it so':
            add('ok', 'Aye, sir. ENGAGE.');
            add('dim', 'Course laid in for the sovereign core. Warp nine.');
            this.doWarp();
            break;
          case 'end of line':
            add('ok', 'END OF LINE.');
            break;
          default:
            add('err', 'Unrecognized: ' + cmd);
            add('hint', 'Type  help  for the command list.');
            this.sfx('no');
            this.bitSay('NO // UNRECOGNIZED COMMAND', 'no', 2600);
            this.push(out);
            return;
        }
        this.sfx('yes');
        if (cmd === 'make it so') this.bitSay('YES // AYE, SIR. ENGAGE.', 'yes', 3600);
        this.push(out);
      };
    
      onKey = (e) => { if (e.key === 'Enter') { const v = e.target.value; e.target.value = ''; this.sfx('key'); this.run(v); } };
    
      renderVals() {
        const st = this.state;
        const lineColor = { in: 'var(--text)', ok: 'var(--green)', dim: 'var(--text-dim)', sys: 'var(--cyan)', err: 'var(--red)', hint: 'var(--amber)' };
    
        const rows = [];
        ZEUS.forEach((n, i) => rows.push({ n, host: 'ZEUS', ring: 0, i }));
        APOLLO.forEach((n, i) => rows.push({ n, host: 'APOLLO', ring: 1, i }));
        const band = (d) => d < 30 ? 'var(--green)' : d < 50 ? 'var(--cyan)' : d < 66 ? 'var(--amber)' : 'var(--red)';
        const stageW = st.stageW || 900;
        const chipW = stageW < 620 ? 106 : stageW < 760 ? 120 : 136;
        const halfChip = chipW / 2;
        const halfStage = stageW / 2 - 14;
        const P = 1200;
        let outerR = Math.min(300, stageW / 2 - halfChip - 10);
        while (outerR > 96 && (outerR + halfChip) * (P / (P - outerR)) > halfStage) outerR -= 4;
        outerR = Math.max(96, outerR);
        const innerR = Math.max(72, outerR * 0.71);
    
        const nodes = rows.map((r, idx) => {
          const ring = r.ring === 0 ? { r: outerR, y: -60, count: ZEUS.length, off: 0 } : { r: innerR, y: 100, count: APOLLO.length, off: 22 };
          const a = ring.off + (360 / ring.count) * r.i;
          const sel = idx === st.node;
          const off = false;
          return {
            name: r.n[0], role: r.n[2], status: 'on',
            disk: r.n[3] + '%',
            diskStyle: { fontFamily: 'var(--font-mono)', fontSize: '8px', letterSpacing: '.04em', color: band(r.n[3]), flex: '0 0 auto' },
            angle: a,
            pick: () => { this.sfx('panel'); this.setState({ node: idx }); },
            wrap: { position: 'absolute', left: '50%', top: '50%', width: chipW + 'px', height: 0, marginLeft: (-halfChip) + 'px', transformStyle: 'preserve-3d', transform: 'translateY(' + ring.y + 'px) rotateY(' + a + 'deg) translateZ(' + ring.r + 'px) rotateY(' + (-a) + 'deg)' },
            counter: { position: 'absolute', left: 0, top: 0, width: chipW + 'px', height: 0, transformStyle: 'preserve-3d', transform: 'rotateY(calc(-1 * var(--za-rot, 0deg)))' },
            chip: {
              position: 'absolute', left: 0, top: '-14px', width: chipW + 'px', boxSizing: 'border-box',
              display: 'flex', alignItems: 'center', gap: '7px', padding: '6px 9px',
              borderRadius: '8px', cursor: 'pointer', textAlign: 'left',
              background: sel ? 'rgba(255,149,0,.16)' : 'rgba(8,8,14,.86)',
              border: '1px ' + (off ? 'dashed' : 'solid') + ' ' + (sel ? 'var(--accent)' : 'var(--glass-border)'),
              boxShadow: sel ? '0 0 26px -4px var(--accent)' : '0 6px 18px rgba(0,0,0,.55)',
              color: sel ? 'var(--accent)' : (off ? 'rgba(198,198,224,.5)' : 'var(--text-dim)'),
              opacity: off && !sel ? .6 : 1,
              backdropFilter: 'blur(4px)',
              transition: 'transform .25s cubic-bezier(.23,1,.32,1), opacity .25s cubic-bezier(.23,1,.32,1), border-color .25s, box-shadow .25s, background .25s, color .25s'
            }
          };
        });
    
        const an = rows[st.node] || rows[0];
        const activeNode = {
          name: an.n[0], role: an.n[2], note: an.n[4],
          hostLabel: an.host + ' // CT-' + an.n[1],
          state: 'RUNNING',
          diskLabel: 'ROOT DISK ' + an.n[3] + '%',
          diskColor: an.n[3] < 30 ? 'green' : an.n[3] < 50 ? 'cyan' : an.n[3] < 66 ? 'amber' : 'red',
          tagColor: 'green'
        };
    
        const lanes = LANES.map((l, i) => {
          const sel = i === st.lane;
          return {
            tier: l[0], model: l[1], hue: l[4],
            pick: () => { this.sfx('blip'); this.setState({ lane: i }); },
            row: {
              display: 'grid', gridTemplateColumns: '130px minmax(0,1fr) 100px', gap: '12px', alignItems: 'center',
              width: '100%', padding: '13px 14px', borderRadius: '12px', cursor: 'pointer',
              background: sel ? 'rgba(255,255,255,.07)' : 'var(--surface-2)',
              border: '1px solid ' + (sel ? l[4] : 'var(--glass-border)'),
              boxShadow: sel ? '0 0 28px -10px ' + l[4] : 'none',
              transition: 'all .25s cubic-bezier(.23,1,.32,1)'
            },
            bar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: l[3] + '%', background: l[4], boxShadow: '0 0 10px ' + l[4], borderRadius: '4px' }
          };
        });
        const al = LANES[st.lane];
        const activeLane = { model: al[1], tier: al[0], role: al[2], tagColor: al[5] };
    
        const iron = IRON.map((p, i) => {
          const on = st.ironOn.indexOf(i) >= 0;
          const sel = i === st.ironPick;
          return {
            name: p[0], no: String(i + 1).padStart(2, '0'),
            pick: () => { this.sfx('plate'); this.setState({ ironPick: i, ironOn: st.ironOn.indexOf(i) >= 0 ? st.ironOn : st.ironOn.concat([i]) }); },
            plate: {
              position: 'relative', flex: '1 1 52px', maxWidth: '74px', minWidth: '42px', height: (p[4] + 34) + 'px', marginBottom: '10px',
              transform: on ? (sel ? 'translateY(-4px) scaleY(1)' : 'translateY(0) scaleY(1)') : 'translateY(34px) scaleY(.08)', transformOrigin: '50% 100%',
              borderRadius: '12px', cursor: 'pointer', padding: '24px 0 10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: on ? 'linear-gradient(180deg, rgba(255,255,255,.12), rgba(0,0,0,.46))' : 'rgba(255,255,255,.025)',
              border: '1px solid ' + (on ? p[3] : 'var(--glass-border)'),
              color: on ? p[3] : 'rgba(198,198,224,.4)',
              boxShadow: on ? (sel ? '0 0 42px -4px ' + p[3] + ', inset 0 0 28px -8px ' + p[3] : '0 0 26px -10px ' + p[3]) : 'none',
              opacity: on ? 1 : .24,
              transition: 'transform .62s cubic-bezier(.16,1,.3,1), opacity .42s, border-color .42s, box-shadow .42s, background .42s',
              willChange: 'transform'
            },
            noStyle: {
              position: 'absolute', top: '10px', left: 0, right: 0, textAlign: 'center',
              fontFamily: 'var(--font-mono)', fontSize: '8px', letterSpacing: '.18em', color: on ? p[3] : 'var(--text-dim)', opacity: on ? .8 : .24
            },
            label: {
              fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '11px', letterSpacing: '.14em',
              writingMode: 'vertical-rl', textOrientation: 'mixed',
              opacity: on ? 1 : 0, transition: 'opacity .3s cubic-bezier(.23,1,.32,1)'
            },
            meter: {
              display: 'block', height: '4px', borderRadius: '999px',
              flex: on ? 1.45 : 1, opacity: on ? .95 : .18,
              background: on ? p[3] : 'var(--text-dim)', boxShadow: on ? '0 0 12px ' + p[3] : 'none'
            }
          };
        });
        const ip = IRON[st.ironPick] || IRON[0];
    
        const bc = BIT_COLOR[st.bitMood] || BIT_COLOR.idle;
    
        return {
          rm: this.props.reduceMotion ? '1' : '0',
          fxAttr: st.fx ? 'on' : 'off',
          fxOn: st.fx,
          fxLabel: st.fx ? 'FX ON' : 'FX OFF',
          toggleFx: this.toggleFx,
          engage: this.engage,
          fxBtn: {
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '10px', letterSpacing: '.16em',
            padding: '8px 13px', borderRadius: '8px', cursor: 'pointer', whiteSpace: 'nowrap',
            background: st.fx ? 'rgba(0,249,255,.12)' : 'transparent',
            color: st.fx ? 'var(--cyan)' : 'var(--text-dim)',
            border: '1px solid ' + (st.fx ? 'var(--cyan)' : 'var(--glass-border)'),
            boxShadow: st.fx ? '0 0 18px -6px var(--cyan)' : 'none',
            transition: 'all .25s cubic-bezier(.23,1,.32,1)'
          },
          engageBtn: {
            fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '10px', letterSpacing: '.16em',
            padding: '9px 18px', borderRadius: '8px', cursor: 'pointer', whiteSpace: 'nowrap',
            color: 'var(--on-accent)', border: '1px solid transparent',
            background: 'linear-gradient(100deg, var(--accent), var(--accent-2))',
            boxShadow: '0 0 24px -6px var(--accent-glow)',
            transition: 'filter .25s cubic-bezier(.23,1,.32,1), transform .25s cubic-bezier(.23,1,.32,1)'
          },
          dotSize: 7, termHeight: 330,
          stageRef: this.stageRef, ironRef: this.ironRef, ribbonRef: this.ribbonRef,
          streaks: this.streaks, shock: !!st.shock, hoverSfx: this.hoverSfx, hail: this.hail,
          compareOpen: st.compareOpen, compareExpanded: st.compareOpen ? 'true' : 'false',
          compareLabel: st.compareOpen ? '▾ CLOSE CHANNEL' : '▸ COMPARE NOTES',
          copyEmail: this.copyEmail, copyLabel: st.copied ? '✓ ADDRESS COPIED' : 'COPY EMAIL ADDRESS',
          compareMailto: 'mailto:doug@cashio.us?subject=Comparing%20notes%20%E2%80%94%20ZeusApollo&body=Hi%20Doug%2C%0A%0AI%20found%20your%20ZeusApollo%20work%20and%20wanted%20to%20compare%20notes%20about%3A%0A%0A',
          credly: this.props.credlyUrl || 'https://www.credly.com/users/james-cashio/badges/credly',
          rail: DECKS.map((d, i) => {
            const on = i === st.deck, past = i < st.deck;
            return {
              title: d[1].split(' // ')[1].replace(' ENGAGED', '').replace('CHANNEL OPEN', 'OPEN CHANNEL'),
              go: () => { this.sfx('blip'); this.scrollTo(d[0]); },
              row: { position: 'relative', display: 'block', width: '44px', height: '11px', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' },
              bar: {
                display: 'block', height: '11px', borderRadius: '0 6px 6px 0',
                width: on ? '44px' : past ? '24px' : '15px',
                background: on ? 'linear-gradient(90deg,var(--accent),var(--accent-2))' : past ? 'var(--cyan)' : 'rgba(255,255,255,.16)',
                boxShadow: on ? '0 0 20px -4px var(--accent)' : past ? '0 0 12px -6px var(--cyan)' : 'none',
                opacity: on ? 1 : past ? .55 : .35,
                transition: 'all .45s cubic-bezier(.23,1,.32,1)'
              },
              label: {
                position: 'absolute', left: '53px', top: '50%', transform: 'translateY(-50%)',
                fontFamily: 'var(--font-mono)', fontSize: '8px', letterSpacing: '.22em', whiteSpace: 'nowrap',
                color: 'var(--accent)', pointerEvents: 'none',
                opacity: on ? .95 : 0,
                transition: 'opacity .45s cubic-bezier(.23,1,.32,1)'
              }
            };
          }),
          dragStart: this.dragStart, dragMove: this.dragMove, dragEnd: this.dragEnd,
          starsA: { position: 'absolute', left: 0, top: 0, width: '1px', height: '1px', borderRadius: '50%', boxShadow: this.starsA, opacity: .5, animation: 'za-stars 150s linear infinite alternate' },
          starsB: { position: 'absolute', left: 0, top: 0, width: '2px', height: '2px', borderRadius: '50%', boxShadow: this.starsB, opacity: .75, animation: 'za-stars 90s linear infinite alternate' },
          toast: st.toast,
          deckLabel: (DECKS[st.deck] || DECKS[0])[1].replace(' ENGAGED', ''),
          hudMsg: 'Sovereign AI under human command — every number measured, dated, and published with its limits.',
          hudMsgStyle: {
            flex: '1 1 auto', minWidth: 0, padding: '0 16px',
            fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '.14em',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            color: 'var(--text-dim)', opacity: .55,
            transition: 'color .3s cubic-bezier(.23,1,.32,1), opacity .3s cubic-bezier(.23,1,.32,1)'
          },
          bitLabel: st.bitMsg || 'BIT // DECK GUIDE',
          bitLabelStyle: {
            position: 'absolute', left: '50%', top: 0, width: '156px', marginLeft: '-78px',
            transform: 'translateY(0)', textAlign: 'center',
            fontFamily: 'var(--font-mono)', fontSize: st.bitMsg ? '9px' : '8.5px',
            lineHeight: 1.5, letterSpacing: st.bitMsg ? '.1em' : '.2em',
            color: bc[2],
            textShadow: '0 0 12px ' + bc[1], opacity: .96,
            transition: 'color .3s cubic-bezier(.23,1,.32,1), font-size .2s'
          },
          bitMsg: st.bitMsg,
          bitSpiky: st.bitMood !== 'idle',
          bitPoke: this.bitPoke,
          bitBtn: { position: 'relative', width: '124px', height: '144px', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', transition: 'opacity .3s cubic-bezier(.23,1,.32,1), transform .3s cubic-bezier(.23,1,.32,1)', opacity: st.bitMood === 'idle' ? .82 : 1 },
          bitCanvas: this.bitCanvas,
          bitAura: {
            position: 'absolute', left: '50%', top: '50%', width: '78%', height: '78%',
            margin: 0, transform: 'translate(-50%,-50%)', borderRadius: '50%', pointerEvents: 'none',
            border: '1px solid ' + bc[1], background: 'radial-gradient(circle, ' + bc[1] + ', transparent 64%)',
            boxShadow: '0 0 22px ' + bc[1] + ', inset 0 0 20px ' + bc[1], transition: 'border-color .3s, box-shadow .3s',
            animation: 'za-auraPulse 2.6s ease-in-out infinite'
          },
          bitVars: { '--bit-color': bc[0], '--bit-glow': bc[1], position: 'absolute', left: '50%', top: '22px', width: '112px', height: '112px', marginLeft: '-56px', transform: 'translateZ(0)', willChange: 'transform', backfaceVisibility: 'hidden' },
          bitBloom: { position: 'absolute', left: '50%', top: '50%', width: '168px', height: '168px', margin: '-84px 0 0 -84px', borderRadius: '50%', pointerEvents: 'none', background: 'radial-gradient(circle, ' + bc[1] + ' 0%, ' + bc[1] + ' 16%, transparent 62%)', filter: 'blur(16px)', transform: 'translateZ(0)', transition: 'background .35s cubic-bezier(.23,1,.32,1)' },
          bitBob: { position: 'absolute', inset: 0, willChange: 'transform', animation: st.bitMood === 'no' ? 'za-bitjitter .45s linear infinite' : 'za-bitbob 3.8s ease-in-out infinite' },
          bitSpin: { position: 'absolute', left: '50%', top: '50%', width: 0, height: 0, transformStyle: 'preserve-3d', animation: 'za-bitspin ' + (st.bitMood === 'idle' ? '14s' : '1.8s') + ' linear infinite' },
          snd: st.snd,
          sndLabel: st.snd ? 'SND ON' : 'SND OFF',
          toggleSound: this.toggleSound,
          sndBtn: {
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '10px', letterSpacing: '.16em',
            padding: '8px 13px', borderRadius: '8px', cursor: 'pointer', whiteSpace: 'nowrap',
            background: st.snd ? 'rgba(0,255,159,.12)' : 'transparent',
            color: st.snd ? 'var(--green)' : 'var(--text-dim)',
            border: '1px solid ' + (st.snd ? 'var(--green)' : 'var(--glass-border)'),
            boxShadow: st.snd ? '0 0 18px -6px var(--green)' : 'none',
            transition: 'all .25s cubic-bezier(.23,1,.32,1)'
          },
          clock: st.clock, sd: st.sd,
          alert: st.alert, warp: st.warp,
          showBoot: !st.hidBoot,
          bootShown: BOOT.slice(0, st.bootStep).map(b => ({
            t: b[0],
            line: b[1] + ' ' + '.'.repeat(Math.max(3, 34 - b[1].length)) + ' ' + b[2],
            style: { fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '.08em', color: b[3], lineHeight: 1.9, animation: 'za-rise .3s cubic-bezier(.23,1,.32,1) both' }
          })),
          bootStyle: {
            position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--void)', opacity: st.booted ? 0 : 1, pointerEvents: st.booted ? 'none' : 'auto',
            transition: 'opacity .85s cubic-bezier(.23,1,.32,1)'
          },
          skip: this.skip,
          statusText: st.alert ? '⚠ RED ALERT' : '● ALL SYSTEMS NOMINAL',
          statusPill: {
            fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '.16em', whiteSpace: 'nowrap',
            padding: '4px 10px', borderRadius: '999px',
            border: '1px solid ' + (st.alert ? 'var(--red)' : 'var(--green)'),
            color: st.alert ? 'var(--red)' : 'var(--green)',
            background: st.alert ? 'rgba(255,0,51,.1)' : 'rgba(0,255,159,.07)',
            boxShadow: '0 0 16px -6px ' + (st.alert ? 'var(--red)' : 'var(--green)')
          },
          alertLabel: st.alert ? 'STAND DOWN' : 'RED ALERT',
          alertBtn: {
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '10px', letterSpacing: '.16em',
            padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', whiteSpace: 'nowrap',
            background: st.alert ? 'var(--red)' : 'transparent',
            color: st.alert ? '#12000a' : 'var(--red)',
            border: '1px solid var(--red)', transition: 'all .25s cubic-bezier(.23,1,.32,1)'
          },
          toggleAlert: this.toggleAlert,
          goGrid: this.goGrid, goConsole: this.goConsole,
          nodes, activeNode, lanes, activeLane,
          iron, ironCount: st.ironOn.length,
          ironState: st.ironOn.length === 6 ? 'SET COMPLETE' : st.ironOn.length ? 'LIFTING' : 'ARMED',
          ironActive: { name: ip[0], tag: ip[1], body: ip[2] },
          rackSet: this.rackSet,
          builds: BUILDS.map(b => ({ no: b[0], cat: b[1], name: b[2], desc: b[3], metric: b[4], metricLabel: b[5], color: b[6], icon: b[7], hue: b[8] })),
          termLines: st.term.map(l => ({
            text: l.t,
            style: { color: lineColor[l.k] || 'var(--text-dim)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '13px', lineHeight: 1.65 }
          })),
          onKey: this.onKey,
          termWrap: this.termWrap,
          chips: ['status', 'fleet', 'routes', 'cost', 'iron', 'builds', 'whoami', 'make it so'].map(c => ({ label: c, run: () => this.run(c) }))
        };
      }
    }
    return Component;
  };
})();
