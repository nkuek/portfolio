"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import {
  projects,
  cameraWaypoints,
  floatingLabels,
  connectionLines,
} from "./constants";
import { interpolatePath } from "./cameraPath";
import ProjectCard, { MobileProjectCard } from "./ProjectCard";
import type { HighlightData } from "../HeroSection/AsciiAmbient";
import SectionTitleCard from "~/components/SectionTitleCard";
import type { CrosshairData } from "~/components/Crosshair";
import type { XAxisData } from "~/components/XAxisTicks";
import { LABEL_SIZES } from "~/utils/scatterTransforms";

const MOBILE_BREAKPOINT = 768;

export default function ProjectSection({
  highlightRef,
  crosshairRef,
  xAxisRef,
}: {
  highlightRef: RefObject<HighlightData>;
  crosshairRef: RefObject<CrosshairData>;
  xAxisRef: RefObject<XAxisData>;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [sectionInView, setSectionInView] = useState(false);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const [scrollYCenter, setScrollYCenter] = useState(0);

  useEffect(() => {
    const updateViewport = () =>
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  // Imperative cursor proximity — updates label DOM directly, no re-renders
  // Fades spotlight out after cursor goes idle, returning to dappled-sunlight base
  useEffect(() => {
    let mouseX = -9999;
    let mouseY = -9999;
    let lastMoveTime = 0;
    let raf = 0;

    const PROXIMITY_RADIUS = 280;
    const IDLE_THRESHOLD = 2000; // ms before spotlight starts fading
    const FADE_DURATION = 800; // ms to fully dissolve

    const onPointerMove = (e: PointerEvent) => {
      // Only reset idle timer if cursor actually moved (scroll shifts elements
      // under a stationary cursor, firing pointermove without real movement)
      if (e.clientX !== mouseX || e.clientY !== mouseY) {
        lastMoveTime = performance.now();
      }
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    function tick() {
      const container = labelsRef.current;
      if (container) {
        const idle = performance.now() - lastMoveTime;
        const fadeFactor =
          idle < IDLE_THRESHOLD
            ? 1
            : Math.max(0, 1 - (idle - IDLE_THRESHOLD) / FADE_DURATION);

        const labels = container.children as HTMLCollectionOf<HTMLElement>;
        for (let i = 0; i < labels.length; i++) {
          const el = labels[i];
          const rect = el.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const dx = cx - mouseX;
          const dy = cy - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const boost = Math.max(0, 1 - dist / PROXIMITY_RADIUS) * fadeFactor;

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
      const p =
        scrollableDistance <= 0
          ? 1
          : Math.min(Math.max(scrolled / scrollableDistance, 0), 1);
      setProgress(p);
      // Section is "in view" when its top is above mid-viewport AND its bottom is below mid-viewport
      const midScreen = viewportH * 0.5;
      setSectionInView(rect.top < midScreen && rect.bottom > midScreen);
      setScrollYCenter(midScreen);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const dotCount = projects.length;
  const last = dotCount - 1;

  // Track progress already equals section progress, but the *dot centers* start/end
  // are inset by half a button (20px). Since we visually inset the bar, we should
  // also compute the active dot from the same track-space progress.
  //
  // Easiest: map progress to a continuous dot index, then round to nearest dot.
  const dotFloat = progress * last;
  const activeDotIndex = Math.round(dotFloat);
  const activeIndex = Math.max(
    0,
    Math.min(projects.length - 1, activeDotIndex),
  );

  const camera = interpolatePath(cameraWaypoints, progress);

  const tx = -camera.x + viewport.w / 2;
  const ty = -camera.y + viewport.h / 2;

  const activeProject = projects[activeIndex];
  const activeDx = activeProject.position.x - camera.x;
  const activeDy = activeProject.position.y - camera.y;
  const activeDist = Math.sqrt(activeDx * activeDx + activeDy * activeDy);
  const isMobile = viewport.w > 0 && viewport.w < MOBILE_BREAKPOINT;
  const focusIntensity = sectionInView ? Math.max(0, 1 - activeDist / 400) : 0;
  highlightRef.current = {
    text: !isMobile && sectionInView ? activeProject.title : "",
    intensity: isMobile ? 0 : focusIntensity,
  };
  const crosshairFocused = focusIntensity > 0.8;
  if (!isMobile && sectionInView) {
    crosshairRef.current = {
      label: `${Math.round(camera.x)}, ${scrollYCenter}`,
      focused: crosshairFocused,
      visible: true,
    };
    xAxisRef.current = { cameraX: camera.x, translateX: tx, visible: true };
  } else if (!isMobile && !sectionInView && crosshairRef.current.visible) {
    crosshairRef.current = { label: "", focused: false, visible: false };
    xAxisRef.current = { cameraX: 0, translateX: 0, visible: false };
  }
  // ── Render both layouts; CSS picks the right one (zero layout shift) ──
  return (
    <section
      ref={sectionRef}
      id="work"
      aria-label="Projects"
      className="relative scroll-mt-14"
    >
      {/* ── Mobile / Reduced-motion: vertical stack ──
          Visible on < md, or on md+ when user prefers reduced motion */}
      <div className="px-4 py-20 md:motion-safe:hidden">
        <div className="mb-12 flex justify-center">
          <SectionTitleCard title="Projects" rotate={-2} tapeColor="teal" />
        </div>
        <div className="mx-auto flex max-w-[400px] flex-col gap-36 md:max-w-[500px]">
          {projects.map((project, i) => (
            <MobileProjectCard
              key={project.title}
              project={project}
              index={i}
            />
          ))}
        </div>
      </div>

      {/* ── Desktop: 2D panning world ──
          Hidden on < md, and hidden when user prefers reduced motion */}
      <div className="hidden h-[700vh] md:motion-safe:block">
        {/* Section title — static, scrolls away naturally */}
        <div className="flex items-center justify-center pt-24">
          <SectionTitleCard title="Projects" rotate={-2} tapeColor="teal" />
        </div>

        <div className="sticky top-0 h-svh w-full overflow-clip">
          {/* Gate on real viewport so the world doesn't flash at (0,0) before
              useEffect measures dimensions (prevents CLS from hero area) */}
          {viewport.w > 0 && (
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
                // Round to 2dp so server HTML survives browser CSS normalisation without hydration drift
                // This is the classic GLSL pseudo-random hash just ported into JS
                const seed = Math.sin(i * 73.17 + 3.91) * 43758.5453;
                const phase =
                  Math.round((seed - Math.floor(seed)) * 1000) / 100;
                const driftDuration =
                  Math.round((6 + (i % 5) * 1.4) * 100) / 100;
                const baseOpacity = Math.round(visibility * 0.4 * 100) / 100;

                return (
                  <div
                    key={i}
                    className={`floating-label pointer-events-none absolute font-mono uppercase ${LABEL_SIZES[label.size]}`}
                    style={{
                      ["--cursor-boost" as string]: "0",
                      ["--base-opacity" as string]: String(baseOpacity),
                      left: `${label.position.x}px`,
                      top: `${label.position.y}px`,
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
              const focus = sectionInView ? Math.max(0, 1 - dist / 600) : 0;

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
          )}

          {/* Progress track — clickable dots */}
          <div className="absolute top-1/2 right-4 flex -translate-y-1/2 flex-col items-center gap-0">
            {/* Track line (base + fill) aligned to dot centers */}
            <div className="absolute top-5 bottom-5 left-1/2 w-px -translate-x-1/2 bg-[#d4d4d4] dark:bg-[#404040]" />
            <div
              className="absolute top-5 bottom-5 left-1/2 w-px origin-top -translate-x-1/2 bg-[#2d7d9a]"
              style={{
                transform: `translateX(-50%) scaleY(${progress})`,
                transition: "transform 80ms linear",
              }}
            />

            {projects.map((_, i) => {
              const dotProgress = i / (cameraWaypoints.length - 1);
              const isCurrent = i === activeDotIndex;
              const isPast = i < activeDotIndex;

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
      </div>
    </section>
  );
}
