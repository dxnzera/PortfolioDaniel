"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import SocialIcon from "@/components/ui/SocialIcon";
import { profile } from "@/data/profile";
import danielSymbol from "@/public/images/daniel-favicon.png";

export default function Navigation() {
  const progressRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const distance = document.documentElement.scrollHeight - window.innerHeight;
        if (progressRef.current) progressRef.current.style.transform = "scaleX(" + (distance ? window.scrollY / distance : 0) + ")";
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { window.removeEventListener("scroll", update); window.removeEventListener("resize", update); cancelAnimationFrame(frame); };
  }, []);

  return (
    <>
      <header className="navigation">
        <a className="header-logo" href="#hero" aria-label="Voltar ao início do portfólio">
          <Image className="header-symbol" src={danielSymbol} alt="" sizes="(max-width: 767px) 56px, 80px" loading="eager" />
        </a>
        <nav className="header-socials" aria-label="Redes sociais">
          <a href={profile.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub de Daniel Mendes"><SocialIcon name="github" /></a>
          <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn de Daniel Mendes"><SocialIcon name="linkedin" /></a>
        </nav>
        <div className="header-progress" aria-hidden="true"><span ref={progressRef} /></div>
      </header>
      <div className="scroll-hint p-5">
        <span>Role para explorar</span>
        <svg viewBox="0 0 12 16" fill="none" aria-hidden="true"><path d="M6 1v13m-4-4 4 4 4-4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
    </>
  );
}
