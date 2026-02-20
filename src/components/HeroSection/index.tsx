"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const roles = [
  "Design Engineer",
  "Creative Developer",
  "CSS Enthusiast",
  "Frontend Developer",
  "Keyboard Hobbyist",
  "Coffee Fanatic",
  "Pickleball Noob",
];

const TYPE_SPEED = 80;
const DELETE_SPEED = 40;
const PAUSE_AFTER_TYPE = 2000;
const PAUSE_AFTER_DELETE = 400;

function useTyper() {
  const [display, setDisplay] = useState(roles[0]);
  const [cursorVisible, setCursorVisible] = useState(true);
  const roleIdx = useRef(0);
  const charIdx = useRef(roles[0].length);
  const deleting = useRef(true);

  const tick = useCallback(() => {
    const role = roles[roleIdx.current];
    if (!deleting.current) {
      charIdx.current++;
      setDisplay(role.slice(0, charIdx.current));
      if (charIdx.current === role.length) {
        deleting.current = true;
        return PAUSE_AFTER_TYPE;
      }
      return TYPE_SPEED + Math.random() * 40;
    } else {
      charIdx.current--;
      setDisplay(role.slice(0, charIdx.current));
      if (charIdx.current === 0) {
        deleting.current = false;
        roleIdx.current = (roleIdx.current + 1) % roles.length;
        return PAUSE_AFTER_DELETE;
      }
      return DELETE_SPEED;
    }
  }, []);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    function loop() {
      const delay = tick();
      timeout = setTimeout(loop, delay);
    }
    timeout = setTimeout(loop, 3000);
    return () => clearTimeout(timeout);
  }, [tick]);

  useEffect(() => {
    const interval = setInterval(() => setCursorVisible((v) => !v), 530);
    return () => clearInterval(interval);
  }, []);

  return { display, cursorVisible };
}

export default function HeroSection() {
  const { display, cursorVisible } = useTyper();

  return (
    <section
      aria-label="Introduction"
      className="flex min-h-svh w-full items-center justify-center"
    >
      <div
        className="relative z-[1] flex w-full max-w-[900px] flex-col gap-0 px-8 max-md:items-center"
        id="top"
      >
        <div
          className="mb-10 h-px w-full origin-left animate-[drawHairline_1000ms_cubic-bezier(0.0,0.0,0.2,1)_0ms_both] bg-[#d4d4d4] dark:bg-[#404040]"
          aria-hidden="true"
        />
        <h1 className="text-text animate-[heroFocusPull_900ms_cubic-bezier(0.16,1,0.3,1)_200ms_both] text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.1] font-[300] tracking-[-0.03em] opacity-0">
          Nick Kuek
        </h1>
        <div
          className="mt-10 mb-8 h-px w-full origin-left animate-[drawHairline_1000ms_cubic-bezier(0.0,0.0,0.2,1)_500ms_both] bg-[#d4d4d4] dark:bg-[#404040]"
          aria-hidden="true"
        />
        <p className="text-text animate-[heroFocusPull_700ms_cubic-bezier(0.34,1.56,0.64,1)_700ms_both] text-[clamp(1rem,2vw,1.5rem)] font-[300] tracking-[0.02em] opacity-0">
          {display}
          <span
            className="bg-primary ml-1 inline-block h-[1.1em] w-[6px] translate-y-[0.15em]"
            style={{ opacity: cursorVisible ? 1 : 0 }}
          />
        </p>
        <p className="mt-4 animate-[heroFocusPull_800ms_cubic-bezier(0.22,0.61,0.36,1)_1000ms_both] font-(family-name:--font-source-code-pro) text-[clamp(0.75rem,1.2vw,0.9375rem)] leading-[1.6] text-[#2d7d9a] italic opacity-0">
          making the web more beautiful
        </p>
        <div
          className="mt-10 mb-6 h-px w-full origin-left animate-[drawHairline_1200ms_cubic-bezier(0.0,0.0,0.2,1)_1300ms_both] bg-[#d4d4d4] dark:bg-[#404040]"
          aria-hidden="true"
        />
        <div className="flex animate-[heroFocusPull_600ms_cubic-bezier(0.25,0.46,0.45,0.94)_1600ms_both] gap-4 text-[clamp(0.625rem,1vw,0.75rem)] font-[300] tracking-[0.1em] text-[#737373] uppercase opacity-0">
          <span>2026</span>
          <span aria-hidden="true">·</span>
          <span>Maryland</span>
        </div>
      </div>
    </section>
  );
}
