/**
 * Shared play/pause toggle button — scrapbook style with crossfade text.
 * Used in both Projects and In the Wild sections.
 */
import styles from "./PlayPauseButton.module.css";

export default function PlayPauseButton({
  paused,
  onToggle,
  className = "",
  style,
}: {
  paused: boolean;
  onToggle: (e: React.MouseEvent) => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={paused ? "Play video" : "Pause video"}
      className={`${styles.button} cursor-pointer rounded-control border border-border-light bg-surface-card px-5 py-2.5 font-mono text-[20px] tracking-[0.05em] uppercase text-text-subtle shadow-control hover:border-accent hover:bg-accent hover:text-white ${className}`}
      style={style}
    >
      <span className="relative block overflow-hidden">
        <span
          className="ease-smooth block transition-all duration-200"
          style={{
            opacity: paused ? 0 : 1,
            transform: paused ? "translateY(-100%)" : "translateY(0)",
          }}
        >
          pause
        </span>
        <span
          className="ease-smooth absolute inset-0 block transition-all duration-200"
          style={{
            opacity: paused ? 1 : 0,
            transform: paused ? "translateY(0)" : "translateY(100%)",
          }}
        >
          play
        </span>
      </span>
    </button>
  );
}
