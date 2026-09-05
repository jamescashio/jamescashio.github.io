import { useEffect, useRef, useState } from "react";

/** The owner's original mark, with its GIF energy sweep governed by the site's motion control. */
export function BrandMark({ motion }: { motion: boolean }) {
  const frame = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(true), 1400);
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1];
      if (entry) setVisible(entry.isIntersecting);
    });
    if (frame.current) observer.observe(frame.current);
    const change = () => setPageVisible(!document.hidden);
    change();
    document.addEventListener("visibilitychange", change);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
      document.removeEventListener("visibilitychange", change);
    };
  }, []);
  const animated = motion && visible && pageVisible && settled;
  return (
    <span ref={frame} className="cashio-brand-mark" data-animated={animated ? "true" : "false"}>
      <img
        src={animated ? "/brand/cashio-logo-animated.gif" : "/brand/cashio-logo-still.png"}
        width="520"
        height="169"
        alt="Cashio AI"
        decoding="async"
      />
    </span>
  );
}
