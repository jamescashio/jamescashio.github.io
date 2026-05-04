(() => {
  // Silent visual-only v19.1 effects. No AudioContext, no speech synthesis, no hum.
  const boot = document.getElementById('boot');
  setTimeout(() => boot && boot.classList.add('hidden'), 1450);

  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const end = new Date(now.getFullYear() + 1, 0, 1);
  const stardate = (now.getFullYear() + (now - start) / (end - start)).toFixed(3);
  const sd = document.getElementById('stardate');
  if (sd) sd.textContent = 'STARDATE ' + stardate;

  const canvas = document.getElementById('starfield');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let stars = [], scrollSpeed = 0, lastY = window.scrollY;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resize(){
      const dpr = window.devicePixelRatio || 1;
      canvas.width = innerWidth * dpr;
      canvas.height = innerHeight * dpr;
      canvas.style.width = innerWidth + 'px';
      canvas.style.height = innerHeight + 'px';
      ctx.setTransform(dpr,0,0,dpr,0,0);
      const count = Math.max(140, Math.floor(innerWidth * innerHeight / 6500));
      stars = Array.from({length:count},()=>({
        x:Math.random()*innerWidth,
        y:Math.random()*innerHeight,
        z:Math.random()*1+.2,
        r:Math.random()*1.25+.35,
        c:Math.random()>.72?'rgba(0,249,255,':'rgba(255,255,255,'
      }));
    }

    function draw(){
      if(!reduce) requestAnimationFrame(draw);
      ctx.clearRect(0,0,innerWidth,innerHeight);
      scrollSpeed *= .92;
      for(const s of stars){
        const speed = (.08 + s.z*.18) + Math.min(18,scrollSpeed)*s.z;
        s.y += speed;
        if(s.y > innerHeight + 20){ s.x = Math.random()*innerWidth; s.y = -10; s.z = Math.random()*1+.2; }
        ctx.beginPath();
        ctx.fillStyle = s.c + (.20 + s.z*.52) + ')';
        ctx.arc(s.x,s.y,s.r*s.z,0,Math.PI*2);
        ctx.fill();
        if(scrollSpeed > 2){
          ctx.strokeStyle = s.c + Math.min(.48,scrollSpeed*.03) + ')';
          ctx.beginPath();
          ctx.moveTo(s.x,s.y);
          ctx.lineTo(s.x,s.y-scrollSpeed*s.z*4);
          ctx.stroke();
        }
      }
    }

    addEventListener('resize', resize);
    addEventListener('scroll', () => {
      const delta = Math.abs(scrollY - lastY);
      scrollSpeed = Math.min(20, scrollSpeed + delta * .045);
      lastY = scrollY;
    }, {passive:true});
    resize(); if(!reduce) draw();
  }

  const glyphs = '∆ΩЖΞ▒░▓λΦДЖ010110ᚠᚱᚷᛟ';
  function decode(el){
    const target = el.dataset.text || el.textContent;
    let frame = 0, total = 24;
    function tick(){
      frame++;
      el.textContent = target.split('').map((ch,i)=>{
        if(ch===' ') return ' ';
        return i < Math.floor((frame/total)*target.length) ? ch : glyphs[Math.floor(Math.random()*glyphs.length)];
      }).join('');
      if(frame < total) requestAnimationFrame(tick); else el.textContent = target;
    }
    tick();
  }
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if(e.isIntersecting && !e.target.dataset.decoded){ e.target.dataset.decoded = 'true'; decode(e.target); }
  }), {threshold:.45});
  document.querySelectorAll('.decode').forEach(el => io.observe(el));

  document.querySelectorAll('.card,.theater-card,.proof,.panel,.command,.lab-map').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      card.style.transform = `perspective(900px) rotateX(${(-y*2.2).toFixed(2)}deg) rotateY(${(x*2.2).toFixed(2)}deg) translateY(-2px)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
})();
