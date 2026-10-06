"use client";

import { useEffect, useRef } from "react";

export default function EditorialScene() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const glow = glowRef.current;
    const container = glow?.parentElement;
    if (!glow || !container) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let inView = false;
    let animation: Animation | undefined;

    const syncAnimation = () => {
      if (motionQuery.matches) {
        animation?.cancel();
        animation = undefined;
        return;
      }

      if (!inView || document.hidden) {
        animation?.pause();
        return;
      }

      if (!animation && typeof glow.animate === "function") {
        // The browser moves a painted gradient; no per-frame JavaScript is needed.
        animation = glow.animate(
          [
            { transform: "translate(-5%, 4%)" },
            { transform: "translate(5%, -4%)" },
          ],
          {
            duration: 14000,
            direction: "alternate",
            easing: "ease-in-out",
            iterations: Infinity,
          },
        );
      }
      animation?.play();
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        syncAnimation();
      },
      { threshold: 0.01 },
    );

    observer.observe(container);
    document.addEventListener("visibilitychange", syncAnimation);
    motionQuery.addEventListener("change", syncAnimation);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", syncAnimation);
      motionQuery.removeEventListener("change", syncAnimation);
      animation?.cancel();
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        opacity: 0.35,
      }}
    >
      <div
        ref={glowRef}
        style={{
          position: "absolute",
          inset: "-10%",
          background:
            "radial-gradient(circle at 68% 61%, rgb(104 154 255 / .04), rgb(104 154 255 / .025) 25%, rgb(104 154 255 / .005) 55%, transparent 75%)",
        }}
      />
    </div>
  );
}
