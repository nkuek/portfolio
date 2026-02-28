import styles from "./Tape.module.css";

export default function Tape({
  color = "teal",
  width,
  rotate,
  className = "",
  style,
}: {
  color?: "teal" | "rose";
  width?: number | string;
  rotate?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`${styles.tape} ${styles[color]} ${className}`}
      style={{ width, rotate, ...style }}
    />
  );
}
