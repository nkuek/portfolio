/**
 * Section title — large torn-edge scrapbook card.
 * Outer wrapper carries drop-shadow so it follows the torn clip-path.
 * Tape sits outside the clipped area so it's always visible.
 */
export default function SectionTitleCard({
  title,
  subtitle,
  rotate = -2,
  tapeColor = "teal",
}: {
  title: string;
  subtitle?: string;
  rotate?: number;
  tapeColor?: "teal" | "rose";
}) {
  return (
    <div
      className="section-title-wrapper"
      style={{ rotate: `${rotate}deg` }}
    >
      {/* Tape — outside the clipped card so it's never cut off */}
      <div
        className={`polaroid-tape polaroid-tape-${tapeColor}`}
        style={{ width: 80, rotate: `${-rotate * 1.2}deg` }}
      />
      <div className="section-title-card px-12 pt-10 pb-12 md:px-16 md:pt-12 md:pb-14">
        <h2 className="section-title-text whitespace-nowrap font-(family-name:--font-source-code-pro) text-[clamp(2rem,5vw,3.5rem)] tracking-widest uppercase">
          {title}
        </h2>
        {subtitle && (
          <p className="section-title-subtitle mt-2 font-(family-name:--font-source-code-pro) text-[clamp(0.9rem,1.5vw,1.1rem)] tracking-[0.04em]">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
