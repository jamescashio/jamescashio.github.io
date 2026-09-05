import { useEffect, useRef, useState } from "react";

export function useMotionPreference() {
  const [reduced, setReduced] = useState(false);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduced(query.matches);
    change();
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);
  return { motion: !reduced && !paused, reduced, paused, setPaused };
}

export function useInteractionSound() {
  const [sound, setSound] = useState(false);
  const context = useRef<AudioContext | null>(null);
  useEffect(
    () => () => {
      void context.current?.close();
    },
    [],
  );
  function play(force = false) {
    if (!sound && !force) return;
    try {
      context.current ??= new AudioContext();
      const audio = context.current;
      void audio.resume().catch(() => {});
      const gain = audio.createGain();
      gain.gain.setValueAtTime(0, audio.currentTime);
      gain.gain.linearRampToValueAtTime(0.035, audio.currentTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.4);
      gain.connect(audio.destination);
      for (const frequency of [220, 330]) {
        const oscillator = audio.createOscillator();
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        oscillator.connect(gain);
        oscillator.start();
        oscillator.stop(audio.currentTime + 0.42);
      }
      setTimeout(() => gain.disconnect(), 500);
    } catch {
      setSound(false);
    }
  }
  function toggle() {
    if (sound) {
      setSound(false);
      void context.current?.suspend();
    } else {
      setSound(true);
      play(true);
    }
  }
  return { sound, toggle, play };
}

export function useSectionVisibility() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.target.classList.toggle("is-visible", entry.isIntersecting)),
      { threshold: 0.06 },
    );
    document.querySelectorAll(".o-scene").forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);
}
