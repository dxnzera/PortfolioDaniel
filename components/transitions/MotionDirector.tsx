"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function MotionDirector() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add({ reduced: "(prefers-reduced-motion: reduce)", short: "(max-height: 599px)", motion: "(prefers-reduced-motion: no-preference)" }, (context) => {
      const intro = document.querySelector<HTMLElement>(".projects-intro");
      const heading = intro?.querySelector<HTMLElement>(".projects-heading");
      const gallery = document.querySelector<HTMLElement>(".projects-stage");
      if (!intro || !heading || !gallery) return;
      if (context.conditions?.reduced || context.conditions?.short) {
        intro.classList.add("is-static");
        return () => intro.classList.remove("is-static");
      }

      intro.classList.add("is-transition");
      const reveal = gsap.timeline({
        scrollTrigger: { trigger: intro, start: "top top", end: () => "+=" + window.innerHeight * .95, pin: true, pinSpacing: false, scrub: .6, invalidateOnRefresh: true, anticipatePin: 1 },
      });
      reveal.fromTo(heading, { y: 42, opacity: 0, filter: "blur(18px)", scale: 1.03 }, { y: 0, opacity: 1, filter: "blur(0px)", scale: 1, duration: .3, ease: "power2.out" }, 0)
        .to(heading, { y: -32, opacity: 0, filter: "blur(16px)", scale: .98, duration: .22, ease: "power2.in" }, .58)
        .fromTo(gallery, { opacity: 0 }, { opacity: 1, duration: .22, ease: "power2.out" }, .78);
      gsap.from(".contact-heading h2", { y: 35, opacity: .2, duration: 1, scrollTrigger: { trigger: ".contact", start: "top 80%", end: "top 35%", scrub: .7 } });
      return () => intro.classList.remove("is-transition");
    });
    return () => media.revert();
  }, []);

  return null;
}
