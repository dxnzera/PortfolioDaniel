"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function AmbientSurface() {
  const surfaceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const surface = surfaceRef.current;
    if (!surface) return;
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      // Follow the existing scroll without adding a pin or changing its timing.
      gsap.to(surface.querySelector(".ambient-depth"), {
        xPercent: -8,
        yPercent: -10,
        rotation: 5,
        ease: "none",
        scrollTrigger: { start: 0, end: "max", scrub: 1.2, invalidateOnRefresh: true },
      });
    });
    const syncVisibility = () => { surface.dataset.paused = String(document.hidden); };
    syncVisibility();
    document.addEventListener("visibilitychange", syncVisibility);
    return () => {
      media.revert();
      document.removeEventListener("visibilitychange", syncVisibility);
    };
  }, []);

  return (
    <div ref={surfaceRef} className="ambient-surface" aria-hidden="true">
      <div className="ambient-depth"><div className="ambient-light" /></div>
      <div className="ambient-grain" />
    </div>
  );
}
