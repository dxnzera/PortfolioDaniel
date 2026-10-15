"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { avatarConfig } from "@/data/avatar";

export default function EditorialScene() {
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    const section = scene?.closest<HTMLElement>(".story-section");
    const avatar = section?.querySelector<HTMLElement>(".story-avatar");
    const text = section?.querySelector<HTMLElement>(".story-text");
    const stage = section?.querySelector<HTMLElement>(".story-stage");
    if (!scene || !section || !avatar || !stage) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const portraitQuery = window.matchMedia("(max-width: 767px), (max-width: 1100px) and (orientation: portrait)");
    const syncScene = () => {
      const progress = Number(section.dataset.storyProgress || 0);
      const staticScene = motionQuery.matches || stage.classList.contains("is-static");
      // Use the hero's eased position and turn: one scroll controls foreground and camera.
      const shift = staticScene ? 0 : Number(gsap.getProperty(avatar, "x")) || 0;
      const turn = Number(section.dataset.avatarTurn ?? avatarConfig.poses[0]) - avatarConfig.poses[0];
      const turnShift = staticScene ? 0 : Math.sin(turn) * window.innerWidth * (portraitQuery.matches ? .1 : .05);
      const cameraRise = staticScene ? 0 : -progress * window.innerHeight * (portraitQuery.matches ? .14 : .1);
      const readingShift = staticScene || !text ? 0 : Number(gsap.getProperty(text, "x")) || 0;
      stage.style.setProperty("--studio-shift", `${shift}px`);
      stage.style.setProperty("--studio-camera-shift", `${shift * .45 + turnShift}px`);
      stage.style.setProperty("--studio-camera-rise", `${cameraRise}px`);
      stage.style.setProperty("--studio-camera-scale", String(staticScene ? 1 : 1 + progress * .04));
      stage.style.setProperty("--studio-reading-shift", `${readingShift}px`);
      stage.style.setProperty("--studio-rise", `${staticScene ? 0 : progress * -24}px`);
      stage.style.setProperty("--studio-foreground-shift", `${staticScene ? 0 : shift * .08 - turnShift * (portraitQuery.matches ? .45 : .85)}px`);
      stage.style.setProperty("--studio-foreground-rise", `${staticScene ? 0 : progress * -12}px`);
      const fade = staticScene ? 0 : Math.max(0, Math.min(1, (progress - .8) / .14));
      stage.style.setProperty("--studio-visibility", String(1 - fade * fade * (3 - 2 * fade)));
    };
    const observer = new MutationObserver(syncScene);
    observer.observe(section, { attributes: true, attributeFilter: ["data-story-progress", "data-avatar-turn"] });
    observer.observe(stage, { attributes: true, attributeFilter: ["class"] });

    let inView = false;
    const syncVisibility = () => {
      scene.dataset.paused = String(!inView || document.hidden || motionQuery.matches);
    };
    const visibility = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      syncVisibility();
    });
    visibility.observe(stage);
    const syncMotion = () => { syncScene(); syncVisibility(); };
    motionQuery.addEventListener("change", syncMotion);
    portraitQuery.addEventListener("change", syncScene);
    window.addEventListener("resize", syncScene, { passive: true });
    document.addEventListener("visibilitychange", syncVisibility);
    syncScene();
    syncVisibility();

    return () => {
      observer.disconnect();
      visibility.disconnect();
      motionQuery.removeEventListener("change", syncMotion);
      portraitQuery.removeEventListener("change", syncScene);
      window.removeEventListener("resize", syncScene);
      document.removeEventListener("visibilitychange", syncVisibility);
      ["shift", "camera-shift", "camera-rise", "camera-scale", "reading-shift", "rise", "foreground-shift", "foreground-rise", "visibility"].forEach((property) => stage.style.removeProperty(`--studio-${property}`));
    };
  }, []);

  return (
    <div ref={sceneRef} className="studio-scene" aria-hidden="true">
      <div className="studio-environment"><div className="studio-room" /></div>
      <div className="studio-reading-shadow" />
      <div className="studio-pool"><div className="studio-breath" /></div>
      <div className="studio-floor" />
      <div className="studio-vignette" />
    </div>
  );
}
