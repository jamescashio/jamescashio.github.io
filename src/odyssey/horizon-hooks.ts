import { useEffect } from "react";

/** Light follows an actual pointer. Geometry and text stay still and readable. */
export function useHeroAtmosphere(motion: boolean) {
  useEffect(() => {
    if (!motion || !matchMedia("(pointer: fine)").matches) return;
    const hero = document.querySelector<HTMLElement>(".o-hero");
    if (!hero) return;
    let frame = 0;
    let x = 0.74,
      y = 0.45;
    const paint = () => {
      frame = 0;
      hero.style.setProperty("--eh-light-x", `${x * hero.clientWidth - 240}px`);
      hero.style.setProperty("--eh-light-y", `${y * hero.clientHeight - 240}px`);
      hero.style.setProperty("--eh-lean-x", `${(y - 0.5) * -12}deg`);
      hero.style.setProperty("--eh-lean-y", `${(x - 0.5) * 16}deg`);
    };
    const move = (event: PointerEvent) => {
      const rect = hero.getBoundingClientRect();
      x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
      hero.classList.add("eh-pointer-active");
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const leave = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      hero.classList.remove("eh-pointer-active");
      hero.style.setProperty("--eh-lean-x", "0deg");
      hero.style.setProperty("--eh-lean-y", "0deg");
    };
    hero.addEventListener("pointermove", move, { passive: true });
    hero.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(frame);
      hero.removeEventListener("pointermove", move);
      hero.removeEventListener("pointerleave", leave);
      leave();
    };
  }, [motion]);
}

/** Artwork, the clickable core, and the fold share one responsive scene coordinate. */
export function useHeroCoreAlignment() {
  useEffect(() => {
    const hero = document.querySelector<HTMLElement>(".o-hero");
    const picture = document.querySelector<HTMLImageElement>(".o-hero-art img");
    const target = document.querySelector<HTMLElement>(".o-core-hotspot");
    if (!hero || !picture || !target) return;
    const align = () => {
      const frame = hero.getBoundingClientRect();
      const rect = picture.getBoundingClientRect();
      const scale = Math.max(rect.width / 1672, rect.height / 941);
      const position = getComputedStyle(picture).objectPosition.split(" ").map(parseFloat);
      const pictureX = 1173 * scale - ((1672 * scale - rect.width) * position[0]) / 100;
      const pictureY = 424 * scale - ((941 * scale - rect.height) * position[1]) / 100;
      const x = rect.left - frame.left + pictureX;
      const y = rect.top - frame.top + pictureY;
      target.style.left = `${x}px`;
      target.style.top = `${y}px`;
      target.style.bottom = "auto";
      hero.style.setProperty("--eh-core-x", `${x}px`);
      hero.style.setProperty("--eh-core-y", `${y}px`);
      picture.style.transformOrigin = `${pictureX}px ${pictureY}px`;
    };
    const observer = new ResizeObserver(align);
    observer.observe(hero);
    observer.observe(picture);
    picture.addEventListener("load", align);
    align();
    return () => {
      observer.disconnect();
      picture.removeEventListener("load", align);
    };
  }, []);
}
