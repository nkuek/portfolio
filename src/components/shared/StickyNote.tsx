const STICKY_COLORS: Record<"amber" | "teal" | "rose", string> = {
  amber: "bg-sticky-amber-bg text-sticky-amber-text",
  teal: "bg-sticky-teal-bg text-sticky-teal-text",
  rose: "bg-sticky-rose-bg text-sticky-rose-text",
};

export default function StickyNote({
  color,
  children,
  className = "",
  style,
  ref,
}: {
  color: "amber" | "teal" | "rose";
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  ref?: React.Ref<HTMLDivElement>;
}) {
  return (
    <div
      ref={ref}
      className={`${STICKY_COLORS[color]} rounded-torn shadow-sticky pointer-events-none z-3 w-fit max-w-[360px] px-[21px] py-[18px] leading-[1.4] italic max-md:text-base ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
