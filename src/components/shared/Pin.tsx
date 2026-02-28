export default function Pin({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`absolute top-0 left-1/2 -ml-[7px] h-3.5 w-3.5 rounded-full bg-accent-rose shadow-pin z-4 pointer-events-none transition-transform duration-(--duration-scatter) ease-spring motion-reduce:transition-none ${className}`}
      style={style}
    />
  );
}
