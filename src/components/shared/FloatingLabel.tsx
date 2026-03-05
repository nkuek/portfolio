import styles from "./FloatingLabel.module.css";

const LABEL_SIZES: Record<"sm" | "md" | "lg", string> = {
  sm: "text-base tracking-widest",
  md: "text-2xl tracking-[0.06em]",
  lg: "text-[34px] tracking-[0.04em] font-light",
};

export default function FloatingLabel({
  text,
  size = "md",
  baseOpacity,
  x,
  y,
  driftDuration,
  driftPhase,
  className = "",
}: {
  text: string;
  size?: "sm" | "md" | "lg";
  baseOpacity: number;
  x: number | string;
  y: number | string;
  driftDuration: number;
  driftPhase: number;
  className?: string;
}) {
  return (
    <div
      className={`${styles.label} pointer-events-none absolute font-mono uppercase ${LABEL_SIZES[size] ?? ""} ${className}`}
      style={
        {
          "--cursor-boost": "0",
          "--base-opacity": String(baseOpacity),
          "--drift-duration": `${driftDuration}s`,
          "--drift-delay": `${-driftPhase}s`,
          left: typeof x === "number" ? `${x}px` : x,
          top: typeof y === "number" ? `${y}px` : y,
        } as React.CSSProperties
      }
    >
      {text}
    </div>
  );
}
