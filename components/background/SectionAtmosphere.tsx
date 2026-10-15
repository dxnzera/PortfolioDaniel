"use client";

import { useEffect, useRef } from "react";

export default function SectionAtmosphere({ variant }: { variant: "intro" | "projects" | "contact" }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const atmosphere = ref.current;
    if (!atmosphere) return;
    let visible = false;
    const sync = () => { atmosphere.dataset.paused = String(!visible || document.hidden); };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(atmosphere);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  return (
    <div ref={ref} className={`section-atmosphere atmosphere-${variant}`} aria-hidden="true" data-paused="true">
      <div className="section-room" />
      <div className="section-light" />
      <div className="section-architecture" />
      <div className="section-depth" />
      <div className="section-shade" />
    </div>
  );
}
