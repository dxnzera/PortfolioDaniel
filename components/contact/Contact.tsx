"use client";

import { useState } from "react";
import { profile } from "@/data/profile";
import Image from "next/image";
import SocialIcon from "@/components/ui/SocialIcon";
import PhotoCollage from "@/components/hero/PhotoCollage";
import SectionAtmosphere from "@/components/background/SectionAtmosphere";
import danielLogo from "@/public/images/DanielMendesLogo.png";

export default function Contact() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
    } catch {
      window.location.href = `mailto:${profile.email}`;
    }
  };

  return (
    <section className="contact" id="contact" aria-labelledby="contact-title">
      <SectionAtmosphere variant="contact" />
      <div className="contact-main">
        <div className="contact-copy">
          <h2 id="contact-title"><span>Que tal</span><span>um papo?</span></h2>
        </div>
        <div className="contact-details">
          <div className="email-group">
            <span className="eyebrow">Mande um email</span>
            <a className="email-link" href={`mailto:${profile.email}`}><SocialIcon name="email" />{profile.email}</a>
            <button className="copy-email" onClick={copy} aria-label="Copiar endereço de email">{copied ? "Copiado" : "Copiar email"}</button>
            <span className="sr-only" role="status" aria-live="polite">{copied ? "Endereço de email copiado." : ""}</span>
          </div>
          <div className="social-links">
            <a className="text-link" href={profile.github} target="_blank" rel="noopener noreferrer"><SocialIcon name="github" />GitHub</a>
            <a className="text-link" href={profile.linkedin} target="_blank" rel="noopener noreferrer"><SocialIcon name="linkedin" />LinkedIn</a>
          </div>
        </div>
        <PhotoCollage className="contact-collage" decorative sizes="(max-width: 523px) 42vw, (max-width: 767px) 220px, (max-width: 1100px) 260px, 350px" />
        <a className="contact-arrow" href={`mailto:${profile.email}`} aria-label="Enviar email para Daniel Mendes" data-cursor="conversar">
          <svg className="contact-button-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </a>
      </div>
      <footer className="footer"><Image className="footer-logo" src={danielLogo} alt="Daniel Mendes" sizes="(max-width: 767px) 70px, 110px" /><span>© {new Date().getFullYear()} Daniel Mendes</span><a className="back-top" href="#hero">Voltar ao início</a></footer>
    </section>
  );
}
