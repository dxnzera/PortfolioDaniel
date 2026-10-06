"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { avatarConfig } from "@/data/avatar";
import EditorialScene from "@/components/three/EditorialScene";

const AvatarScene = dynamic(() => import("@/components/three/AvatarScene"), { ssr: false });

function Lyrics({ lines }: { lines: string[] }) {
  return (
    <p className="story-lyrics">
      {lines.map((line, index) => (
        <span className="lyric-line" key={index}>
          {line.split(" ").map((word, wordIndex) => <span className="lyric-word" key={wordIndex}>{word}{" "}</span>)}
        </span>
      ))}
    </p>
  );
}

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;
    let disposed = false;
    const media = gsap.matchMedia();

    media.add({ reduced: "(prefers-reduced-motion: reduce)", mobile: "(max-width: 767px), (max-width: 1100px) and (orientation: portrait)", short: "(max-height: 599px)", motion: "(prefers-reduced-motion: no-preference)" }, (context) => {
      const { reduced, mobile, short } = context.conditions!;
      const beats = Array.from(section.querySelectorAll<HTMLElement>(".story-beat"));
      const avatar = section.querySelector<HTMLElement>(".story-avatar")!;
      const text = section.querySelector<HTMLElement>(".story-text")!;
      const renderAvatar = () => section.querySelector(".avatar-canvas")?.dispatchEvent(new Event("avatar:render"));
      stage.dataset.activeBeat = "0";
      section.dataset.storyProgress = "0";
      section.dataset.avatarTurn = String(avatarConfig.poses[0]);
      renderAvatar();

      if (reduced || short) {
        stage.classList.add("is-static");
        beats.forEach((beat) => beat.removeAttribute("aria-hidden"));
        return () => stage.classList.remove("is-static");
      }

      stage.classList.remove("is-static");
      const developmentAvatarShift = () => mobile ? 0 : window.innerWidth * .36;
      const developmentTextShift = () => mobile ? 0 : -window.innerWidth * .38;
      const pose = { yaw: avatarConfig.poses[0] };
      let currentBeat = -1;
      const updateBeat = (progress: number) => {
        const activeBeat = Math.min(3, Math.floor(progress * 5));
        section.dataset.storyProgress = progress.toFixed(4);
        section.style.setProperty("--story-progress", String(progress));
        section.dataset.avatarTurn = String(pose.yaw);
        renderAvatar();
        stage.dataset.storyPhase = progress >= .8 ? "handoff" : "presentation";
        if (activeBeat === currentBeat) return;
        currentBeat = activeBeat;
        stage.dataset.activeBeat = String(activeBeat);
        beats.forEach((beat, index) => beat.setAttribute("aria-hidden", String(index !== activeBeat)));
      };

      gsap.set(beats, { yPercent: mobile ? 0 : -50 });
      gsap.set(beats.slice(1), { autoAlpha: 0, y: 24 });
      gsap.set(beats[0], { autoAlpha: 1, y: 0 });
      const timeline = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => "+=" + window.innerHeight * (mobile ? 4.2 : 4.8),
          pin: stage,
          scrub: .7,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      for (let index = 1; index < beats.length; index++) {
        const start = index - .25;
        const development = index === 1;
        timeline.to(beats[index - 1], { autoAlpha: 0, y: -24, filter: "blur(7px)", duration: .23 }, start)
          .to(avatar, { x: development ? developmentAvatarShift : 0, y: development && !mobile ? -12 : 0, duration: .7 }, start)
          .to(text, { x: development ? developmentTextShift : 0, y: development && !mobile ? -12 : 0, duration: .56 }, start)
          .to(pose, { yaw: avatarConfig.poses[index], duration: .7 }, start)
          .fromTo(beats[index], { autoAlpha: 0, y: 24, filter: "blur(7px)" }, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: .35 }, index + .03)
          .fromTo(beats[index].querySelectorAll(".lyric-word"), { color: "#626266" }, { color: "#f0ede5", duration: .18, stagger: index === beats.length - 1 ? { amount: .1 } : .032, ease: "none" }, index + .1);
      }
      timeline.to({}, { duration: .52 }, 3.48);
      timeline.to(avatar, { autoAlpha: 0, y: mobile ? -50 : -38, scale: .97, filter: "blur(12px)", duration: .6 }, 4.04)
        .to(beats[3], { autoAlpha: 0, y: -24, filter: "blur(12px)", duration: .45 }, 4.08)
        .to({}, { duration: .05 }, 4.95);
      timeline.eventCallback("onUpdate", () => updateBeat(timeline.progress()));
      updateBeat(0);
      const arrival = gsap.timeline({ defaults: { ease: "power3.out", duration: 1.1 } });
      arrival.from(".avatar-arrival", { y: 30, opacity: 0 }, 0)
        .from(".greeting-arrival", { y: 20, opacity: 0 }, .12);

      return () => {
        arrival.kill();
        section.style.removeProperty("--story-progress");
        section.dataset.avatarTurn = String(avatarConfig.poses[0]);
        renderAvatar();
        beats.forEach((beat) => beat.removeAttribute("aria-hidden"));
      };
    }, section);

    document.fonts.ready.then(() => { if (!disposed) ScrollTrigger.refresh(); });
    return () => { disposed = true; media.revert(); };
  }, []);

  return (
    <section className="story-section" id="hero" ref={sectionRef} aria-label="Apresentação de Daniel Mendes">
      <div className="story-stage" ref={stageRef} data-active-beat="0">
        <div className="story-ambient" aria-hidden="true"><EditorialScene /></div>

        <div className="story-avatar" role="img" aria-label="Modelo 3D de Daniel Mendes trabalhando em um notebook" data-model-state="loading">
          <div className="avatar-arrival">
            <Image className="avatar-fallback" src="/images/avatar-daniel-light-poster.webp" alt="" fill loading="eager" sizes="(max-width: 767px) 88vw, (max-width: 1100px) and (orientation: portrait) 84vw, 40vw" />
            <AvatarScene />
          </div>
        </div>

        <div className="story-text">
          <div className="story-beat" data-beat="0">
            <div className="greeting-arrival">
              <h1 id="hero-title" aria-label="Olá, me chamo Daniel Mendes"><span className="story-greeting">Olá, me chamo</span><Image className="story-logo" src="/images/DanielMendesBranco.svg" alt="Daniel Mendes" width={2388} height={1454} preload sizes="(max-width: 767px) 270px, (max-width: 1100px) 420px, 460px" /></h1>
              <p className="story-role">Desenvolvedor front-end & designer.</p>
            </div>
          </div>
          <div className="story-beat" data-beat="1" aria-hidden="true">
            <Lyrics lines={["Desenvolvimento", "em TypeScript", "com React."]} />
            <p className="story-detail">Sempre disposto a aprender novas linguagens e frameworks.</p>
            <div className="story-tech"><span>React</span><span>TypeScript</span><span>Next.js</span><span>Swift</span></div>
          </div>
          <div className="story-beat" data-beat="2" aria-hidden="true">
            <Lyrics lines={["Mais de dez anos", "na área de design."]} />
            <p className="story-detail">Essa experiência traz um olhar mais crítico para o desenvolvimento.</p>
          </div>
          <div className="story-beat" data-beat="3" aria-hidden="true">
            <Lyrics lines={["Análise e Desenv.", "de Sistemas pela", "Uniube"]} />
            <p className="story-detail">Tecnólogo em Análise e Desenvolvimento de Sistema - Uniube (2024-2026).</p>
          </div>
        </div>

      </div>
    </section>
  );
}
