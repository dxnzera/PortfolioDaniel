"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

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
    <header className="navigation">
      <a className="header-logo" href="#hero" aria-label="Voltar ao início do portfólio">
        <Image className="header-symbol" src="/images/daniel-favicon.png" alt="" width={56} height={56} loading="eager" />
      </a>
      <div className="header-progress" aria-hidden="true"><span ref={progressRef} /></div>
    </header>
  );
}
