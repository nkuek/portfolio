"use client";
import tapeStyles from "~/components/shared/Tape.module.css";
import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import useReducedMotion from "~/hooks/useReducedMotion";
import HeroSection from "~/components/HeroSection";

const DappledLight = dynamic(() => import("~/components/DappledLight"), {
  ssr: false,
});

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

/** Map progress to a sub-range: returns 0 before `start`, 1 after `end`, linear between. */
function ranged(progress: number, start: number, end: number) {
  return clamp((progress - start) / (end - start), 0, 1);
}

// Frame extends beyond clip-path to form the polaroid border
const FRAME_PAD_TOP = 12; // px
const FRAME_PAD_SIDE = 12; // px
const FRAME_PAD_BOTTOM = 40; // px — classic asymmetric polaroid bottom

const MOBILE_BREAKPOINT = 768;

/** Compute target clip-path insets (%) so the final polaroid matches the project
 *  card dimensions: min(760px, 60vw) wide on desktop, ~90vw on mobile, with a
 *  square image area and the classic asymmetric bottom border for the caption. */
function getTargetInsets(vw: number, vh: number) {
  const mobile = vw < MOBILE_BREAKPOINT;

  // Card (frame) width mirrors ProjectCard: min(760, 60vw) / full-width mobile
  const cardWidth = mobile ? vw * 0.9 : Math.min(760, vw * 0.6);

  // Image = card minus frame borders (FRAME_PAD_SIDE acts like p-3 padding)
  const imageFromWidth = cardWidth - 2 * FRAME_PAD_SIDE;

  // Constrain to viewport height so the card always fits with breathing room
  const minMargin = mobile ? 16 : 40;
  const imageFromHeight = vh - FRAME_PAD_TOP - FRAME_PAD_BOTTOM - 2 * minMargin;
  const imageSize = Math.min(imageFromWidth, Math.max(0, imageFromHeight));

  // Derive inset percentages from the resolved image size
  const sideInset = ((vw - imageSize) / 2 / vw) * 100;

  const cardHeight = FRAME_PAD_TOP + imageSize + FRAME_PAD_BOTTOM;
  const topOfCard = Math.max(minMargin, (vh - cardHeight) / 2);
  const topOfImage = topOfCard + FRAME_PAD_TOP;

  return {
    top: (topOfImage / vh) * 100,
    side: sideInset,
    bottom: Math.max(0, ((vh - topOfImage - imageSize) / vh) * 100),
  };
}

export default function HeroDappledZone() {
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const clipRef = useRef<HTMLDivElement>(null);
  const gradientRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const tapeRef = useRef<HTMLDivElement>(null);

  // Keep caption text in sync with color scheme
  useEffect(() => {
    const caption = captionRef.current;
    if (!caption) return;

    const update = () => {
      const scheme = document.documentElement.getAttribute("data-color-scheme");
      const dark = scheme
        ? scheme === "dark"
        : window.matchMedia("(prefers-color-scheme: dark)").matches;
      caption.textContent = `${dark ? "evening light" : "afternoon light"}, 2026`;
    };

    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-color-scheme"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    const section = sectionRef.current;
    const clip = clipRef.current;
    const gradient = gradientRef.current;
    const frame = frameRef.current;
    const caption = captionRef.current;
    const tape = tapeRef.current;
    if (!section || !clip || !gradient || !frame || !caption || !tape) return;

    const handleScroll = () => {
      const rect = section.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const stickyRange = section.offsetHeight - vh;
      if (stickyRange <= 0) return;

      const scrolledPast = -rect.top;
      const progress = clamp(scrolledPast / stickyRange, 0, 1);
      const target = getTargetInsets(vw, vh);

      // ── Clip-path: full screen → polaroid inset ──
      const top = lerp(0, target.top, progress);
      const side = lerp(0, target.side, progress);
      const bottom = lerp(0, target.bottom, progress);
      const radius = lerp(0, 3, progress);
      clip.style.clipPath = `inset(${top}% ${side}% ${bottom}% ${side}% round ${radius}px)`;

      // ── Gradient vignette: fade out 0.0–0.3 ──
      gradient.style.opacity = String(1 - ranged(progress, 0, 0.3));

      // ── Polaroid frame: fade in 0.3–0.7 ──
      const frameFade = ranged(progress, 0.3, 0.7);
      frame.style.opacity = String(frameFade);
      frame.style.boxShadow = frameFade > 0 ? "var(--shadow-card)" : "none";

      // Position frame to match clip area with padding
      frame.style.top = `calc(${top}% - ${lerp(0, FRAME_PAD_TOP, progress)}px)`;
      frame.style.left = `calc(${side}% - ${lerp(0, FRAME_PAD_SIDE, progress)}px)`;
      frame.style.right = `calc(${side}% - ${lerp(0, FRAME_PAD_SIDE, progress)}px)`;
      frame.style.bottom = `calc(${bottom}% - ${lerp(0, FRAME_PAD_BOTTOM, progress)}px)`;

      // ── Tape + Caption: fade in 0.7–0.9, positioned relative to final insets ──
      const tapeFade = ranged(progress, 0.7, 0.9);
      tape.style.opacity = String(tapeFade);
      tape.style.top = `calc(${target.top}% - ${FRAME_PAD_TOP + 14}px)`;

      const captionFade = ranged(progress, 0.7, 0.9);
      caption.style.opacity = String(captionFade);
      caption.style.bottom = `calc(${target.bottom}% - ${FRAME_PAD_BOTTOM - 8}px)`;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [reducedMotion]);

  return (
    <section
      ref={sectionRef}
      style={{ minHeight: reducedMotion ? "100svh" : "calc(100svh + 80vh)" }}
      aria-label="Hero with dappled light"
    >
      {/* Sticky DappledLight container — stays pinned while wrapper scrolls */}
      <div className="sticky top-0 h-svh">
        {/* z-0: Polaroid frame (white bg, shadow, border-radius) */}
        <div
          ref={frameRef}
          className="pointer-events-none absolute"
          style={{
            opacity: 0,
            background: "var(--surface-card)",
            borderRadius: "var(--radius-torn)",
            zIndex: 0,
          }}
          aria-hidden="true"
        />

        {/* z-1: DappledLight — clip-path shrinks on scroll */}
        <div
          ref={clipRef}
          className="pointer-events-none absolute inset-0"
          style={{
            clipPath: "inset(0)",
            zIndex: 1,
          }}
          aria-hidden="true"
        >
          <DappledLight />
        </div>

        {/* z-2: Gradient vignette — fades out during transition */}
        <div
          ref={gradientRef}
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_35%_50%,var(--vignette-bg)_0%,transparent_100%)] max-md:bg-[radial-gradient(ellipse_60%_50%_at_center,var(--vignette-bg)_0%,transparent_100%)]"
          style={{ zIndex: 2 }}
          aria-hidden="true"
        />

        {/* z-3: Caption — "afternoon light" / "evening light" */}
        <div
          ref={captionRef}
          className="text-text-card-title pointer-events-none absolute font-serif text-sm italic"
          style={{
            opacity: 0,
            zIndex: 3,
            left: "50%",
            transform: "translateX(-50%)",
          }}
          aria-hidden="true"
        >
          afternoon light
        </div>

        {/* z-4: Teal tape — fades in last */}
        <div
          ref={tapeRef}
          className={`${tapeStyles.teal} pointer-events-none absolute`}
          style={{
            opacity: 0,
            zIndex: 4,
            width: 80,
            height: 28,
            left: "50%",
            transform: "translateX(-50%) rotate(-2deg)",
          }}
          aria-hidden="true"
        />
      </div>

      {/* Hero text content — absolute, scrolls away naturally */}
      <div className="absolute inset-x-0 top-0 h-svh" style={{ zIndex: 10 }}>
        <HeroSection />
      </div>
    </section>
  );
}
