import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Project, FragmentLayout, StickyNote } from "./constants";
import PlayPauseButton from "~/components/PlayPauseButton";

/* ── Video player with IntersectionObserver ── */

function VideoPlayer({
  src,
  paused,
}: {
  src: string;
  paused: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  const reducedMotion = typeof window !== "undefined"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const observerRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return;
      const observer = new IntersectionObserver(
        ([entry]) => setVisible(entry.isIntersecting),
        { threshold: 0.3 },
      );
      observer.observe(node);
      return () => observer.disconnect();
    },
    [],
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video || reducedMotion) return;
    if (visible && !paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [visible, paused, reducedMotion]);

  return (
    <div ref={observerRef} className="h-full w-full">
      <video
        ref={videoRef}
        src={src}
        muted
        loop
        playsInline
        className="h-full w-full object-cover"
      />
    </div>
  );
}

const SCATTER_SCALE = 1.5;
/** How much extra spread when the group is hovered (1.0 = no change) */
const HOVER_SPREAD = 1.25;

/** Seeded pseudo-random 0-1 from an integer seed */
function seededRand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

type TapePlacement = {
  width: number;
  rotate: string;
  color: "teal" | "rose";
};

/**
 * Centered on top edge, with slight random width and rotation.
 */
function computeTapePlacement(seed: number): TapePlacement {
  const r1 = seededRand(seed);
  const r2 = seededRand(seed + 1);
  const width = 80 + Math.floor(r1 * 30); // 80-110px
  const rotate = -4 + r2 * 8; // -4 to +4 deg
  const color: "teal" | "rose" = seededRand(seed + 2) > 0.5 ? "teal" : "rose";
  return { width, rotate: `${rotate.toFixed(1)}deg`, color };
}

/** Snap threshold — below this focus value, elements are fully scattered */
const FOCUS_SNAP = 0.5;

function fragmentTransform(
  offset: [number, number],
  rotate: number,
  focus: number,
  hovered: boolean,
) {
  const landed = focus > FOCUS_SNAP;
  let ox = landed ? offset[0] : offset[0] * SCATTER_SCALE;
  let oy = landed ? offset[1] : offset[1] * SCATTER_SCALE;
  const r = landed ? rotate * 0.35 : rotate;
  // When hovered and landed, push elements further out for breathing room
  if (hovered && landed) {
    ox *= HOVER_SPREAD;
    oy *= HOVER_SPREAD;
  }
  return `translate(calc(-50% + ${ox}px), calc(-50% + ${oy}px)) rotate(${r}deg)`;
}

/**
 * Scatter transform for child elements (tape/pin).
 * Snaps between scattered and landed at FOCUS_SNAP threshold.
 */
function childScatter(
  scatterOffset: [number, number],
  scatterRotate: number,
  focus: number,
  scaleRange?: [number, number],
) {
  const landed = focus > FOCUS_SNAP;
  const ox = landed ? 0 : scatterOffset[0];
  const oy = landed ? 0 : scatterOffset[1];
  const r = landed ? 0 : scatterRotate;
  const s = landed ? 1 : (scaleRange ? scaleRange[0] : 1);
  return `translate(${ox}px, ${oy}px) rotate(${r}deg) scale(${s})`;
}

/* ── Polaroid Image Fragment ── */

function PolaroidFragment({
  project,
  layout,
  focus,
  hovered,
  tapePlacement,
  videoPaused,
  onTogglePause,
}: {
  project: Project;
  layout: FragmentLayout;
  focus: number;
  hovered: boolean;
  tapePlacement: TapePlacement;
  videoPaused: boolean;
  onTogglePause: () => void;
}) {
  const transform = fragmentTransform(
    layout.imageOffset,
    layout.imageRotate,
    focus,
    hovered,
  );

  // Tape scatters upward from its CSS position when unfocused
  const tapeScatter = childScatter([0, -80], 14, focus);

  const isVideo = project.src?.includes("/video/");

  const polaroidContent = project.src ? (
    <Link
      href={project.liveLink || project.githubLink || "#"}
      target="_blank"
      rel="noopener"
      className="group block"
    >
      <div className="relative aspect-square overflow-hidden bg-[#171717]">
        {isVideo ? (
          <VideoPlayer src={project.src} paused={videoPaused} />
        ) : (
          <Image
            src={project.src}
            alt={`Screenshot of ${project.title}`}
            fill
            className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 72vw, 380px"
          />
        )}
      </div>
    </Link>
  ) : project.isShowcase ? (
    <Link
      href={project.liveLink || "#"}
      target="_blank"
      rel="noopener"
      className="group block"
    >
      <div className="aspect-square overflow-hidden">
        <div className="flex h-full w-full items-center justify-center bg-[#171717]">
          <div className="flex flex-col items-center gap-3 text-[#737373] transition-colors duration-200 group-hover:text-[#fafaf9]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" x2="21" y1="14" y2="3" />
            </svg>
            <span className="text-base font-[300] tracking-wide">
              Launch experience
            </span>
          </div>
        </div>
      </div>
    </Link>
  ) : null;

  const tapeClass = `polaroid-tape polaroid-tape-${tapePlacement.color}`;
  const reducedMotion = typeof window !== "undefined"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Play/pause scatters to the right when unfocused
  const playPauseScatter = childScatter([80, 40], -10, focus);

  return (
    <div
      className="polaroid-card absolute top-1/2 left-1/2 w-[min(760px,85vw)]"
      style={{ transform }}
    >
      {/* Tape — centered on top edge, width/rotation randomized per project */}
      <div
        className={tapeClass}
        style={{
          width: tapePlacement.width,
          rotate: tapePlacement.rotate,
          transform: tapeScatter,
        }}
      />
      {/* Play/Pause — bottom-right of polaroid, scatters like tape */}
      {isVideo && !reducedMotion && (
        <PlayPauseButton
          paused={videoPaused}
          onToggle={(e) => { e.preventDefault(); e.stopPropagation(); onTogglePause(); }}
          className="absolute right-6 bottom-20 z-[3]"
          style={{ transform: playPauseScatter, rotate: "-3deg" }}
        />
      )}
      <div className="p-3 pb-0">{polaroidContent}</div>
      <div className="px-4 pt-3 pb-5">
        <p className="polaroid-title text-center font-(family-name:--font-source-code-pro) text-xl tracking-[0.02em]">
          {project.title}
        </p>
      </div>
    </div>
  );
}

/* ── Info Fragment (description + links + pills) ── */

function InfoFragment({
  project,
  layout,
  focus,
  hovered,
}: {
  project: Project;
  layout: FragmentLayout;
  focus: number;
  hovered: boolean;
}) {
  const transform = fragmentTransform(
    layout.infoOffset,
    layout.infoRotate,
    focus,
    hovered,
  );

  // Pin scatters up and away, scales down when unfocused
  const pinScatter = childScatter([0, -60], 20, focus, [0.4, 1]);

  return (
    <div
      className="info-fragment absolute top-1/2 left-1/2 z-[2] flex w-[min(400px,72vw)] flex-col gap-3 px-6 py-5"
      style={{ transform }}
    >
      {/* Pin — CSS positioned on the card, scatters via its own transform */}
      <div className="info-pin" style={{ transform: pinScatter }} />

      {/* Links */}
      <div className="flex gap-5">
        {project.liveLink && (
          <Link
            href={project.liveLink}
            target="_blank"
            rel="noopener"
            className="info-link group relative inline-flex items-center gap-1.5 text-base font-[300] tracking-wide"
          >
            <span>Experience</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            >
              <line x1="7" x2="17" y1="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
          </Link>
        )}
        {project.githubLink && (
          <Link
            href={project.githubLink}
            target="_blank"
            rel="noopener"
            className="info-link-secondary group relative inline-flex items-center gap-1.5 text-base font-[300] tracking-wide"
          >
            <span>Source</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            >
              <line x1="7" x2="17" y1="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
          </Link>
        )}
      </div>

      {/* Hairline */}
      <div className="info-hairline h-px" />

      {/* Description */}
      <p className="info-desc text-[clamp(1rem,1.2vw,1.1rem)] leading-[1.7] font-[300]">
        {project.description}
      </p>

      {/* Tech pills */}
      <div className="flex flex-wrap gap-1.5">
        {project.technologies.map((tech) => (
          <span
            key={tech}
            className="tech-pill rounded px-2.5 py-1 text-[16px] font-[300]"
          >
            {tech}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Sticky Notes — converge on the project when focused ── */

function StickyNotes({
  notes,
  focus,
  hovered,
}: {
  notes: StickyNote[];
  focus: number;
  hovered: boolean;
}) {
  return (
    <>
      {notes.map((note, i) => {
        const scatterTransform = childScatter(
          [note.offset[0] > 0 ? 100 + i * 30 : -100 - i * 30, -70 - i * 20],
          note.rotate * 3,
          focus,
          [0.5, 1],
        );

        const spread = hovered && focus > FOCUS_SNAP ? HOVER_SPREAD : 1;
        const ox = note.offset[0] * spread;
        const oy = note.offset[1] * spread;
        const landedTransform = `translate(calc(-50% + ${ox}px), calc(-50% + ${oy}px)) rotate(${note.rotate}deg)`;

        return (
          <div
            key={i}
            className={`sticky-note sticky-note-${note.color} absolute top-1/2 left-1/2 p-12 font-(family-name:--font-source-code-pro)`}
            style={{ transform: `${landedTransform} ${scatterTransform}` }}
          >
            {note.text}
          </div>
        );
      })}
    </>
  );
}

/* ── Mobile Card — clean vertical stack ── */

function MobileProjectCard({ project, index }: { project: Project; index: number }) {
  const [videoPaused, setVideoPaused] = useState(false);
  const tape = computeTapePlacement(index * 7 + 13);
  const tapeClass = `polaroid-tape polaroid-tape-${tape.color}`;
  const isVideo = project.src?.includes("/video/");
  const reducedMotion = typeof window !== "undefined"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const polaroidContent = project.src ? (
    <Link
      href={project.liveLink || project.githubLink || "#"}
      target="_blank"
      rel="noopener"
      className="group block"
    >
      <div className="relative aspect-square overflow-hidden bg-[#171717]">
        {isVideo ? (
          <VideoPlayer src={project.src} paused={videoPaused} />
        ) : (
          <Image
            src={project.src}
            alt={`Screenshot of ${project.title}`}
            fill
            className="object-cover"
            sizes="85vw"
          />
        )}
      </div>
    </Link>
  ) : project.isShowcase ? (
    <Link
      href={project.liveLink || "#"}
      target="_blank"
      rel="noopener"
      className="group block"
    >
      <div className="aspect-square overflow-hidden">
        <div className="flex h-full w-full items-center justify-center bg-[#171717]">
          <div className="flex flex-col items-center gap-3 text-[#737373] transition-colors duration-200 group-hover:text-[#fafaf9]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" x2="21" y1="14" y2="3" />
            </svg>
            <span className="text-base font-[300] tracking-wide">
              Launch experience
            </span>
          </div>
        </div>
      </div>
    </Link>
  ) : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Polaroid */}
      <div
        className="polaroid-card relative mx-auto w-full max-w-[680px]"
        style={{ rotate: `${project.fragments.imageRotate * 0.4}deg` }}
      >
        <div
          className={tapeClass}
          style={{
            width: tape.width,
            rotate: tape.rotate,
          }}
        />
        <div className="p-2.5 pb-0">{polaroidContent}</div>
        <div className="px-3 pt-2.5 pb-4">
          <p className="polaroid-title text-center font-(family-name:--font-source-code-pro) text-xl tracking-[0.02em]">
            {project.title}
          </p>
        </div>
      </div>

      {/* Play/Pause for mobile — inline button */}
      {isVideo && !reducedMotion && (
        <div className="flex justify-center">
          <PlayPauseButton
            paused={videoPaused}
            onToggle={() => setVideoPaused((p) => !p)}
            style={{ rotate: "4deg" }}
          />
        </div>
      )}

      {/* Sticky notes row */}
      <div className="flex flex-wrap justify-center gap-2 px-4">
        {project.stickyNotes.map((note, i) => (
          <div
            key={i}
            className={`sticky-note sticky-note-${note.color} font-(family-name:--font-source-code-pro)`}
            style={{
              rotate: `${note.rotate * 0.5}deg`,
              position: "relative",
              left: "auto",
              top: "auto",
            }}
          >
            {note.text}
          </div>
        ))}
      </div>

      {/* Info card */}
      <div
        className="info-fragment relative mx-auto flex w-full max-w-[360px] flex-col gap-3 px-5 py-4"
        style={{ rotate: `${project.fragments.infoRotate * 0.3}deg` }}
      >
        <div className="info-pin" />
        <div className="flex gap-5">
          {project.liveLink && (
            <Link
              href={project.liveLink}
              target="_blank"
              rel="noopener"
              className="info-link group relative inline-flex items-center gap-1.5 text-base font-[300] tracking-wide"
            >
              <span>Experience</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              >
                <line x1="7" x2="17" y1="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
              </svg>
            </Link>
          )}
          {project.githubLink && (
            <Link
              href={project.githubLink}
              target="_blank"
              rel="noopener"
              className="info-link-secondary group relative inline-flex items-center gap-1.5 text-base font-[300] tracking-wide"
            >
              <span>Source</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              >
                <line x1="7" x2="17" y1="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
              </svg>
            </Link>
          )}
        </div>
        <div className="info-hairline h-px" />
        <p className="info-desc text-base leading-[1.7] font-[300]">
          {project.description}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {project.technologies.map((tech) => (
            <span
              key={tech}
              className="tech-pill rounded px-2.5 py-1 text-[16px] font-[300]"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Main Card Wrapper ── */

export { MobileProjectCard };

export default function ProjectCard({
  project,
  index,
  focus,
}: {
  project: Project;
  index: number;
  focus: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [videoPaused, setVideoPaused] = useState(false);
  const layout = project.fragments;
  const tapePlacement = computeTapePlacement(index * 7 + 13);
  const isLanded = focus > FOCUS_SNAP;

  // Clear hover if project scrolls out of focus
  if (!isLanded && hovered) setHovered(false);

  // If the cursor is already inside when the card lands, scatter immediately
  useEffect(() => {
    if (isLanded && containerRef.current?.matches(":hover")) {
      setHovered(true);
    }
  }, [isLanded]);

  return (
    <div
      ref={containerRef}
      className="relative h-[900px] w-[min(1100px,95vw)]"
      onPointerEnter={() => isLanded && setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <PolaroidFragment
        project={project}
        layout={layout}
        focus={focus}
        hovered={hovered}
        tapePlacement={tapePlacement}
        videoPaused={videoPaused}
        onTogglePause={() => setVideoPaused((p) => !p)}
      />
      <StickyNotes
        notes={project.stickyNotes}
        focus={focus}
        hovered={hovered}
      />
      <InfoFragment
        project={project}
        layout={layout}
        focus={focus}
        hovered={hovered}
      />
    </div>
  );
}
