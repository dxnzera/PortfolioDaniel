"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { projects } from "../../data/projects";
import SocialIcon from "../ui/SocialIcon";
import { ProjectMedia } from "./ProjectMedia";

const formatIndex = (index: number) => String(index + 1).padStart(2, "0");

function ProjectLinkArrow() {
  return (
    <svg className="project-link-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 19 19 5M5 5h14v14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type GalleryMeasurements = {
  viewportWidth: number;
  distance: number;
  offsets: number[];
  centers: number[];
};

export function ProjectGallery() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);
  const measurementsRef = useRef<GalleryMeasurements | null>(null);
  const activeRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [nativeScroll, setNativeScroll] = useState(true);
  const projectCount = projects.length;

  const updateActive = useCallback((index: number) => {
    if (activeRef.current === index) return;
    activeRef.current = index;
    setActiveIndex(index);
  }, []);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sizeQuery = window.matchMedia("(max-width: 767px), (max-height: 599px)");
    const updateMode = () => {
      setReducedMotion(motionQuery.matches);
      setNativeScroll(motionQuery.matches || sizeQuery.matches);
    };
    updateMode();
    motionQuery.addEventListener("change", updateMode);
    sizeQuery.addEventListener("change", updateMode);
    return () => {
      motionQuery.removeEventListener("change", updateMode);
      sizeQuery.removeEventListener("change", updateMode);
    };
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!section || !stage || !viewport || !track || !projectCount) return;

    const slides = Array.from(track.querySelectorAll<HTMLElement>(".project-slide"));
    // Scroll updates only use these numbers; layout reads happen on resize/refresh.
    const measure = () => {
      const style = window.getComputedStyle(viewport);
      const viewportWidth = viewport.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const offsets = slides.map((slide) => slide.offsetLeft);
      const measurements = {
        viewportWidth,
        distance: Math.max(0, track.scrollWidth - viewportWidth),
        offsets,
        centers: slides.map((slide, index) => offsets[index] + slide.clientWidth / 2),
      };
      measurementsRef.current = measurements;
    };
    measure();
    const updatePosition = (position: number) => {
      const measurements = measurementsRef.current;
      if (!measurements) return;
      const center = position + measurements.viewportWidth / 2;
      let nearestIndex = 0;
      let nearestDistance = Infinity;
      measurements.centers.forEach((slideCenter, index) => {
        const delta = Math.abs(slideCenter - center);
        if (delta < nearestDistance) {
          nearestDistance = delta;
          nearestIndex = index;
        }
      });
      updateActive(nearestIndex);
      if (progressRef.current) {
        const progress = measurements.distance ? position / measurements.distance : 1;
        progressRef.current.style.transform = `scaleX(${Math.max(0, Math.min(1, progress))})`;
      }
    };

    if (nativeScroll) {
      let frame = 0;
      const onScroll = () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => updatePosition(viewport.scrollLeft));
      };
      viewport.addEventListener("scroll", onScroll, { passive: true });
      const resizeObserver = new ResizeObserver(() => {
        measure();
        onScroll();
      });
      resizeObserver.observe(viewport);
      resizeObserver.observe(track);
      updatePosition(viewport.scrollLeft);
      return () => {
        viewport.removeEventListener("scroll", onScroll);
        resizeObserver.disconnect();
        cancelAnimationFrame(frame);
        measurementsRef.current = null;
      };
    }

    gsap.registerPlugin(ScrollTrigger);
    viewport.scrollLeft = 0;
    const context = gsap.context(() => {
      const movement = gsap.to(track, {
        x: () => -(measurementsRef.current?.distance ?? 0),
        ease: "none",
        onUpdate: () => updatePosition(-Number(gsap.getProperty(track, "x"))),
        scrollTrigger: {
          trigger: stage,
          start: "top top",
          end: () => `+=${Math.max(measurementsRef.current?.distance ?? 0, 1)}`,
          pin: true,
          scrub: 0.65,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onRefreshInit: measure,
          onRefresh: (self) => updatePosition(self.progress * (measurementsRef.current?.distance ?? 0)),
        },
      });
      triggerRef.current = movement.scrollTrigger ?? null;

    }, section);

    const resizeObserver = new ResizeObserver(() => ScrollTrigger.refresh());
    resizeObserver.observe(viewport);
    return () => {
      resizeObserver.disconnect();
      triggerRef.current = null;
      context.revert();
      measurementsRef.current = null;
    };
  }, [nativeScroll, projectCount, updateActive]);

  const goToProject = useCallback((index: number) => {
    const viewport = viewportRef.current;
    const measurements = measurementsRef.current;
    if (!viewport || !measurements) return;
    const clampedIndex = Math.max(0, Math.min(projectCount - 1, index));
    const slideOffset = measurements.offsets[clampedIndex];
    if (slideOffset === undefined) return;
    const { distance } = measurements;
    const offset = Math.min(slideOffset, distance);

    if (nativeScroll) {
      viewport.scrollTo({ left: offset, behavior: reducedMotion ? "auto" : "smooth" });
    } else if (triggerRef.current) {
      const trigger = triggerRef.current;
      const progress = distance ? offset / distance : 0;
      window.scrollTo({ top: trigger.start + progress * (trigger.end - trigger.start), behavior: "smooth" });
    }
  }, [nativeScroll, projectCount, reducedMotion]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      goToProject(activeRef.current + (event.key === "ArrowRight" ? 1 : -1));
    }
  };

  if (!projectCount) return null;

  return (
    <section ref={sectionRef} className="projects-section" id="projects" aria-labelledby="projects-title">
      <div className="projects-intro">
        <div className="projects-heading">
          <h2 className="projects-title" id="projects-title" aria-label="Alguns dos meus projetos">Alguns dos meus<br /><span>projetos.</span></h2>
        </div>
      </div>

      <div ref={stageRef} className={`projects-stage${nativeScroll ? " is-native" : " is-pinned"}`} onKeyDown={onKeyDown}>
        <div className="projects-toolbar">
          <p className="projects-counter" aria-hidden="true"><span>{formatIndex(activeIndex)}</span><span className="projects-counter-divider">/</span><span>{String(projectCount).padStart(2, "0")}</span></p>
          <div className="projects-arrows">
            <button type="button" onClick={() => goToProject(activeRef.current - 1)} disabled={activeIndex === 0} aria-label="Projeto anterior" data-cursor="small">Anterior</button>
            <button type="button" onClick={() => goToProject(activeRef.current + 1)} disabled={activeIndex === projectCount - 1} aria-label="Próximo projeto" data-cursor="small">Próximo</button>
          </div>
        </div>

        <div
          ref={viewportRef}
          className="projects-viewport"
          role="region"
          aria-roledescription="carrossel"
          aria-label="Projetos selecionados. Use os botões ou as setas do teclado para navegar."
          tabIndex={0}
        >
          <div ref={trackRef} className="projects-track">
            {projects.map((project, index) => (
              <article
                key={project.id}
                id={`project-${project.id}`}
                className={`project-slide${index % 2 === 0 ? " is-accent" : ""}${index === activeIndex ? " is-active" : ""}`}
                style={{ "--project-accent": project.accent } as CSSProperties}
                aria-roledescription="slide"
                aria-label={`${index + 1} de ${projectCount}: ${project.title}`}
              >
                <ProjectMedia
                  project={project}
                  active={index === activeIndex}
                  loadMedia={Math.abs(index - activeIndex) <= 1}
                  reducedMotion={reducedMotion}
                />
                <div className="project-content">
                  <p className="project-category">{project.category}</p>
                  <h3 className="project-title">{project.title}</h3>
                  <p className="project-description">{project.description}</p>
                  {project.technologies.length > 0 && (
                    <ul className="project-technologies" aria-label="Tecnologias utilizadas">
                      {project.technologies.map((technology) => <li key={technology}>{technology}</li>)}
                    </ul>
                  )}
                  {project.year && <p className="project-year">{project.year}</p>}
                  {(project.link || project.source) && (
                    <div className="project-links">
                      {project.link && (
                        <a className="project-link" href={project.link} target="_blank" rel="noopener noreferrer" tabIndex={index === activeIndex ? 0 : -1} data-cursor="abrir">
                          <span className="project-link-label">Explorar projeto</span>
                          <ProjectLinkArrow />
                          <span className="sr-only"> (abre em nova aba)</span>
                        </a>
                      )}
                      {project.source && (
                        <a className="project-link project-link-secondary" href={project.source} target="_blank" rel="noopener noreferrer" tabIndex={index === activeIndex ? 0 : -1} data-cursor="abrir">
                          <span className="project-link-label">Veja o código no GitHub</span>
                          <SocialIcon name="github" />
                          <ProjectLinkArrow />
                          <span className="sr-only"> (abre em nova aba)</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="projects-progress">
          <div className="projects-progress-line" aria-hidden="true"><span ref={progressRef} className="projects-progress-fill" /></div>
          <div className="projects-progress-buttons" aria-label="Selecionar projeto">
            {projects.map((project, index) => (
              <button key={project.id} type="button" className={index === activeIndex ? "is-active" : ""} onClick={() => goToProject(index)} aria-label={`Ir para ${project.title}`} aria-current={index === activeIndex ? "true" : undefined} data-cursor="small">
                <span>{formatIndex(index)}</span><span className="projects-progress-name">{project.title}</span>
              </button>
            ))}
          </div>
        </div>
        <p className="sr-only" aria-live="polite" aria-atomic="true">{projects[activeIndex]?.title}, projeto {activeIndex + 1} de {projectCount}.</p>
      </div>
    </section>
  );
}

export default ProjectGallery;
