import type { PageHost } from "./page-model";
import type { HeroEnhancement } from "./hero-enhancement";
import type { HeroCommand, HeroReply } from "./hero-worker-model";
import { conservesData } from "./media-policy";

// Texture decoding and GPU setup stay off the page's animation thread. The
// existing hero clock sends at most one frame at a time; no worker loop can leak.
export async function createLivingHero(
  app: PageHost,
  hero: HTMLElement,
  camera: HTMLElement,
): Promise<HeroEnhancement | null> {
  const poster = camera.querySelector<HTMLImageElement>(".hero-live-poster");
  if (!poster || !HTMLCanvasElement.prototype.transferControlToOffscreen) return null;
  const canvas = document.createElement("canvas");
  canvas.className = "living-hero-canvas";
  canvas.setAttribute("aria-hidden", "true");
  const worker = new Worker(new URL("./living-hero.worker.ts", import.meta.url), { type: "module" });
  let lost = false;
  let busy = false;
  const post = (message: HeroCommand, transfer: Transferable[] = []) => worker.postMessage(message, transfer);
  const size = () => ({ width: camera.clientWidth, height: camera.clientHeight, density: devicePixelRatio });
  const desktop = matchMedia("(min-width: 1000px) and (hover: hover) and (pointer: fine)");
  const active = () =>
    !lost &&
    desktop.matches &&
    !app.reduce &&
    !document.hidden &&
    app.heroVisible !== false &&
    app.state.scene === "orbit" &&
    !conservesData();
  // Keep the original image painted beneath the opaque scene for instant fallback.
  // Instruments stay in the same SVG before, during and after GPU enhancement.
  const originals = [document.getElementById("hero-stars")];
  const observer = new ResizeObserver(() => {
    if (!lost) post({ type: "resize", size: size() });
  });
  const dispose = () => {
    if (lost) return;
    lost = true;
    observer.disconnect();
    worker.terminate();
    canvas.remove();
    originals.forEach((element) => element?.classList.remove("living-poster-replaced"));
    hero.removeAttribute("data-living-hero");
  };
  const ready = await new Promise<boolean>((resolve) => {
    const timeout = setTimeout(() => {
      dispose();
      resolve(false);
    }, 12000);
    worker.onmessage = ({ data }: MessageEvent<HeroReply>) => {
      if (data.type === "frame") busy = false;
      else if (data.type === "ready") {
        clearTimeout(timeout);
        resolve(true);
      } else {
        clearTimeout(timeout);
        dispose();
        resolve(false);
      }
    };
    worker.onerror = () => {
      clearTimeout(timeout);
      dispose();
      resolve(false);
    };
    const offscreen = canvas.transferControlToOffscreen();
    post(
      {
        type: "init",
        canvas: offscreen,
        size: size(),
        artwork: poster.currentSrc || poster.src,
        depth: new URL("/v42/observatory-depth.webp", location.href).href,
      },
      [offscreen],
    );
  });
  if (!ready) return null;
  camera.append(canvas);
  originals.forEach((element) => element?.classList.add("living-poster-replaced"));
  observer.observe(camera);
  hero.dataset.livingHero = "ready";
  return {
    active,
    render(time, pointer) {
      if (!active() || busy) return;
      busy = true;
      post({ type: "frame", time, x: pointer.x, y: pointer.y });
    },
    dispose,
  };
}
