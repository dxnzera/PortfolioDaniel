"use client";

import { memo, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import type { Project } from "../../data/projects";

type ProjectMediaProps = {
  project: Project;
  active: boolean;
  loadMedia: boolean;
  reducedMotion: boolean;
};

type DataSavingNavigator = Navigator & {
  connection?: EventTarget & { saveData?: boolean };
};

const subscribeToDataSaving = (callback: () => void) => {
  const connection = (navigator as DataSavingNavigator).connection;
  connection?.addEventListener("change", callback);
  return () => connection?.removeEventListener("change", callback);
};
const getDataSaving = () => Boolean((navigator as DataSavingNavigator).connection?.saveData);
const getServerDataSaving = () => true;

export const ProjectMedia = memo(function ProjectMedia({ project, active, loadMedia, reducedMotion }: ProjectMediaProps) {
  const mediaRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const saveData = useSyncExternalStore(subscribeToDataSaving, getDataSaving, getServerDataSaving);
  const [posterFailed, setPosterFailed] = useState(false);
  const hasVideo = Boolean(project.video) && !failed;
  const hasPoster = Boolean(project.poster) && !posterFailed;
  const shouldLoadVideo = loadMedia && visible;

  useEffect(() => {
    const node = mediaRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting && entry.intersectionRatio >= 0.15),
      { threshold: [0, 0.15, 0.5] },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updatePlayback = () => {
      if (hasVideo && active && shouldLoadVideo && !document.hidden && !reducedMotion && !saveData && !userPaused) {
        void video.play().catch(() => setPlaying(false));
      } else {
        video.pause();
      }
    };
    updatePlayback();
    document.addEventListener("visibilitychange", updatePlayback);
    return () => document.removeEventListener("visibilitychange", updatePlayback);
  }, [active, hasVideo, reducedMotion, saveData, shouldLoadVideo, userPaused]);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      setUserPaused(false);
      void video.play().catch(() => setPlaying(false));
    } else {
      setUserPaused(true);
      video.pause();
    }
  };

  const mediaStyle = { "--project-accent": project.accent } as CSSProperties;

  return (
    <div ref={mediaRef} className={`project-media${playing ? " is-playing" : ""}`} style={mediaStyle}>
      <div className="project-media-art">
        {hasPoster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="project-poster"
            src={project.poster}
            alt={`Interface do projeto ${project.title}`}
            loading="lazy"
            decoding="async"
            onError={() => setPosterFailed(true)}
          />
        ) : (
          <div className="project-placeholder" aria-label={`${project.title}: ${project.category}`}>
            <span className="project-placeholder-kicker">{project.category}</span>
            <span className="project-placeholder-title">{project.title}</span>
            <span className="project-placeholder-orbit" aria-hidden="true" />
            <span className="project-placeholder-note">Vídeo em breve</span>
          </div>
        )}

        {hasVideo && (
          <video
            ref={videoRef}
            className="project-video"
            src={shouldLoadVideo ? project.video : undefined}
            preload="none"
            muted
            playsInline
            loop
            aria-label={`Vídeo de apresentação de ${project.title}`}
            onPlaying={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onError={() => {
              setFailed(true);
              setPlaying(false);
            }}
          />
        )}
      </div>

      <div className="project-media-caption">
        <span className="project-media-label">
          <span className={`project-media-dot${playing ? " is-live" : ""}`} aria-hidden="true" />
          {playing ? "Em movimento" : hasVideo ? "Reproduzir prévia" : hasPoster ? "Prévia do projeto" : "Vídeo em breve"}
        </span>
        {hasVideo && (
          <button
            className="project-video-toggle"
            type="button"
            onClick={togglePlayback}
            aria-label={`${playing ? "Pausar" : "Reproduzir"} vídeo de ${project.title}`}
            aria-pressed={playing}
            disabled={!shouldLoadVideo}
            tabIndex={active ? 0 : -1}
            data-cursor="small"
          >
            {playing ? (
              <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" aria-hidden="true">
                <path d="M4 3h3v10H4zm5 0h3v10H9z" />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" aria-hidden="true">
                <path d="m5 2 9 6-9 6V2Z" />
              </svg>
            )}
            <span>{playing ? "Pausar" : "Play"}</span>
          </button>
        )}
      </div>
    </div>
  );
});
