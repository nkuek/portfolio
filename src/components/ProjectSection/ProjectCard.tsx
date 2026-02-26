import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Project, FragmentLayout, StickyNote } from "./constants";
import PlayPauseButton from "~/components/PlayPauseButton";
import AutoplayVideo from "~/components/AutoplayVideo";
import ArrowUpRight from "~/components/ArrowUpRight";
import useReducedMotion from "~/hooks/useReducedMotion";
import useTilt, { TILT_INNER_TRANSITION } from "~/hooks/useTilt";
import {
  FOCUS_SNAP,
  fragmentTransform,
  childScatter,
} from "~/utils/scatterTransforms";

/** How much extra spread when the group is hovered (1.0 = no change) */
const HOVER_SPREAD = 1.25;

/** Inline scatter transition — matches the one in .polaroid-card / .info-fragment CSS */
const SCATTER_TRANSITION = "transform 500ms cubic-bezier(0.16, 1, 0.3, 1)";

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
  scale,
  hoverSpread,
  cameraOffset,
}: {
  project: Project;
  layout: FragmentLayout;
  focus: number;
  hovered: boolean;
  tapePlacement: TapePlacement;
  videoPaused: boolean;
  onTogglePause: () => void;
  reducedMotion: boolean;
  scale: number;
  hoverSpread: number;
  cameraOffset?: [number, number];
}) {
  const s = scale;
  const transform = fragmentTransform(
    layout.imageOffset[0] * s,
    layout.imageOffset[1] * s,
    layout.imageRotate,
    focus,
    hovered ? hoverSpread : 1,
  );

  // Tape scatters upward from its CSS position when unfocused
  const tapeScatter = childScatter([0, -80 * s], 14, focus);

  const isVideo = project.src?.includes("/video/");

  const polaroidContent = project.src ? (
    <Link
      href={project.liveLink || project.githubLink || "#"}
      target="_blank"
      rel="noopener"
      className="group block"
      aria-label={`View ${project.title} on ${project.liveLink ? "live site" : "GitHub"}`}
    >
      <div className="bg-surface-media relative aspect-square overflow-hidden">
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
            className="ease-smooth object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
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
        <div className="bg-surface-media flex h-full w-full items-center justify-center">
          <div className="text-text-muted flex flex-col items-center gap-3 transition-colors duration-200 group-hover:text-[#fafaf9]">
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
            <span className="text-base font-light tracking-wide">
              Launch experience
            </span>
          </div>
        </div>
      </div>
    </Link>
  ) : null;

  const tapeClass = `polaroid-tape polaroid-tape-${tapePlacement.color}`;
  // Play/pause scatters to the right when unfocused
  const playPauseScatter = childScatter([80 * s, 40 * s], -10, focus);

  const { tiltRef, sheenRef, tiltHandlers, perspective } = useTilt(
    reducedMotion,
    cameraOffset,
  );

  return (
    <div
      className="absolute top-1/2 left-1/2 w-[min(760px,60vw)]"
      style={{ transform, transition: SCATTER_TRANSITION, perspective }}
      {...tiltHandlers}
    >
      <div
        ref={tiltRef}
        className="polaroid-card relative"
        style={{ transition: TILT_INNER_TRANSITION }}
      >
        {/* Sheen — light-catch highlight driven by tilt RAF */}
        <div
          ref={sheenRef}
          className="pointer-events-none absolute inset-0 z-5 rounded-[3px]"
        />
        {/* Tape — centered on top edge, width/rotation randomized per project */}
        <div
          className={tapeClass}
          style={{
            width: `calc(${tapePlacement.width}px + 3vw)`,
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
            className="absolute right-6 bottom-20 z-3"
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
    </div>
  );
}

/* ── Info Fragment (description + links + pills) ── */

const ARROW_CLASSES =
  "transition-transform duration-200 ease-smooth group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:translate-y-0";

function InfoFragment({
  project,
  layout,
  focus,
  hovered,
  scale,
  hoverSpread,
  reducedMotion,
}: {
  project: Project;
  layout: FragmentLayout;
  focus: number;
  hovered: boolean;
  scale: number;
  hoverSpread: number;
  reducedMotion: boolean;
}) {
  const s = scale;
  const transform = fragmentTransform(
    layout.infoOffset[0] * s,
    layout.infoOffset[1] * s,
    layout.infoRotate,
    focus,
    hovered ? hoverSpread : 1,
  );

  // Pin scatters up and away, scales down when unfocused
  const pinScatter = childScatter([0, -60 * s], 20, focus, [0.4, 1]);

  const { tiltRef, tiltHandlers, perspective } = useTilt(reducedMotion);

  return (
    <div
      className="absolute top-1/2 left-1/2 z-2"
      style={{
        transform,
        width: `min(${Math.round(400 * s)}px, 72vw)`,
        transition: SCATTER_TRANSITION,
        perspective,
      }}
      {...tiltHandlers}
    >
      <div
        ref={tiltRef}
        className="info-fragment relative flex flex-col gap-3 px-6 py-5"
        style={{ transition: TILT_INNER_TRANSITION }}
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
              className="info-link group relative inline-flex items-center gap-1.5 text-base font-light tracking-wide"
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
              className="info-link-secondary group relative inline-flex items-center gap-1.5 text-base font-light tracking-wide"
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
    </div>
  );
}

/* ── Sticky Notes — converge on the project when focused ── */

function StickyNoteItem({
  note,
  index,
  focus,
  hovered,
  scale,
  hoverSpread,
  reducedMotion,
}: {
  note: StickyNote;
  index: number;
  focus: number;
  hovered: boolean;
  scale: number;
  hoverSpread: number;
  reducedMotion: boolean;
}) {
  const s = scale;
  const scatterTransform = childScatter(
    [
      (note.offset[0] > 0 ? 100 + index * 30 : -100 - index * 30) * s,
      (-70 - index * 20) * s,
    ],
    note.rotate,
    focus,
    [0.5, 1],
  );

  const spread = hovered && focus > FOCUS_SNAP ? hoverSpread : 1;
  const ox = note.offset[0] * spread * s;
  const oy = note.offset[1] * spread * s;
  const landedTransform = `translate(calc(-50% + ${ox}px), calc(-50% + ${oy}px)) rotate(${note.rotate}deg)`;

  const { tiltRef, tiltHandlers, perspective } = useTilt(reducedMotion);

  return (
    <div
      className="absolute top-1/2 left-1/2"
      style={{
        transform: `${landedTransform} ${scatterTransform}`,
        transition: SCATTER_TRANSITION,
        perspective,
      }}
      {...tiltHandlers}
    >
      <div
        ref={tiltRef}
        className={`sticky-note sticky-note-${note.color} font-mono text-[clamp(1rem,1.2vw,1.5rem)]`}
        style={{
          position: "relative",
          left: 0,
          top: 0,
          transition: TILT_INNER_TRANSITION,
        }}
      >
        {note.text}
      </div>
    </div>
  );
}

function StickyNotes({
  notes,
  focus,
  hovered,
  scale,
  hoverSpread,
  reducedMotion,
}: {
  notes: StickyNote[];
  focus: number;
  hovered: boolean;
  scale: number;
  hoverSpread: number;
  reducedMotion: boolean;
}) {
  return (
    <>
      {notes.map((note, i) => (
        <StickyNoteItem
          key={i}
          note={note}
          index={i}
          focus={focus}
          hovered={hovered}
          scale={scale}
          hoverSpread={hoverSpread}
          reducedMotion={reducedMotion}
        />
      ))}
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
      aria-label={`View ${project.title} on ${project.liveLink ? "live site" : "GitHub"}`}
    >
      <div className="bg-surface-media relative aspect-square overflow-hidden">
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
        <div className="bg-surface-media flex h-full w-full items-center justify-center">
          <div className="text-text-muted flex flex-col items-center gap-3 transition-colors duration-200 group-hover:text-[#fafaf9]">
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
            <span className="text-base font-light tracking-wide">
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
        style={{
          rotate: `${project.fragments.mobileImageRotate ?? project.fragments.imageRotate * 0.4}deg`,
        }}
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
        style={{
          rotate: `${project.fragments.mobileInfoRotate ?? project.fragments.infoRotate * 0.3}deg`,
        }}
      >
        <div className="info-pin" />
        <div className="flex gap-5">
          {project.liveLink && (
            <Link
              href={project.liveLink}
              target="_blank"
              rel="noopener"
              className="info-link group font-300 relative inline-flex items-center gap-1.5 text-base tracking-wide"
              aria-label={`View ${project.title} on "live site"}`}
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
              className="info-link-secondary group font-300 relative inline-flex items-center gap-1.5 text-base tracking-wide"
              aria-label={`View ${project.title} on GitHub`}
            >
              <span>Source</span>
              <ArrowUpRight className={ARROW_CLASSES} />
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
              rotate: `${note.mobileRotate ?? note.rotate * 0.5}deg`,
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
  scale = 1,
  cameraOffset,
}: {
  project: Project;
  index: number;
  focus: number;
  /** Responsive scale factor — offsets shrink proportionally with the polaroid */
  scale?: number;
  /** Normalized camera-to-card offset for resting sheen direction */
  cameraOffset?: [number, number];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [videoPaused, setVideoPaused] = useState(false);
  const reducedMotion = useReducedMotion();
  const layout = project.fragments;
  const tapePlacement = computeTapePlacement(index * 7 + 13);
  // Scale the hover spread so fragments don't fly off-edge on smaller screens
  const hoverSpread = 1 + (HOVER_SPREAD - 1) * scale;
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
      className="relative -m-24 h-[90vh] w-[min(1600px,95vw)] p-24"
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
        scale={scale}
        hoverSpread={hoverSpread}
        cameraOffset={cameraOffset}
      />
      <StickyNotes
        notes={project.stickyNotes}
        focus={focus}
        hovered={hovered}
        scale={scale}
        hoverSpread={hoverSpread}
        reducedMotion={reducedMotion}
      />
      <InfoFragment
        project={project}
        layout={layout}
        focus={focus}
        hovered={hovered}
        hoverSpread={hoverSpread}
        scale={scale}
        reducedMotion={reducedMotion}
      />
    </div>
  );
}
