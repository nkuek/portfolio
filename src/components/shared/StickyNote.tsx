const STICKY_COLORS: Record<string, string> = {
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
  color: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  ref?: React.Ref<HTMLDivElement>;
}) {
  return (
    <div
      ref={ref}
      className={`${STICKY_COLORS[color]} max-w-[360px] w-fit px-[21px] py-[18px] italic leading-[1.4] rounded-torn pointer-events-none z-3 shadow-sticky max-md:text-[16px] ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
