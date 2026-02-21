"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import {
  projects,
  cameraWaypoints,
  floatingLabels,
  connectionLines,
} from "./constants";
import { interpolatePath, getSegmentInfo } from "./cameraPath";
import ProjectCard, { MobileProjectCard } from "./ProjectCard";
import type { HighlightData } from "../HeroSection/AsciiAmbient";
import SectionTitleCard from "~/components/SectionTitleCard";

const MOBILE_BREAKPOINT = 768;

const LABEL_SIZES = {
  sm: "text-[16px] tracking-[0.1em]",
  md: "text-[24px] tracking-[0.06em]",
  lg: "text-[34px] tracking-[0.04em] font-[300]",
} as const;

export default function ProjectSection({
  highlightRef,
}: {
  highlightRef: RefObject<HighlightData>;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [sectionInView, setSectionInView] = useState(false);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const updateViewport = () =>
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  // Imperative cursor proximity — updates label DOM directly, no re-renders
  useEffect(() => {
    let mouseX = -9999;
    let mouseY = -9999;
    let raf = 0;

    const onPointerMove = (e: PointerEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const PROXIMITY_RADIUS = 280;

    function tick() {
      const container = labelsRef.current;
      if (container) {
        const labels = container.children as HTMLCollectionOf<HTMLElement>;
        for (let i = 0; i < labels.length; i++) {
          const el = labels[i];
          const rect = el.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const dx = cx - mouseX;
          const dy = cy - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const boost = Math.max(0, 1 - dist / PROXIMITY_RADIUS);

          el.style.setProperty("--cursor-boost", String(boost));
        }
      }
      raf = requestAnimationFrame(tick);
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
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
      const p = Math.min(Math.max(scrolled / scrollableDistance, 0), 1);
      setProgress(p);

      // Section is "in view" when its top is above mid-viewport AND its bottom is below mid-viewport
      const midScreen = viewportH * 0.5;
      setSectionInView(rect.top < midScreen && rect.bottom > midScreen);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const camera = interpolatePath(cameraWaypoints, progress);
  const { index: rawIndex } = getSegmentInfo(cameraWaypoints.length, progress);
  const activeIndex = Math.max(0, Math.min(projects.length - 1, rawIndex));

  const tx = -camera.x + viewport.w / 2;
  const ty = -camera.y + viewport.h / 2;

  const sectionVisible = sectionInView;
  const activeProject = projects[activeIndex];
  const activeDx = activeProject.position.x - camera.x;
  const activeDy = activeProject.position.y - camera.y;
  const activeDist = Math.sqrt(activeDx * activeDx + activeDy * activeDy);
  const focusIntensity = sectionVisible ? Math.max(0, 1 - activeDist / 400) : 0;
  highlightRef.current = {
    text: sectionVisible ? activeProject.title : "",
    intensity: focusIntensity,
  };

  const isMobile = viewport.w > 0 && viewport.w < MOBILE_BREAKPOINT;
  const [prefersReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  // ── Mobile or reduced-motion: vertical scrolling list (no parallax, no scatter) ──
  if (isMobile || prefersReducedMotion) {
    return (
      <section
        ref={sectionRef}
        id="work"
        aria-label="Projects"
        className="relative scroll-mt-14 px-4 py-20"
      >
        <div className="mb-12 flex justify-center">
          <SectionTitleCard title="Projects" rotate={-2} tapeColor="teal" />
        </div>
        <div
          className={`mx-auto flex flex-col gap-16 ${isMobile ? "max-w-[400px]" : "max-w-[500px]"}`}
        >
          {projects.map((project, i) => (
            <MobileProjectCard
              key={project.title}
              project={project}
              index={i}
            />
          ))}
        </div>
      </section>
    );
  }

  // Crosshair intensity
  const crosshairFocused = focusIntensity > 0.8;
  const crosshairOpacity = crosshairFocused ? 0.25 : 0.12;

  // ── Desktop: 2D panning world ──
  return (
    <section
      ref={sectionRef}
      id="work"
      aria-label="Projects"
      className="relative h-[1050vh] scroll-mt-14"
    >
      {/* Section title — static, scrolls away naturally */}
      <div className="flex items-center justify-center py-24">
        <SectionTitleCard title="Projects" rotate={-2} tapeColor="teal" />
      </div>

      <div className="sticky top-0 h-svh w-full overflow-hidden">
        {/* World container */}
        <div
          className="absolute will-change-transform"
          style={{ transform: `translate(${tx}px, ${ty}px)` }}
        >
          {/* Connection lines between related projects */}
          <svg
            className="pointer-events-none absolute top-0 left-0"
            style={{
              width: 2000,
              height: 3000,
              left: -500,
              top: -500,
              overflow: "visible",
            }}
          >
            {connectionLines.map(([a, b], i) => {
              const pa = projects[a].position;
              const pb = projects[b].position;
              const midX = (pa.x + pb.x) / 2;
              const midY = (pa.y + pb.y) / 2;
              const dist = Math.sqrt(
                (midX - camera.x) ** 2 + (midY - camera.y) ** 2,
              );
              const baseOpacity = Math.max(0, 1 - dist / 900) * 0.4;

              // Line length for dasharray
              const dx = pb.x - pa.x;
              const dy = pb.y - pa.y;
              const lineLen = Math.sqrt(dx * dx + dy * dy);

              // Fill progress: how much of this line is "completed"
              // Based on scroll progress relative to the waypoint indices
              const startIdx = Math.min(a, b);
              const endIdx = Math.max(a, b);
              const n = cameraWaypoints.length - 1;
              const lineStartProgress = startIdx / n;
              const lineEndProgress = endIdx / n;
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
                  {/* Background track */}
                  <line
                    x1={pa.x + 500}
                    y1={pa.y + 500}
                    x2={pb.x + 500}
                    y2={pb.y + 500}
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-[#a3a3a3] dark:text-[#525252]"
                    style={{ opacity: baseOpacity }}
                  />
                  {/* Filled portion */}
                  {filledLen > 0 && (
                    <line
                      x1={pa.x + 500}
                      y1={pa.y + 500}
                      x2={pb.x + 500}
                      y2={pb.y + 500}
                      stroke="#2d7d9a"
                      strokeWidth="2"
                      strokeDasharray={`${filledLen} ${unfilledLen}`}
                      strokeLinecap="round"
                      style={{
                        opacity: Math.max(baseOpacity, 0.6),
                      }}
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Floating labels — skills, annotations, section header */}
          <div ref={labelsRef}>
            {floatingLabels.map((label, i) => {
              const visibility = 0.7;

              // Deterministic per-label float parameters
              const seed = Math.sin(i * 73.17 + 3.91) * 43758.5453;
              const phase = (seed - Math.floor(seed)) * 10;
              const driftDuration = 6 + (i % 5) * 1.4;

              return (
                <div
                  key={i}
                  className={`floating-label pointer-events-none absolute font-(family-name:--font-source-code-pro) uppercase ${LABEL_SIZES[label.size]}`}
                  style={{
                    ["--cursor-boost" as string]: "0",
                    ["--base-opacity" as string]: String(visibility * 0.4),
                    left: label.position.x,
                    top: label.position.y,
                    animation: `labelFloat ${driftDuration}s ease-in-out ${-phase}s infinite`,
                  }}
                >
                  {label.text}
                </div>
              );
            })}
          </div>

          {/* Project cards — always visible, no fade */}
          {projects.map((project, index) => {
            const dx = project.position.x - camera.x;
            const dy = project.position.y - camera.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const focus = sectionVisible ? Math.max(0, 1 - dist / 600) : 0;

            return (
              <div
                key={project.title}
                className="absolute"
                style={{
                  left: project.position.x,
                  top: project.position.y,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <ProjectCard project={project} index={index} focus={focus} />
              </div>
            );
          })}
        </div>

        {/* Crosshair overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ transition: "opacity 300ms" }}
        >
          <div
            className="absolute top-1/2 left-0 h-px w-full"
            style={{
              background: "#737373",
              opacity: crosshairOpacity,
              transition: "opacity 300ms",
            }}
          />
          <div
            className="absolute top-0 left-1/2 h-full w-px"
            style={{
              background: "#737373",
              opacity: crosshairOpacity,
              transition: "opacity 300ms",
            }}
          />
          <div
            className="absolute top-1/2 left-1/2 translate-x-2 -translate-y-5 font-(family-name:--font-source-code-pro) text-[10px] text-[#737373]"
            style={{
              opacity: crosshairFocused ? 0.6 : 0.35,
              transition: "opacity 300ms",
            }}
          >
            {Math.round(camera.x)}, {Math.round(camera.y)}
          </div>
        </div>

        {/* ── Grid ticks along edges ── */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Top edge — X axis ticks */}
          {(() => {
            const TICK_INTERVAL = 200;
            const startX =
              Math.floor(
                camera.x / TICK_INTERVAL - viewport.w / (2 * TICK_INTERVAL) - 1,
              ) * TICK_INTERVAL;
            const endX =
              Math.ceil(
                camera.x / TICK_INTERVAL + viewport.w / (2 * TICK_INTERVAL) + 1,
              ) * TICK_INTERVAL;
            const ticks = [];
            for (let wx = startX; wx <= endX; wx += TICK_INTERVAL) {
              const screenX = wx + tx;
              if (screenX < -20 || screenX > viewport.w + 20) continue;
              ticks.push(
                <div
                  key={`tx-${wx}`}
                  className="absolute top-0"
                  style={{ left: screenX }}
                >
                  <div className="grid-tick h-[8px] w-px" />
                  <span className="grid-tick-label absolute top-[10px] left-1 font-(family-name:--font-source-code-pro) text-[9px]">
                    {wx}
                  </span>
                </div>,
              );
            }
            return ticks;
          })()}
          {/* Left edge — Y axis ticks */}
          {(() => {
            const TICK_INTERVAL = 200;
            const startY =
              Math.floor(
                camera.y / TICK_INTERVAL - viewport.h / (2 * TICK_INTERVAL) - 1,
              ) * TICK_INTERVAL;
            const endY =
              Math.ceil(
                camera.y / TICK_INTERVAL + viewport.h / (2 * TICK_INTERVAL) + 1,
              ) * TICK_INTERVAL;
            const ticks = [];
            for (let wy = startY; wy <= endY; wy += TICK_INTERVAL) {
              const screenY = wy + ty;
              if (screenY < -20 || screenY > viewport.h + 20) continue;
              ticks.push(
                <div
                  key={`ty-${wy}`}
                  className="absolute left-0"
                  style={{ top: screenY }}
                >
                  <div className="grid-tick h-px w-[8px]" />
                  <span className="grid-tick-label absolute top-0.5 left-[10px] font-(family-name:--font-source-code-pro) text-[9px]">
                    {wy}
                  </span>
                </div>,
              );
            }
            return ticks;
          })()}
        </div>

        {/* Progress track — clickable dots */}
        <div className="absolute top-1/2 right-4 flex -translate-y-1/2 flex-col items-center gap-0">
          {/* Track line */}
          <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[#d4d4d4] dark:bg-[#404040]" />

          {projects.map((_, i) => {
            const dotProgress = i / (cameraWaypoints.length - 1);
            const isCurrent = i === activeIndex;
            const isPast = i < activeIndex;

            return (
              <button
                key={i}
                type="button"
                aria-label={`Go to project ${projects[i].title}`}
                className="group relative flex h-10 w-10 cursor-pointer items-center justify-center"
                onClick={() => {
                  const section = sectionRef.current;
                  if (!section) return;
                  const sectionTop = section.offsetTop;
                  const sectionHeight = section.offsetHeight;
                  const viewportH = window.innerHeight;
                  const scrollableDistance = sectionHeight - viewportH;
                  const targetScroll =
                    sectionTop + dotProgress * scrollableDistance;
                  window.scrollTo({ top: targetScroll, behavior: "smooth" });
                }}
              >
                <span
                  className="block rounded-full transition-all duration-200 group-hover:scale-150"
                  style={{
                    width: isCurrent ? 10 : 6,
                    height: isCurrent ? 10 : 6,
                    backgroundColor: isCurrent
                      ? "#2d7d9a"
                      : isPast
                        ? "#2d7d9a"
                        : "#d4d4d4",
                    opacity: isCurrent ? 1 : isPast ? 0.5 : 0.6,
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
