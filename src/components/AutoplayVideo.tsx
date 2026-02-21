import { useCallback, useEffect, useRef, useState } from "react";
import useReducedMotion from "~/hooks/useReducedMotion";

/**
 * Video that auto-plays/pauses based on IntersectionObserver visibility
 * and a `paused` prop. Respects prefers-reduced-motion.
 */
export default function AutoplayVideo({
  src,
  paused,
  threshold = 0.5,
  className = "object-cover",
}: {
  src: string;
  paused: boolean;
  /** IntersectionObserver threshold (0–1). Default 0.5. */
  threshold?: number;
  /** CSS class for the <video> element. Default "object-cover". */
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  const reducedMotion = useReducedMotion();

  const observerRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return;
      const observer = new IntersectionObserver(
        ([entry]) => setVisible(entry.isIntersecting),
        { threshold },
      );
      observer.observe(node);
      return () => observer.disconnect();
    },
    [threshold],
  );

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
        className={`h-full w-full ${className}`}
      />
    </div>
  );
}
