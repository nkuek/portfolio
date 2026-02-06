"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useLayoutEffect,
} from "react";
import Slideshow from "./Slideshow";

declare global {
  interface Window {
    YT: {
      Player: new (
        el: HTMLElement,
        config: {
          videoId: string;
          height: string;
          width: string;
          playerVars?: Record<string, unknown>;
          events?: Record<string, (event: { data: number }) => void>;
        },
      ) => void;
      PlayerState: { PLAYING: number };
    };
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

const FLEE_DISTANCE = 150;
const MAX_NO_TAPS = 3;

const HEART_EMOJIS = ["💖", "💕", "💗", "💓", "💘", "💝", "❤️", "🩷"];
const HEART_COUNT = 30;

// Pre-generate heart data at module level so no work happens at render time
const HEARTS = Array.from({ length: HEART_COUNT }, (_, i) => ({
  id: i,
  emoji: HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)],
  left: Math.random() * 100,
  delay: Math.random() * 3,
  duration: 2.5 + Math.random() * 3,
  size: 16 + Math.random() * 24,
  drift: -30 + Math.random() * 60,
}));

function HeartRain() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Defer rendering to the next frame so it doesn't compete with the layout
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 50 }}
    >
      {HEARTS.map((h) => (
        <span
          key={h.id}
          className="absolute animate-[heartFall_var(--duration)_ease-in_var(--delay)_forwards]"
          style={
            {
              left: `${h.left}%`,
              top: "-10%",
              fontSize: h.size,
              "--delay": `${h.delay}s`,
              "--duration": `${h.duration}s`,
              "--drift": `${h.drift}px`,
              opacity: 0,
            } as React.CSSProperties
          }
        >
          {h.emoji}
        </span>
      ))}
    </div>
  );
}

/** Check if two rects overlap */
function rectsOverlap(
  a: { left: number; top: number; width: number; height: number },
  b: { left: number; top: number; width: number; height: number },
) {
  return (
    a.left < b.left + b.width &&
    a.left + a.width > b.left &&
    a.top < b.top + b.height &&
    a.top + a.height > b.top
  );
}

export default function ValentineForm() {
  const [accepted, setAccepted] = useState(false);
  const [noTransform, setNoTransform] = useState({ x: 0, y: 0 });
  const [surrendered, setSurrendered] = useState(false);
  const [yesStyle, setYesStyle] = useState<React.CSSProperties>({});
  const noTapsRef = useRef(0);
  const noButtonRef = useRef<HTMLButtonElement>(null);
  const yesButtonRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  // The button's original position (no transform applied) — set once on mount
  const noOriginRef = useRef<{ x: number; y: number } | null>(null);

  // Capture the button's original position on mount
  useEffect(() => {
    const btn = noButtonRef.current;
    if (btn && !noOriginRef.current) {
      const rect = btn.getBoundingClientRect();
      noOriginRef.current = { x: rect.left, y: rect.top };
    }
  }, []);

  /** Convert a target viewport position to a translate offset */
  const toTranslate = useCallback((targetX: number, targetY: number) => {
    const origin = noOriginRef.current;
    if (!origin) return { x: 0, y: 0 };
    return { x: targetX - origin.x, y: targetY - origin.y };
  }, []);

  /** Generate a random viewport position that stays within the viewport and avoids content */
  const getSafeTarget = useCallback((btnWidth: number, btnHeight: number) => {
    const contentRect = contentRef.current?.getBoundingClientRect();

    const padding = 16;
    const minX = padding;
    const maxX = window.innerWidth - btnWidth - padding;
    const minY = padding;
    const maxY = window.innerHeight - btnHeight - padding;

    for (let i = 0; i < 20; i++) {
      const x = minX + Math.random() * (maxX - minX);
      const y = minY + Math.random() * (maxY - minY);

      if (
        contentRect &&
        rectsOverlap(
          { left: x, top: y, width: btnWidth, height: btnHeight },
          contentRect,
        )
      ) {
        continue;
      }

      return { x, y };
    }

    return {
      x: minX + Math.random() * (maxX - minX),
      y: minY + Math.random() * (maxY - minY),
    };
  }, []);

  // Desktop only: track mouse globally and flee (skip on touch devices)
  useEffect(() => {
    if (accepted) return;
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) return;

    const handleMouseMove = (e: MouseEvent) => {
      const btn = noButtonRef.current;
      const origin = noOriginRef.current;
      if (!btn || !origin) return;

      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < FLEE_DISTANCE) {
        // Move away from cursor by a modest amount
        const angle = Math.atan2(dy, dx);
        const fleeDist = FLEE_DISTANCE + 50;
        const rawX = cx - Math.cos(angle) * fleeDist - rect.width / 2;
        const rawY = cy - Math.sin(angle) * fleeDist - rect.height / 2;

        const padding = 16;
        const minX = padding;
        const maxX = window.innerWidth - rect.width - padding;
        const minY = padding;
        const maxY = window.innerHeight - rect.height - padding;

        // Clamp to viewport bounds
        let targetX = Math.max(minX, Math.min(rawX, maxX));
        let targetY = Math.max(minY, Math.min(rawY, maxY));

        // If clamped position overlaps content, pick a safe random spot
        const contentRect = contentRef.current?.getBoundingClientRect();
        if (
          contentRect &&
          rectsOverlap(
            {
              left: targetX,
              top: targetY,
              width: rect.width,
              height: rect.height,
            },
            contentRect,
          )
        ) {
          const safe = getSafeTarget(rect.width, rect.height);
          targetX = safe.x;
          targetY = safe.y;
        }

        setNoTransform({
          x: targetX - origin.x,
          y: targetY - origin.y,
        });
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
    // Only re-register when accepted changes — transform is read from ref
  }, [accepted, getSafeTarget]);

  // Mobile: move on click and track taps
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      noTapsRef.current += 1;

      if (noTapsRef.current >= MAX_NO_TAPS) {
        setSurrendered(true);
        return;
      }

      const btn = noButtonRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const safe = getSafeTarget(rect.width, rect.height);
      setNoTransform(toTranslate(safe.x, safe.y));
    },
    [getSafeTarget, toTranslate],
  );

  // When surrendered, move the Yes button to overlap the No button.
  useLayoutEffect(() => {
    if (!surrendered) return;
    const noBtn = noButtonRef.current;
    const yesBtn = yesButtonRef.current;
    if (!noBtn || !yesBtn) return;

    const noRect = noBtn.getBoundingClientRect();
    const yesRect = yesBtn.getBoundingClientRect();

    const dx =
      noRect.left + noRect.width / 2 - (yesRect.left + yesRect.width / 2);
    const dy =
      noRect.top + noRect.height / 2 - (yesRect.top + yesRect.height / 2);

    setYesStyle({
      transform: `translate(${dx}px, ${dy}px) scale(1.15)`,
      transition: "transform 0.3s ease-out",
      position: "relative",
      zIndex: 10,
    });
  }, [surrendered]);

  // YouTube IFrame Player API: preload the API script on mount, create player on accept
  const [musicPlaying, setMusicPlaying] = useState(false);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const ytReadyRef = useRef(false);

  // Preload the YouTube IFrame API script immediately
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      ytReadyRef.current = true;
      return;
    }
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      ytReadyRef.current = true;
      prev?.();
    };
  }, []);

  // Create the player once accepted and the API is ready
  useEffect(() => {
    if (!accepted) return;

    const createPlayer = () => {
      if (!playerContainerRef.current) return;
      new window.YT.Player(playerContainerRef.current, {
        videoId: "RHUUy3acptk",
        height: "0",
        width: "0",
        playerVars: {
          autoplay: 1,
          loop: 1,
          playlist: "RHUUy3acptk",
        },
        events: {
          onStateChange: (event: { data: number }) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setMusicPlaying(true);
            }
          },
        },
      });
    };

    if (ytReadyRef.current) {
      createPlayer();
    } else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        ytReadyRef.current = true;
        createPlayer();
      };
    }
  }, [accepted]);

  if (accepted) {
    return (
      <>
        <HeartRain />
        <div className="flex flex-col items-center gap-6 px-4 text-center">
          <div className="text-6xl">💖</div>
          <h1 className="hero text-text font-medium">Yay!!!</h1>
          <p className="body text-caption text-balance">
            I knew you&apos;d say yes! Happy Valentine&apos;s Day! 🥰
          </p>
          <Slideshow playing={musicPlaying} />
        </div>
        <div ref={playerContainerRef} className="hidden" />
      </>
    );
  }

  return (
    <div
      ref={contentRef}
      className="flex flex-col items-center gap-8 px-4 text-center"
    >
      <div className="text-6xl">💝</div>
      <h1 className="hero text-text font-medium">
        <div className="grid [&>*]:col-start-1 [&>*]:row-start-1">
          <span
            className="transition-opacity duration-500"
            style={{ opacity: surrendered ? 0 : 1 }}
          >
            Will you be my Valentine?
          </span>
          <div
            className="flex flex-col items-center gap-2 transition-opacity duration-500"
            style={{ opacity: surrendered ? 1 : 0 }}
          >
            <span>How did I know you would do this...</span>
            <span>Let me make this easier for you 😤</span>
          </div>
        </div>
      </h1>

      <div className="flex gap-4">
        <button
          ref={yesButtonRef}
          onClick={() => setAccepted(true)}
          style={yesStyle}
          className="bg-primary text-text-on-button hover:bg-primary-hover cursor-pointer rounded-xl px-8 py-3 text-lg font-medium transition-colors"
        >
          Yes! 💕
        </button>

        <button
          ref={noButtonRef}
          onClick={surrendered ? undefined : handleClick}
          style={{
            transform: `translate(${noTransform.x}px, ${noTransform.y}px)`,
            transition: "transform 0.15s ease-out",
          }}
          className="bg-background text-text rounded-xl border border-current px-8 py-3 text-lg font-medium"
          tabIndex={-1}
        >
          No
        </button>
      </div>
      <div ref={playerContainerRef} className="hidden" />
    </div>
  );
}
