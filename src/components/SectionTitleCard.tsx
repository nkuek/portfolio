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
    <div className="section-title-wrapper" style={{ rotate: `${rotate}deg` }}>
      {/* Tape — outside the clipped card so it's never cut off */}
      <div
        className={`polaroid-tape polaroid-tape-${tapeColor}`}
        style={{ width: 80, rotate: `${-rotate * 1.2}deg` }}
      />
      <div className="section-title-card px-12 pt-10 pb-12 md:px-16 md:pt-12 md:pb-14">
        <h2 className="section-title-text font-serif text-[clamp(2.5rem,6vw,4.5rem)] font-bold tracking-[0.02em] whitespace-nowrap">
          {title}
        </h2>
        {subtitle && (
          <p className="section-title-subtitle mt-1 font-mono text-[clamp(0.85rem,1.3vw,1rem)] tracking-[0.04em]">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
