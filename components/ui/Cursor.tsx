"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export default function Cursor() {
  const cursor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const media = gsap.matchMedia();
    media.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
      const el = cursor.current;
      if (!el) return;
      const x = gsap.quickTo(el, "x", { duration: 0.24, ease: "power3" });
      const y = gsap.quickTo(el, "y", { duration: 0.24, ease: "power3" });
      const move = (event: PointerEvent) => {
        x(event.clientX); y(event.clientY);
        el.classList.add("is-visible");
        const target = event.target as HTMLElement;
        const interactive = target.closest<HTMLElement>("a, button, [data-cursor]");
        el.classList.toggle("is-active", Boolean(interactive));
        const label = el.querySelector("span");
        if (label) label.textContent = interactive?.dataset.cursor === "small" ? "" : interactive?.dataset.cursor || "";
      };
      const leave = () => el.classList.remove("is-visible");
      window.addEventListener("pointermove", move, { passive: true });
      document.addEventListener("pointerleave", leave);
      return () => { window.removeEventListener("pointermove", move); document.removeEventListener("pointerleave", leave); gsap.killTweensOf(el); };
    });
    return () => media.revert();
  }, []);

  return <div className="custom-cursor" ref={cursor} aria-hidden="true"><i /><span /></div>;
}
