import "./FloatingLabel.css";

const LABEL_SIZES: Record<string, string> = {
  sm: "text-[16px] tracking-[0.1em]",
  md: "text-[24px] tracking-[0.06em]",
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
  size?: string;
  baseOpacity: number;
  x: number | string;
  y: number | string;
  driftDuration: number;
  driftPhase: number;
  className?: string;
}) {
  return (
    <div
      className={`floating-label pointer-events-none absolute font-mono uppercase ${LABEL_SIZES[size] ?? ""} ${className}`}
      style={
        {
          "--cursor-boost": "0",
          "--base-opacity": String(baseOpacity),
          left: typeof x === "number" ? `${x}px` : x,
          top: typeof y === "number" ? `${y}px` : y,
          animation: `labelFloat ${driftDuration}s ease-in-out ${-driftPhase}s infinite`,
        } as React.CSSProperties
      }
    >
      {text}
    </div>
  );
}
