import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Project, FragmentLayout, StickyNote } from "./constants";
import PlayPauseButton from "~/components/PlayPauseButton";
import AutoplayVideo from "~/components/AutoplayVideo";
import ArrowUpRight from "~/components/ArrowUpRight";
import useReducedMotion from "~/hooks/useReducedMotion";
import {
  FOCUS_SNAP,
  fragmentTransform,
  childScatter,
} from "~/utils/scatterTransforms";

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

/* ── Polaroid Image Fragment ── */

function PolaroidFragment({
  project,
  layout,
  focus,
  hovered,
  tapePlacement,
  videoPaused,
  onTogglePause,
  reducedMotion,
}: {
  project: Project;
  layout: FragmentLayout;
  focus: number;
  hovered: boolean;
  tapePlacement: TapePlacement;
  videoPaused: boolean;
  onTogglePause: () => void;
  reducedMotion: boolean;
}) {
  const transform = fragmentTransform(
    layout.imageOffset[0],
    layout.imageOffset[1],
    layout.imageRotate,
    focus,
    hovered ? HOVER_SPREAD : 1,
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
      aria-label={`View ${project.title} on ${project.liveLink ? "live site" : "GitHub"}`}
    >
      <div className="relative aspect-square overflow-hidden bg-[#171717]">
        {isVideo ? (
          <AutoplayVideo
            src={project.src}
            paused={videoPaused}
            threshold={0.9}
          />
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
          onToggle={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onTogglePause();
          }}
          className="absolute right-6 bottom-20 z-[3]"
          style={{ transform: playPauseScatter, rotate: "-3deg" }}
        />
      )}
      <div className="p-3 pb-0">{polaroidContent}</div>
      <div className="px-4 pt-3 pb-5">
        <p className="polaroid-title text-center font-mono text-xl tracking-[0.02em]">
          {project.title}
        </p>
      </div>
    </div>
  );
}

/* ── Info Fragment (description + links + pills) ── */

const ARROW_CLASSES =
  "transition-transform duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5";

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
    layout.infoOffset[0],
    layout.infoOffset[1],
    layout.infoRotate,
    focus,
    hovered ? HOVER_SPREAD : 1,
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
            aria-label={`View ${project.title} on live site`}
          >
            <span>Experience</span>
            <ArrowUpRight className={ARROW_CLASSES} />
          </Link>
        )}
        {project.githubLink && (
          <Link
            href={project.githubLink}
            target="_blank"
            rel="noopener"
            className="info-link-secondary group relative inline-flex items-center gap-1.5 text-base font-[300] tracking-wide"
            aria-label={`View ${project.title} on GitHub"}`}
          >
            <span>Source</span>
            <ArrowUpRight className={ARROW_CLASSES} />
          </Link>
        )}
      </div>

      {/* Hairline */}
      <div className="info-hairline h-px" />

      {/* Description */}
      <p className="info-desc font-300 text-[clamp(1rem,1.2vw,1.1rem)] leading-[1.7]">
        {project.description}
      </p>

      {/* Tech pills */}
      <div className="flex flex-wrap gap-1.5">
        {project.technologies.map((tech) => (
          <span
            key={tech}
            className="tech-pill font-300 rounded px-2.5 py-1 text-[16px]"
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
            className={`sticky-note sticky-note-${note.color} absolute top-1/2 left-1/2 p-12 font-mono`}
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

function MobileProjectCard({
  project,
  index,
}: {
  project: Project;
  index: number;
}) {
  const [videoPaused, setVideoPaused] = useState(false);
  const tape = computeTapePlacement(index * 7 + 13);
  const tapeClass = `polaroid-tape polaroid-tape-${tape.color}`;
  const isVideo = project.src?.includes("/video/");
  const reducedMotion = useReducedMotion();

  const polaroidContent = project.src ? (
    <Link
      href={project.liveLink || project.githubLink || "#"}
      target="_blank"
      rel="noopener"
      className="group block"
    >
      <div className="relative aspect-square overflow-hidden bg-[#171717]">
        {isVideo ? (
          <AutoplayVideo
            src={project.src}
            paused={videoPaused}
            threshold={0.9}
          />
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
          <p className="polaroid-title text-center font-mono text-xl tracking-[0.02em]">
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
              className="info-link group font-300 relative inline-flex items-center gap-1.5 text-base tracking-wide"
            >
              <span>Experience</span>
              <ArrowUpRight className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          )}
          {project.githubLink && (
            <Link
              href={project.githubLink}
              target="_blank"
              rel="noopener"
              className="info-link-secondary group font-300 relative inline-flex items-center gap-1.5 text-base tracking-wide"
            >
              <span>Source</span>
              <ArrowUpRight className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          )}
        </div>
        <div className="info-hairline h-px" />
        <p className="info-desc font-300 text-base leading-[1.7]">
          {project.description}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {project.technologies.map((tech) => (
            <span
              key={tech}
              className="tech-pill font-300 rounded px-2.5 py-1 text-[16px]"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
      {/* Sticky notes row */}
      <div className="flex flex-wrap justify-center gap-2 px-4">
        {project.stickyNotes.map((note, i) => (
          <div
            key={i}
            className={`sticky-note sticky-note-${note.color} font-mono`}
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
  const reducedMotion = useReducedMotion();
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
        reducedMotion={reducedMotion}
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
