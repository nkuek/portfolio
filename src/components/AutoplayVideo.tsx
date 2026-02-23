import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import useReducedMotion from "~/hooks/useReducedMotion";

/**
 * Converts a Cloudinary video URL into a tiny, heavily-blurred JPG thumbnail.
 * Cloudinary generates this from the first frame of the video — typically <2 KB.
 */
function getBlurredPoster(videoSrc: string): string | null {
  if (!videoSrc.includes("res.cloudinary.com")) return null;
  return videoSrc
    .replace(
      /\/video\/upload\/[^/]+\//,
      "/video/upload/e_blur:2000,q_1,w_40,f_jpg/",
    )
    .replace(/\.\w+$/, ".jpg");
}

/**
 * Video that auto-plays/pauses based on IntersectionObserver visibility
 * and a `paused` prop. Respects prefers-reduced-motion.
 * Shows a blurred Cloudinary thumbnail as a placeholder until loaded.
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
  const [loaded, setLoaded] = useState(false);
  const reducedMotion = useReducedMotion();

  const blurSrc = getBlurredPoster(src);

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
    <div ref={observerRef} className="relative h-full w-full">
      <video
        ref={videoRef}
        src={src}
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
