"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import PlayPauseButton from "~/components/PlayPauseButton";
import SectionTitleCard from "~/components/SectionTitleCard";
import type { HighlightData } from "~/components/HeroSection/AsciiAmbient";

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
    title: "Immersive Hero",
    company: "Mercury",
    caption: "Video scrub animation with a seamless transition.",
    videoSrc:
      "https://res.cloudinary.com/dunbkcyqq/video/upload/f_auto,q_auto,ac_none,dpr_auto/immersize-hero.mov",
    rotate: -2,
    x: 0,
  },
  {
    title: "Gamified 404 Page",
    company: "Mercury",
    caption:
      "Sliding puzzle easter egg to ease the tension of possible broken links.",
    videoSrc:
      "https://res.cloudinary.com/dunbkcyqq/video/upload/f_auto,q_auto,w_1184,h_646,ac_none,dpr_auto/404-puzzle.mov",
    rotate: 1.5,
    x: 2800,
  },
  {
    title: "Fluid Simulation Button",
    company: "Mercury",
    caption: "Delightful hover interaction inviting the user to click.",
    videoSrc:
      "https://res.cloudinary.com/dunbkcyqq/video/upload/f_auto,q_auto,ac_none,dpr_auto/fluid-button.mov",
    rotate: -1,
    x: 5600,
  },
];

const FOCUS_RADIUS = 1400;
const SCATTER_SCALE = 1.5;

/* ── Helpers ── */

const FOCUS_SNAP = 0.5;

function fragmentTransform(
  offsetX: number,
  offsetY: number,
  rotate: number,
  focus: number,
) {
  const landed = focus > FOCUS_SNAP;
  const ox = landed ? offsetX : offsetX * SCATTER_SCALE;
  const oy = landed ? offsetY : offsetY * SCATTER_SCALE;
  const r = landed ? rotate * 0.35 : rotate;
  return `translate(calc(-50% + ${ox}px), calc(-50% + ${oy}px)) rotate(${r}deg)`;
}

function childScatter(
  scatterX: number,
  scatterY: number,
  scatterRotate: number,
  focus: number,
) {
  const landed = focus > FOCUS_SNAP;
  const ox = landed ? 0 : scatterX;
  const oy = landed ? 0 : scatterY;
  const r = landed ? 0 : scatterRotate;
  return `translate(${ox}px, ${oy}px) rotate(${r}deg)`;
}

/* ── Video with intersection-based autoplay ── */

function WildVideo({ src, paused }: { src: string; paused: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const observerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.3 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

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
        className="h-full w-full object-contain"
      />
    </div>
  );
}

/* ── Wild card — polaroid + info fragments that scatter/converge ── */

function WildCardFragments({
  project,
  focus,
}: {
  project: WildProject;
  focus: number;
}) {
  const [paused, setPaused] = useState(false);
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const imageTransform = fragmentTransform(-20, -40, project.rotate, focus);
  const infoTransform = fragmentTransform(
    -100,
    500,
    -project.rotate * 0.5,
    focus,
  );
  const tapeScatter = childScatter(0, -70, 12, focus);
  const playPauseScatter = childScatter(70, 30, -8, focus);

  const isVideo = !!project.videoSrc;

  return (
    <div className="relative h-[900px] w-[min(1400px,95vw)]">
      {/* Polaroid */}
      <div
        className="polaroid-card absolute top-1/2 left-1/2 w-[min(1280px,90vw)]"
        style={{ transform: imageTransform }}
      >
        {/* Tape */}
        <div
          className="polaroid-tape polaroid-tape-teal"
          style={{ width: 88, rotate: "3deg", transform: tapeScatter }}
        />
        {/* Play/Pause on polaroid */}
        {isVideo && !reducedMotion && (
          <PlayPauseButton
            paused={paused}
            onToggle={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setPaused((p) => !p);
            }}
            className="absolute right-6 bottom-20 z-3"
            style={{ transform: playPauseScatter, rotate: "-3deg" }}
          />
        )}
        <div className="p-3 pb-0">
          {isVideo ? (
            <div className="relative aspect-16/10 overflow-hidden bg-[#171717]">
              <WildVideo src={project.videoSrc} paused={paused} />
            </div>
          ) : (
            <div className="flex aspect-16/10 items-center justify-center bg-[#171717]">
              <span className="font-(family-name:--font-source-code-pro) text-base text-[#525252]">
                Coming soon
              </span>
            </div>
          )}
        </div>
        <div className="px-4 pt-3 pb-5">
          <div className="flex items-baseline justify-between gap-3">
            <p className="polaroid-title font-(family-name:--font-source-code-pro) text-[17px] tracking-[0.01em]">
              {project.title}
            </p>
            <span className="wild-company shrink-0 font-(family-name:--font-source-code-pro) text-[12px] tracking-[0.08em] uppercase">
              {project.company}
            </span>
          </div>
        </div>
      </div>

      {/* Info fragment */}
      <div
        className="info-fragment absolute top-1/2 left-1/2 z-2 flex w-[min(400px,72vw)] flex-col gap-3 px-6 py-5"
        style={{ transform: infoTransform }}
      >
        <div
          className="info-pin"
          style={{ transform: childScatter(0, -50, 16, focus) }}
        />
        <p className="info-desc text-[clamp(1rem,1.2vw,1.1rem)] leading-[1.7] font-light">
          {project.caption}
        </p>
      </div>
    </div>
  );
}

/* ── Mobile wild card — vertical stack like MobileProjectCard ── */

function MobileWildCard({ project }: { project: WildProject }) {
  const [paused, setPaused] = useState(false);
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isVideo = !!project.videoSrc;

  return (
    <div className="flex flex-col gap-4">
      {/* Polaroid */}
      <div
        className="polaroid-card relative mx-auto w-full max-w-[400px]"
        style={{ rotate: `${project.rotate * 0.4}deg` }}
      >
        <div
          className="polaroid-tape polaroid-tape-teal"
          style={{ width: 88, rotate: "3deg" }}
        />
        <div className="p-2.5 pb-0">
          {isVideo ? (
            <div className="relative aspect-16/10 overflow-hidden bg-[#171717]">
              <WildVideo src={project.videoSrc} paused={paused} />
            </div>
          ) : (
            <div className="flex aspect-16/10 items-center justify-center bg-[#171717]">
              <span className="font-(family-name:--font-source-code-pro) text-base text-[#525252]">
                Coming soon
              </span>
            </div>
          )}
        </div>
        <div className="px-3 pt-2.5 pb-4">
          <div className="flex items-baseline justify-between gap-3">
            <p className="polaroid-title font-(family-name:--font-source-code-pro) text-xl tracking-[0.01em]">
              {project.title}
            </p>
            <span className="wild-company shrink-0 font-(family-name:--font-source-code-pro) text-[14px] tracking-[0.08em] uppercase">
              {project.company}
            </span>
          </div>
        </div>
      </div>

      {/* Play/Pause */}
      {isVideo && !reducedMotion && (
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
        className="info-fragment relative mx-auto flex w-full max-w-[380px] flex-col gap-3 px-5 py-4"
        style={{ rotate: `${-project.rotate * 0.3}deg` }}
      >
        <div className="info-pin" />
        <p className="info-desc text-base leading-[1.7] font-light">
          {project.caption}
        </p>
      </div>
    </div>
  );
}

/* ── Floating labels in the horizontal world ── */

const wildLabels = [
  { text: "production code", x: -600, y: -200, size: "lg" as const },
  { text: "shipped", x: 800, y: 220, size: "md" as const },
  { text: "design engineering", x: 3500, y: -220, size: "lg" as const },
  { text: "craft at scale", x: 1500, y: -170, size: "md" as const },
  { text: "pixel perfect", x: 4500, y: 200, size: "sm" as const },
  { text: "interaction design", x: 6000, y: -200, size: "lg" as const },
];

const LABEL_SIZES = {
  sm: "text-[16px] tracking-[0.1em]",
  md: "text-[20px] tracking-[0.06em]",
  lg: "text-[28px] tracking-[0.04em] font-light",
} as const;

/* ── Main section ── */

export default function InTheWild({
  highlightRef,
}: {
  highlightRef: RefObject<HighlightData>;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const [sectionInView, setSectionInView] = useState(false);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const update = () =>
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
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

      const midScreen = viewportH * 0.5;
      setSectionInView(rect.top < midScreen && rect.bottom > midScreen);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Camera position: dwell on first project, then lerp across the rest
  const DWELL = 0.15; // first 15% of scroll stays parked on project 1
  const firstX = wildProjects[0].x;
  const lastX = wildProjects[wildProjects.length - 1].x;
  const panProgress = Math.max(0, (progress - DWELL) / (1 - DWELL));
  const cameraX = firstX + panProgress * (lastX - firstX);
  const tx = -cameraX + viewport.w / 2;

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
  highlightRef.current = {
    text: sectionInView ? closestProject.title : "",
    intensity: focusIntensity,
  };

  // Reduced motion: vertical stack
  if (reducedMotion || (viewport.w > 0 && viewport.w < 768)) {
    return (
      <section
        id="wild"
        aria-label="Professional work"
        className="relative scroll-mt-14 px-4 py-24"
      >
        <div className="mb-12 md:px-4 lg:px-12">
          <h2 className="text-text text-[clamp(2rem,5vw,4rem)] font-light tracking-[-0.02em]">
            In the wild
          </h2>
          <p className="wild-caption mt-3 max-w-[500px] text-base leading-[1.6] font-light">
            A few things I&apos;ve built professionally. Videos only — no source
            code.
          </p>
        </div>
        <div className="mx-auto flex max-w-[420px] flex-col gap-16">
          {wildProjects.map((project) => (
            <MobileWildCard key={project.title} project={project} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      id="wild"
      aria-label="Professional work"
      className="relative h-[400vh] scroll-mt-14"
    >
      {/* Section title — static, scrolls away naturally */}
      <div className="flex items-center justify-center py-24">
        <SectionTitleCard
          title="In the Wild"
          subtitle="Built professionally"
          rotate={1.5}
          tapeColor="rose"
        />
      </div>

      <div className="sticky top-0 h-svh w-full overflow-hidden">
        {/* World container — pans horizontally */}
        <div
          className="absolute top-0 h-full will-change-transform"
          style={{ transform: `translateX(${tx}px)` }}
        >
          {/* Floating labels */}
          {wildLabels.map((label, i) => {
            const seed = Math.sin(i * 73.17 + 3.91) * 43758.5453;
            const phase = (seed - Math.floor(seed)) * 10;
            const driftDuration = 6 + (i % 4) * 1.6;

            return (
              <div
                key={i}
                className={`floating-label pointer-events-none absolute font-(family-name:--font-source-code-pro) uppercase ${LABEL_SIZES[label.size]}`}
                style={{
                  ["--cursor-boost" as string]: "0",
                  ["--base-opacity" as string]: "0.28",
                  left: label.x,
                  top: `calc(50% + ${label.y}px)`,
                  animation: `labelFloat ${driftDuration}s ease-in-out ${-phase}s infinite`,
                }}
              >
                {label.text}
              </div>
            );
          })}

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
                    className="text-[#a3a3a3] dark:text-[#525252]"
                    style={{ opacity: baseOpacity }}
                  />
                  {filledLen > 0 && (
                    <line
                      x1={project.x}
                      y1={0}
                      x2={next.x}
                      y2={0}
                      stroke="#2d7d9a"
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
                <WildCardFragments project={project} focus={focus} />
              </div>
            );
          })}
        </div>


        {/* Crosshair */}
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute top-0 left-1/2 h-full w-px"
            style={{ background: "#737373", opacity: 0.1 }}
          />
          <div
            className="absolute top-1/2 left-0 h-px w-full"
            style={{ background: "#737373", opacity: 0.1 }}
          />
          <div
            className="absolute top-1/2 left-1/2 translate-x-2 -translate-y-5 font-(family-name:--font-source-code-pro) text-[10px] text-[#737373]"
            style={{ opacity: 0.35 }}
          >
            {Math.round(cameraX)}
          </div>
        </div>
      </div>
    </section>
  );
}
