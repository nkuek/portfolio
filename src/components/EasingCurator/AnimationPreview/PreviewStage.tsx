"use client";

import { useEffect, useRef } from "react";

type PreviewStageProps = {
  easing: string;
  pinnedEasing?: string | null;
  duration: number;
  totalDuration: number;
  from: Keyframe;
  to: Keyframe;
  label: string;
  children: React.ReactNode;
  guide?: React.ReactNode;
  ghostGuide?: React.ReactNode;
  onAnimation: (key: string, anim: Animation | null) => void;
};

const PAUSE_MS = 500;

export default function PreviewStage({
  easing,
  pinnedEasing,
  duration,
  totalDuration,
  from,
  to,
  label,
  children,
  guide,
  ghostGuide,
  onAnimation,
}: PreviewStageProps) {
  const targetRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;

    const t1 = duration / totalDuration;
    const t2 = (duration + PAUSE_MS) / totalDuration;
    const t3 = (duration * 2 + PAUSE_MS) / totalDuration;

    const anim = el.animate(
      [
        { ...from, offset: 0, easing },
        { ...to, offset: t1, easing: "linear" },
        { ...to, offset: t2, easing },
        { ...from, offset: t3, easing: "linear" },
        { ...from, offset: 1 },
      ],
      { duration: totalDuration, iterations: Infinity },
    );

    onAnimation(label, anim);
    return () => {
      anim.cancel();
      onAnimation(label, null);
    };
  }, [duration, easing, from, to, totalDuration, label, onAnimation]);

  // Ghost animation for pinned curve
  useEffect(() => {
    const el = ghostRef.current;
    if (!el || !pinnedEasing) return;

    const t1 = duration / totalDuration;
    const t2 = (duration + PAUSE_MS) / totalDuration;
    const t3 = (duration * 2 + PAUSE_MS) / totalDuration;

    const anim = el.animate(
      [
        { ...from, offset: 0, easing: pinnedEasing },
        { ...to, offset: t1, easing: "linear" },
        { ...to, offset: t2, easing: pinnedEasing },
        { ...from, offset: t3, easing: "linear" },
        { ...from, offset: 1 },
      ],
      { duration: totalDuration, iterations: Infinity },
    );

    const ghostKey = `${label}-ghost`;
    onAnimation(ghostKey, anim);
    return () => {
      anim.cancel();
      onAnimation(ghostKey, null);
    };
  }, [duration, pinnedEasing, from, to, totalDuration, label, onAnimation]);

  return (
    <div className="flex items-center gap-3">
      <span className="text-text-muted w-16 shrink-0 font-mono text-xs">
        {label}
      </span>
      <div className="border-border-hairline flex h-12 flex-1 items-center gap-4 overflow-hidden rounded-lg border px-2">
        <div className="grid place-items-center [&>*]:col-start-1 [&>*]:row-start-1">
          {guide}
          <div ref={targetRef}>{children}</div>
        </div>
        {pinnedEasing && (
          <div className="grid place-items-center [&>*]:col-start-1 [&>*]:row-start-1">
            {ghostGuide}
            <div ref={ghostRef}>
              <div className="size-8 rounded-md bg-[var(--accent-rose)] opacity-60" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
