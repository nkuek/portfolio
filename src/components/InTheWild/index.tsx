"use client";
import { useEffect, useRef, useState, type RefObject } from "react";
import PlayPauseButton from "~/components/PlayPauseButton";
import AutoplayVideo from "~/components/AutoplayVideo";
import SectionTitleCard from "~/components/SectionTitleCard";
import Tape from "~/components/shared/Tape";
import Pin from "~/components/shared/Pin";
import FloatingLabel from "~/components/shared/FloatingLabel";
import type { CrosshairData } from "~/components/Crosshair";
import type { XAxisData } from "~/components/XAxisTicks";
import type { YAxisData } from "~/components/GridTicks";
import useReducedMotion from "~/hooks/useReducedMotion";
import useTilt, { TILT_INNER_TRANSITION } from "~/hooks/useTilt";
import {
  SCATTER_TRANSITION,
  fragmentTransform,
  childScatter,
} from "~/utils/scatterTransforms";
import type { HighlightData } from "~/types/highlight";
import { cameraWaypoints } from "~/components/ProjectSection/constants";

type WildProject = {
  title: string;
  company: string;
  caption: string;
  videoSrc: string;
  rotate: number;
  /** X position in the horizontal world */
  x: number;
};

const wildProjects: WildProject[] = [
  {
    title: "immersive hero",
    company: "Mercury",
    caption: "A scroll-driven video experience that dissolves into the page.",
    videoSrc:
      "https://res.cloudinary.com/dunbkcyqq/video/upload/f_auto,q_auto,ac_none,dpr_auto/immersize-hero.mov",
    rotate: -2,
    x: 0,
  },
  {
    title: "gamified 404 page",
    company: "Mercury",
    caption:
      "A 404 page you actually want to find. Sliding puzzle easter egg turns a dead-end into a moment of delight.",
    videoSrc:
      "https://res.cloudinary.com/dunbkcyqq/video/upload/f_auto,q_auto,w_1184,h_646,ac_none,dpr_auto/404-puzzle.mov",
    rotate: 1.5,
    x: 2800,
  },
  {
    title: "fluid simulation button",
    company: "Mercury",
    caption:
      "Fluid simulation trapped inside a button. A microinteraction that packs a big punch.",
    videoSrc:
      "https://res.cloudinary.com/dunbkcyqq/video/upload/f_auto,q_auto,ac_none,dpr_auto/fluid-button.mov",
    rotate: -1,
    x: 5600,
  },
];

const FOCUS_RADIUS = 1400;

/* ── Wild card — polaroid + info fragments that scatter/converge ── */

function WildCardFragments({
  project,
  focus,
  cameraOffset,
}: {
  project: WildProject;
  focus: number;
  cameraOffset?: [number, number];
}) {
  const reducedMotion = useReducedMotion();
  const [paused, setPaused] = useState(true);
  useEffect(() => {
    if (!reducedMotion) setPaused(false);
  }, [reducedMotion]);

  const imageTransform = fragmentTransform(-20, -40, project.rotate, focus);
  const infoTransform = fragmentTransform(
    0,
    "min(400px, 28.125vw)",
    -project.rotate * 0.5,
    focus,
  );
  const tapeScatter = childScatter([0, -70], 12, focus);
  const playPauseScatter = childScatter([70, 30], -8, focus);

  const isVideo = !!project.videoSrc;
  const { tiltRef, sheenRef, tiltHandlers, perspective } = useTilt(
    reducedMotion,
    cameraOffset,
  );

  return (
    <div className="relative h-[900px] w-[min(1400px,95vw)]">
      {/* Polaroid */}
      <div
        className="absolute top-1/2 left-1/2 w-[min(1280px,90vw)]"
        style={{
          transform: imageTransform,
          transition: SCATTER_TRANSITION,
          perspective,
        }}
        {...tiltHandlers}
      >
        <div
          ref={tiltRef}
          className="bg-surface-card border-border-card rounded-torn shadow-card hover:shadow-card-hover relative border hover:scale-[1.02]"
          style={{ transition: TILT_INNER_TRANSITION }}
        >
          {/* Sheen overlay */}
          <div
            ref={sheenRef}
            className="pointer-events-none absolute inset-0 z-5 rounded-[3px]"
          />
          {/* Tape */}
          <Tape
            color="teal"
            width="calc(88px + 8vw)"
            rotate="3deg"
            style={{ transform: tapeScatter, transition: SCATTER_TRANSITION }}
          />
          {/* Play/Pause on polaroid */}
          {isVideo && (
            <PlayPauseButton
              paused={paused}
              onToggle={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setPaused((p) => !p);
              }}
              className="absolute right-6 bottom-20 z-3"
              style={{
                transform: playPauseScatter,
                transition: SCATTER_TRANSITION,
                rotate: "-3deg",
              }}
            />
          )}
          <div className="p-3 pb-0">
            {isVideo ? (
              <div className="bg-surface-media relative aspect-16/10 overflow-hidden">
                <AutoplayVideo
                  src={project.videoSrc}
                  paused={paused}
                  threshold={0.9}
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="bg-surface-media flex aspect-16/10 items-center justify-center">
                <span className="text-text-subtle font-mono text-base">
                  Coming soon
                </span>
              </div>
            )}
          </div>
          <div className="px-4 pt-3 pb-5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-text-card-title font-serif text-base italic">
                {project.title}
              </p>
              <span className="text-accent shrink-0 font-mono text-xs tracking-[0.08em] uppercase">
                {project.company}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Info fragment */}
      <div
        className="absolute top-1/2 left-1/2 z-2 w-[min(400px,72vw)]"
        style={{ transform: infoTransform, transition: SCATTER_TRANSITION }}
      >
        <div
          className="rounded-info border-border-light bg-surface-overlay shadow-info hover:shadow-info-hover relative flex flex-col gap-3 border px-6 py-5 backdrop-blur-[14px] hover:scale-[1.015]"
          style={{ transition: TILT_INNER_TRANSITION }}
        >
          <Pin
            style={{
              transform: childScatter([0, -50], 16, focus),
              transition: SCATTER_TRANSITION,
            }}
          />
          <p className="text-caption text-[clamp(1rem,1.2vw,1.1rem)] leading-[1.7] font-light">
            {project.caption}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Mobile wild card — vertical stack like MobileProjectCard ── */

function MobileWildCard({ project }: { project: WildProject }) {
  const reducedMotion = useReducedMotion();
  const [paused, setPaused] = useState(true);
  useEffect(() => {
    if (!reducedMotion) setPaused(false);
  }, [reducedMotion]);
  const isVideo = !!project.videoSrc;

  return (
    <div className="flex flex-col gap-4">
      {/* Polaroid */}
      <div
        className="bg-surface-card border-border-card rounded-torn shadow-card hover:shadow-card-hover relative mx-auto w-full max-w-[400px] border hover:scale-[1.02]"
        style={{ rotate: `${project.rotate * 0.4}deg` }}
      >
        <Tape color="teal" width={88} rotate="3deg" />
        <div className="p-2.5 pb-0">
          {isVideo ? (
            <div className="bg-surface-media relative aspect-16/10 overflow-hidden">
              <AutoplayVideo
                src={project.videoSrc}
                paused={paused}
                threshold={0.9}
                className="object-contain"
              />
            </div>
          ) : (
            <div className="bg-surface-media flex aspect-16/10 items-center justify-center">
              <span className="text-text-subtle font-mono text-base">
                Coming soon
              </span>
            </div>
          )}
        </div>
        <div className="px-3 pt-2.5 pb-4">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-text-card-title font-serif text-base italic">
              {project.title}
            </p>
            <span className="text-accent shrink-0 font-mono text-sm tracking-[0.08em] uppercase">
              {project.company}
            </span>
          </div>
        </div>
      </div>

      {/* Play/Pause */}
      {isVideo && (
        <div className="flex justify-center">
          <PlayPauseButton
            paused={paused}
            onToggle={() => setPaused((p) => !p)}
            style={{ rotate: "3deg" }}
          />
        </div>
      )}

      {/* Info card */}
      <div
        className="rounded-info border-border-light bg-surface-overlay shadow-info hover:shadow-info-hover relative mx-auto flex w-full max-w-[380px] flex-col gap-3 border px-5 py-4 backdrop-blur-[14px] hover:scale-[1.015]"
        style={{ rotate: `${-project.rotate * 0.3}deg` }}
      >
        <Pin />
        <p className="text-caption text-base leading-[1.7] font-light">
          {project.caption}
        </p>
      </div>
    </div>
  );
}

/* ── Floating labels in the horizontal world ── */

const wildLabels = [
  { text: "production code", x: -900, y: -300, size: "lg" as const },
  { text: "shipped", x: 1100, y: 280, size: "md" as const },
  { text: "design engineering", x: 3800, y: -280, size: "lg" as const },
  { text: "craft at scale", x: 1500, y: -170, size: "md" as const },
  { text: "pixel perfect", x: 4500, y: 200, size: "sm" as const },
  { text: "interaction design", x: 6500, y: -260, size: "lg" as const },
];

/* ── Main section ── */

export default function InTheWild({
  highlightRef,
  crosshairRef,
  xAxisRef,
  yAxisRef,
}: {
  highlightRef: RefObject<HighlightData>;
  crosshairRef: RefObject<CrosshairData>;
  xAxisRef: RefObject<XAxisData>;
  yAxisRef: RefObject<YAxisData>;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const lockedYRef = useRef<number | null>(null);
  const scrollDistRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const [rawProgress, setRawProgress] = useState(0);
  const [sectionInView, setSectionInView] = useState(false);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const update = () =>
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Imperative cursor proximity — updates label DOM directly, no re-renders
  // Fades spotlight out after cursor goes idle, returning to dappled-sunlight base
  useEffect(() => {
    let mouseX = -9999;
    let mouseY = -9999;
    let lastMoveTime = 0;
    let raf = 0;

    const PROXIMITY_RADIUS = 280;
    const IDLE_THRESHOLD = 2000;
    const FADE_DURATION = 800;

    // Cache label centers — re-measure on scroll/resize, not every frame
    let labelCenters: { cx: number; cy: number }[] = [];
    let cachedElements: HTMLElement[] = [];

    function measureLabels() {
      const container = labelsRef.current;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      const labels = container.children as HTMLCollectionOf<HTMLElement>;
      labelCenters = [];
      cachedElements = [];
      for (let i = 0; i < labels.length; i++) {
        const el = labels[i];
        cachedElements.push(el);
        labelCenters.push({
          cx: containerRect.left + el.offsetLeft + el.offsetWidth / 2,
          cy: containerRect.top + el.offsetTop + el.offsetHeight / 2,
        });
      }
    }

    const onPointerMove = (e: PointerEvent) => {
      if (e.clientX !== mouseX || e.clientY !== mouseY) {
        lastMoveTime = performance.now();
      }
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    let lastScrollY = -1;
    function tick() {
      // Re-measure when scroll position changes (container moves on screen)
      const sy = window.scrollY;
      if (sy !== lastScrollY || labelCenters.length === 0) {
        measureLabels();
        lastScrollY = sy;
      }

      const idle = performance.now() - lastMoveTime;
      const fadeFactor =
        idle < IDLE_THRESHOLD
          ? 1
          : Math.max(0, 1 - (idle - IDLE_THRESHOLD) / FADE_DURATION);

      for (let i = 0; i < cachedElements.length; i++) {
        const { cx, cy } = labelCenters[i];
        const dx = cx - mouseX;
        const dy = cy - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const boost = Math.max(0, 1 - dist / PROXIMITY_RADIUS) * fadeFactor;
        cachedElements[i].style.setProperty("--cursor-boost", String(boost));
      }

      raf = requestAnimationFrame(tick);
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("resize", measureLabels);
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", measureLabels);
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const handleScroll = () => {
      const rect = section.getBoundingClientRect();
      const sectionHeight = section.offsetHeight;
      const viewportH = window.innerHeight;
      const scrolled = -rect.top;
      const scrollableDistance = sectionHeight - viewportH;
      scrollDistRef.current = scrollableDistance;
      const raw = scrollableDistance <= 0 ? 1 : scrolled / scrollableDistance;
      setRawProgress(raw);
      setProgress(Math.min(Math.max(raw, 0), 1));

      const midScreen = viewportH * 0.5;
      setSectionInView(rect.top < midScreen && rect.bottom > midScreen);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Camera position: dwell on first project, then lerp across the rest
  const DWELL = 0.15; // first 15% of scroll stays parked on project 1
  const firstX = wildProjects[0].x;
  const lastX = wildProjects[wildProjects.length - 1].x;
  const panProgress = Math.max(0, (progress - DWELL) / (1 - DWELL));
  const cameraX = firstX + panProgress * (lastX - firstX);
  const tx = -cameraX + viewport.w / 2;

  // Offset so x-axis continues from where ProjectSection ended
  const lastWaypoint = cameraWaypoints[cameraWaypoints.length - 1];
  const displayX = cameraX + lastWaypoint.x;
  const displayTx = -displayX + viewport.w / 2;

  // Find the closest project and write highlight text
  let closestProject = wildProjects[0];
  let closestDist = Infinity;
  for (const project of wildProjects) {
    const dist = Math.abs(project.x - cameraX);
    if (dist < closestDist) {
      closestDist = dist;
      closestProject = project;
    }
  }
  const focusIntensity = sectionInView
    ? Math.max(0, 1 - closestDist / FOCUS_RADIUS)
    : 0;
  const isMobile = viewport.w > 0 && viewport.w < 768;
  if (!isMobile && sectionInView) {
    highlightRef.current = {
      text: closestProject.title,
      intensity: focusIntensity,
      owner: "wild",
    };
  } else if (highlightRef.current.owner === "wild") {
    highlightRef.current = { text: "", intensity: 0 };
  }
  // ── Y-axis management ──
  // Y-axis uses scroll position (0 at page top). During horizontal scroll,
  // lock it so the y-axis stays fixed while only x changes.
  if (!isMobile && viewport.w > 0) {
    if (rawProgress >= 0 && rawProgress <= 1) {
      // Horizontal scroll active — lock Y at the scroll position on entry
      if (lockedYRef.current === null) {
        lockedYRef.current = window.scrollY;
      }
      yAxisRef.current = { y: lockedYRef.current, active: true };
    } else if (rawProgress > 1 && lockedYRef.current !== null) {
      // Past InTheWild — continue from locked Y plus additional scroll
      const extraPx = (rawProgress - 1) * (scrollDistRef.current || 1);
      yAxisRef.current = { y: lockedYRef.current + extraPx, active: true };
    } else {
      // Before InTheWild or past with no lock — GridTicks uses scrollY directly
      lockedYRef.current = null;
      yAxisRef.current = { y: 0, active: false };
    }
  }

  // ── Crosshair & X-axis ──
  if (!isMobile && sectionInView) {
    const displayY = yAxisRef.current.active
      ? yAxisRef.current.y
      : window.scrollY;
    crosshairRef.current = {
      label: `${Math.round(displayX)}, ${Math.round(displayY)}`,
      focused: false,
      visible: true,
      owner: "wild",
    };
    xAxisRef.current = {
      cameraX: displayX,
      translateX: displayTx,
      visible: true,
    };
  } else if (
    !isMobile &&
    !sectionInView &&
    crosshairRef.current.owner === "wild"
  ) {
    crosshairRef.current = { label: "", focused: false, visible: false };
    xAxisRef.current = { cameraX: 0, translateX: 0, visible: false };
  }

  // ── Render both layouts; CSS picks the right one (zero layout shift) ──
  return (
    <section
      ref={sectionRef}
      id="wild"
      aria-label="Professional work"
      className="relative scroll-mt-14"
    >
      {/* ── Mobile / Reduced-motion: vertical stack ──
          Visible on < md, or on md+ when user prefers reduced motion */}
      <div className="px-4 py-24 md:motion-safe:hidden">
        <div className="mb-12 flex justify-center">
          <SectionTitleCard title="In the Wild" rotate={1.5} tapeColor="rose" />
        </div>
        <div className="mx-auto flex max-w-[420px] flex-col gap-36">
          {wildProjects.map((project) => (
            <MobileWildCard key={project.title} project={project} />
          ))}
        </div>
      </div>

      {/* ── Desktop: horizontal panning world ──
          Hidden on < md, and hidden when user prefers reduced motion */}
      <div className="hidden h-[400vh] md:motion-safe:block">
        {/* Section title — static, scrolls away naturally */}
        <div className="flex items-center justify-center pt-24">
          <SectionTitleCard title="In the Wild" rotate={1.5} tapeColor="rose" />
        </div>

        <div className="sticky top-0 h-svh w-full overflow-hidden">
          {/* Gate on real viewport so the world doesn't render at the wrong
              translateX before useEffect measures dimensions */}
          <div
            className="absolute top-0 h-full will-change-transform"
            style={{
              transform: `translateX(${tx}px)`,
              ...(viewport.w === 0 && { opacity: 0 }),
            }}
          >
            {/* Floating labels */}
            <div ref={labelsRef}>
              {wildLabels.map((label, i) => {
                const seed = Math.sin(i * 73.17 + 3.91) * 43758.5453;
                const phase = (seed - Math.floor(seed)) * 10;
                const driftDuration = 6 + (i % 4) * 1.6;

                return (
                  <FloatingLabel
                    key={i}
                    text={label.text}
                    size={label.size}
                    baseOpacity={0.28}
                    x={label.x}
                    y={`calc(50% + ${label.y}px)`}
                    driftDuration={driftDuration}
                    driftPhase={phase}
                  />
                );
              })}
            </div>

            {/* Connection lines between projects */}
            <svg
              className="pointer-events-none absolute top-1/2 left-0"
              style={{ overflow: "visible" }}
            >
              {wildProjects.slice(0, -1).map((project, i) => {
                const next = wildProjects[i + 1];
                const midX = (project.x + next.x) / 2;
                const dist = Math.abs(midX - cameraX);
                const baseOpacity = Math.max(0, 1 - dist / 1200) * 0.4;

                const lineLen = Math.abs(next.x - project.x);
                const n = wildProjects.length - 1;
                const lineStartProgress = i / n;
                const lineEndProgress = (i + 1) / n;
                const lineRange = lineEndProgress - lineStartProgress;

                let fillFraction = 0;
                if (lineRange > 0) {
                  fillFraction = Math.max(
                    0,
                    Math.min(1, (progress - lineStartProgress) / lineRange),
                  );
                }

                const filledLen = fillFraction * lineLen;
                const unfilledLen = lineLen - filledLen;

                return (
                  <g key={i}>
                    <line
                      x1={project.x}
                      y1={0}
                      x2={next.x}
                      y2={0}
                      stroke="currentColor"
                      strokeWidth="1"
                      className="text-border-hairline"
                      style={{ opacity: baseOpacity }}
                    />
                    {filledLen > 0 && (
                      <line
                        x1={project.x}
                        y1={0}
                        x2={next.x}
                        y2={0}
                        stroke="var(--accent)"
                        strokeWidth="2"
                        strokeDasharray={`${filledLen} ${unfilledLen}`}
                        strokeLinecap="round"
                        style={{ opacity: Math.max(baseOpacity, 0.6) }}
                      />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Project cards */}
            {wildProjects.map((project) => {
              const dist = Math.abs(project.x - cameraX);
              const focus = Math.max(0, 1 - dist / FOCUS_RADIUS);
              const offset: [number, number] = [
                Math.max(-1, Math.min(1, (cameraX - project.x) / FOCUS_RADIUS)),
                0,
              ];

              return (
                <div
                  key={project.title}
                  className="absolute"
                  style={{
                    left: project.x,
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <WildCardFragments
                    project={project}
                    focus={focus}
                    cameraOffset={offset}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
