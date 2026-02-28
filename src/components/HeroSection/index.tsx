"use client";

import useTyper from "~/hooks/useTyper";

const roles = [
  "Design Engineer",
  "Creative Developer",
  "CSS Enthusiast",
  "Frontend Developer",
  "Keyboard Hobbyist",
  "Coffee Fanatic",
  "Pickleball Noob",
];

export default function HeroSection() {
  const { display, cursorVisible, ref } = useTyper(roles);

  return (
    <section
      ref={ref}
      aria-label="Introduction"
      className="relative flex h-full w-full items-center justify-center overflow-hidden"
      id="top"
    >
      <div className="relative z-1 flex w-full max-w-[900px] flex-col gap-0 px-16 max-md:items-center">
        <div
          className="bg-border-hairline mb-10 h-px w-full origin-left animate-[drawHairline_1000ms_cubic-bezier(0.23,1,0.32,1)_0ms_both]"
          aria-hidden="true"
        />
        <h1 className="text-text animate-[heroFocusPull_900ms_cubic-bezier(0.16,1,0.3,1)_200ms_both] text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.1] font-light tracking-[-0.03em] opacity-0">
          Nick Kuek
        </h1>
        <div
          className="bg-border-hairline mt-10 mb-8 h-px w-full origin-left animate-[drawHairline_1000ms_cubic-bezier(0.23,1,0.32,1)_500ms_both]"
          aria-hidden="true"
        />
        <p className="text-text animate-[heroFocusPull_700ms_cubic-bezier(0.34,1.56,0.64,1)_700ms_both] text-[clamp(1rem,2vw,1.5rem)] font-normal tracking-[0.02em] opacity-0">
          {display}
          <span
            className="bg-primary ml-1 inline-block h-[1.1em] w-[6px] translate-y-[0.15em]"
            style={{ opacity: cursorVisible ? 1 : 0 }}
          />
        </p>
        <p className="text-accent mt-4 w-fit animate-[heroFocusPull_800ms_cubic-bezier(0.22,0.61,0.36,1)_1000ms_both] font-mono text-[clamp(1rem,1.2vw,1.2375rem)] leading-[1.6] font-normal text-balance italic opacity-0 max-md:text-center">
          making the web more beautiful
        </p>
        <div
          className="bg-border-hairline mt-10 mb-6 h-px w-full origin-left animate-[drawHairline_1200ms_cubic-bezier(0.23,1,0.32,1)_1300ms_both]"
          aria-hidden="true"
        />
        <div className="text-text-subtle flex animate-[heroFocusPull_600ms_cubic-bezier(0.25,0.46,0.45,0.94)_1600ms_both] gap-4 text-[clamp(0.625rem,1vw,0.75rem)] font-normal tracking-[0.1em] uppercase opacity-0">
          <span>2026</span>
          <span aria-hidden="true">·</span>
          <span>Maryland</span>
        </div>
      </div>
    </section>
  );
}
