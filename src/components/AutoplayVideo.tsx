import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import useReducedMotion from "~/hooks/useReducedMotion";

/**
 * Derives a tiny blurred poster URL from the video src.
 * Expects a sibling file named `<name>-poster.jpg` next to the `.mp4`.
 */
function getBlurredPoster(videoSrc: string): string | null {
  if (!videoSrc.endsWith(".mp4")) return null;
  return videoSrc.replace(/\.mp4$/, "-poster.jpg");
}

/**
 * Video that auto-plays/pauses based on IntersectionObserver visibility
 * and a `paused` prop. Respects prefers-reduced-motion.
 * Shows a blurred poster thumbnail as a placeholder until loaded.
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [activated, setActivated] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const reducedMotion = useReducedMotion();

  const blurSrc = getBlurredPoster(src);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  useEffect(() => {
    if (visible) setActivated(true);
  }, [visible]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activated) return;
    const shouldPlay = reducedMotion ? !paused : visible && !paused;
    if (shouldPlay) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [visible, paused, reducedMotion, activated]);

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <video
        ref={videoRef}
        src={activated ? src : undefined}
        muted
        loop
        playsInline
        onCanPlay={() => {
          setLoaded(true);
        }}
        className={`h-full w-full ${className}`}
      />
      {blurSrc && (
        <Image
          src={blurSrc}
          alt=""
          aria-hidden
          width={40}
          height={40}
          className={`pointer-events-none absolute inset-0 h-full w-full ${className} transition-opacity duration-700 ease-out ${loaded ? "opacity-0" : "opacity-100"}`}
        />
      )}
    </div>
  );
}
