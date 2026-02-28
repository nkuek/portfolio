"use client";
import styles from "./ScrollToTop.module.css";
import Link from "next/link";
import { useEffect, useRef } from "react";
import useReducedMotion from "~/hooks/useReducedMotion";

const CHARS = "{}[]·:.-+*<>/|";

function randomChar() {
  return CHARS[Math.floor(Math.random() * CHARS.length)];
}

export default function ScrollToTop() {
  const buttonRef = useRef<HTMLAnchorElement>(null);
  const charRef = useRef<HTMLSpanElement>(null);
  const pingRef = useRef<HTMLSpanElement>(null);
  const wasVisible = useRef(false);
  const inFooter = useRef(false);
  const reducedMotion = useReducedMotion();
  const lastMouse = useRef({ x: 0, y: 0, t: 0 });
  const smoothVelocity = useRef(0);
  const heartbeatId = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    let animating = false;
    let pendingStop: (() => void) | null = null;

    function microScramble() {
      const span = charRef.current;
      if (!span) return;
      let step = 0;
      const steps = 8;

      function tick() {
        if (!span) return;
        if (step >= steps) {
          span.textContent = "\u2191";
          return;
        }
        span.textContent = randomChar();
        step++;
        setTimeout(tick, 60);
      }

      tick();
    }

    function stopHeartbeat() {
      if (heartbeatId.current !== null) {
        clearInterval(heartbeatId.current);
        heartbeatId.current = null;
      }
    }

    function startHeartbeat() {
      stopHeartbeat();
      if (reducedMotion) return;
      heartbeatId.current = setInterval(microScramble, 3000);
    }

    function startAnimations() {
      if (!button || reducedMotion) return;
      const ping = pingRef.current;
      if (ping) {
        ping.classList.remove(styles.ping);
        void ping.offsetHeight;
        ping.classList.add(styles.ping);
      }
      button.classList.remove(styles.squish);
      void button.offsetHeight;
      button.classList.add(styles.squish);
      animating = true;
    }

    function cancelPendingStop() {
      if (pendingStop && pingRef.current) {
        pingRef.current.removeEventListener("animationiteration", pendingStop);
        pendingStop = null;
      }
    }

    function stopAnimationsGracefully() {
      const ping = pingRef.current;
      if (!ping || !button) return;

      const handler = () => {
        ping.removeEventListener("animationiteration", handler);
        pendingStop = null;
        // Guard against race with re-entry
        if (inFooter.current) return;
        ping.classList.remove(styles.ping);
        button.classList.remove(styles.squish);
        animating = false;
      };
      pendingStop = handler;
      ping.addEventListener("animationiteration", handler);
    }

    function syncFooterEffects(entering: boolean) {
      cancelPendingStop();
      if (entering) {
        if (!reducedMotion) scramble();
        startHeartbeat();
        if (!animating) startAnimations();
      } else {
        stopHeartbeat();
        if (animating) stopAnimationsGracefully();
      }
    }

    const footer = document.getElementById("contact");
    let observer: IntersectionObserver | undefined;
    if (footer) {
      observer = new IntersectionObserver(
        ([entry]) => {
          const wasIn = inFooter.current;
          inFooter.current = entry.isIntersecting;

          // Scroll events can lag behind on mobile (momentum / Lenis),
          // so read scrollY directly to ensure button visibility is current.
          if (!wasVisible.current && window.scrollY > window.innerHeight) {
            button.dataset.visible = "true";
            wasVisible.current = true;
          }

          if (inFooter.current && !wasIn && wasVisible.current) {
            syncFooterEffects(true);
          } else if (!inFooter.current && wasIn) {
            syncFooterEffects(false);
          }
        },
        { threshold: 0 },
      );
      observer.observe(footer);
    }

    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      const dt = now - lastMouse.current.t;
      if (dt > 0 && dt < 100) {
        const dx = e.clientX - lastMouse.current.x;
        const dy = e.clientY - lastMouse.current.y;
        const speed = Math.sqrt(dx * dx + dy * dy) / dt;
        smoothVelocity.current += (speed - smoothVelocity.current) * 0.3;
      }
      lastMouse.current = { x: e.clientX, y: e.clientY, t: now };
    };

    const handleScroll = () => {
      const visible = window.scrollY > window.innerHeight;
      const isNowVisible = visible && !wasVisible.current;
      const isNowHidden = !visible && wasVisible.current;

      if (visible !== wasVisible.current) {
        button.dataset.visible = String(visible);
        wasVisible.current = visible;
      }

      if (isNowVisible && inFooter.current) {
        syncFooterEffects(true);
      }

      if (isNowHidden) {
        syncFooterEffects(false);
        if (charRef.current) {
          charRef.current.textContent = "\u2191";
        }
      }
    };

    document.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      observer?.disconnect();
      cancelPendingStop();
      stopHeartbeat();
    };
  }, [reducedMotion]);

  function scramble() {
    const span = charRef.current;
    if (!span) return;

    let step = 0;
    const totalSteps = 10;
    const baseInterval = 50;

    function tick() {
      if (!span) return;
      if (step >= totalSteps) {
        span.textContent = "\u2191";
        return;
      }
      span.textContent = randomChar();
      step++;
      const delay = baseInterval + (step / totalSteps) * 80;
      setTimeout(tick, delay);
    }

    tick();
  }

  function handleButtonMouseMove(e: React.MouseEvent<HTMLAnchorElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const v = smoothVelocity.current;
    const r = Math.min(80, 20 + v * 25);
    e.currentTarget.style.backgroundImage = `radial-gradient(circle at ${x}px ${y}px, color-mix(in srgb, var(--accent) 25%, transparent) 0%, transparent ${r}px)`;
  }

  function handleButtonMouseLeave(e: React.MouseEvent<HTMLAnchorElement>) {
    e.currentTarget.style.backgroundImage = "";
  }

  return (
    <Link
      ref={buttonRef}
      data-visible="false"
      href="/#top"
      onMouseMove={handleButtonMouseMove}
      onMouseLeave={handleButtonMouseLeave}
      aria-label="Scroll to top"
      className="border-text-muted bg-surface-overlay text-text-muted ease-spring hover:border-accent hover:text-accent fixed right-5 bottom-5 z-99 flex h-11 w-11 cursor-pointer items-center justify-center border font-mono text-lg backdrop-blur-sm transition-[color,border-color,opacity,translate] duration-[200ms,200ms,600ms,600ms] data-[visible=false]:pointer-events-none data-[visible=false]:translate-y-4 data-[visible=false]:opacity-0 md:right-10 md:bottom-10"
    >
      <span
        ref={pingRef}
        aria-hidden="true"
        className="border-accent/60 pointer-events-none absolute inset-0 border opacity-0 motion-reduce:hidden"
      />
      <span ref={charRef} aria-hidden="true">
        {"\u2191"}
      </span>
    </Link>
  );
}
