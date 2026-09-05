import { useEffect, useRef } from "react";

export function Core({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 110" fill="none" aria-hidden="true">
      <path d="M50 4 88 29 94 72 50 104 6 72 12 29Z" fill="currentColor" fillOpacity=".04" stroke="currentColor" />
      <path
        d="m50 4-17 38 17 22 17-22Zm-38 25 21 13L6 72m82-43L67 42l27 30M6 72l44-8 44 8m-44-8v40M33 42l-3 45m37-45 3 45"
        stroke="currentColor"
        strokeOpacity=".75"
      />
      <path d="m50 4 17 38-17 22-17-22Z" fill="currentColor" fillOpacity=".2" />
      <path d="m50 64 44 8-44 32Z" fill="currentColor" fillOpacity=".12" />
    </svg>
  );
}

export function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d={diagonal ? "M5 19 19 5M5 5h14v14" : "M4 12h15m-6-6 6 6-6 6"} />
    </svg>
  );
}

/** One small, visibility-aware canvas. No render loop when calm or off screen. */
export function Starfield({ motion, folding }: { motion: boolean; folding: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const fold = useRef(folding);
  useEffect(() => {
    fold.current = folding;
  }, [folding]);
  useEffect(() => {
    const canvas = ref.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || !motion) return;
    const hero = canvas.closest<HTMLElement>(".o-hero");
    let width = 0,
      height = 0,
      frame = 0,
      last = 0,
      visible = true;
    const stars = Array.from({ length: 66 }, (_, i) => ({
      x: ((i * 137.508) % 997) / 997,
      y: ((i * 293.11) % 991) / 991,
      z: 0.25 + (i % 9) / 12,
    }));
    function resize() {
      const box = canvas!.getBoundingClientRect();
      width = box.width;
      height = box.height;
      const ratio = Math.min(devicePixelRatio, 1.5);
      canvas!.width = width * ratio;
      canvas!.height = height * ratio;
      context!.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    function draw(time: number) {
      if (!visible || document.hidden) {
        frame = 0;
        return;
      }
      frame = requestAnimationFrame(draw);
      if (time - last < 32) return;
      const delta = Math.min(time - last, 64);
      last = time;
      context!.clearRect(0, 0, width, height);
      const originX = parseFloat(hero?.style.getPropertyValue("--eh-core-x") || "") || width * 0.74;
      const originY = parseFloat(hero?.style.getPropertyValue("--eh-core-y") || "") || height * 0.44;
      for (const star of stars) {
        star.x += delta * 0.000003 * star.z;
        if (star.x > 1) star.x = 0;
        const x = star.x * width,
          y = star.y * height;
        context!.strokeStyle = `rgba(163,223,239,${0.1 + star.z * 0.35})`;
        context!.lineWidth = star.z;
        context!.beginPath();
        context!.moveTo(x, y);
        context!.lineTo(x + (fold.current ? (x - originX) * 0.15 : 0.6), y + (fold.current ? (y - originY) * 0.15 : 0));
        context!.stroke();
      }
    }
    function resume() {
      if (!frame && visible && !document.hidden) {
        last = performance.now();
        frame = requestAnimationFrame(draw);
      }
    }
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1];
      if (!entry) return;
      visible = entry.isIntersecting;
      resume();
    });
    const size = new ResizeObserver(resize);
    resize();
    size.observe(canvas);
    observer.observe(canvas);
    resume();
    document.addEventListener("visibilitychange", resume);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      size.disconnect();
      document.removeEventListener("visibilitychange", resume);
      context.clearRect(0, 0, width, height);
    };
  }, [motion]);
  return <canvas ref={ref} className="o-stars" aria-hidden="true" />;
}
