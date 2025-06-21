import { useId } from "react";
import cn from "~/utils/cn";
import styles from "./styles.module.css";

export default function SunAndMoon() {
  const id = useId();
  return (
    <svg
      className={styles["sun-and-moon"]}
      aria-hidden="true"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      strokeLinecap="round"
    >
      <mask className={cn(styles.moon, "fill-background")} id={id}>
        <rect x="0" y="0" width="100%" height="100%" fill="white" />
        <circle cx="24" cy="10" r="6" fill="black" />
      </mask>
      <circle
        className={cn(styles.sun, "fill-background")}
        cx="12"
        cy="12"
        r="6"
        mask={`url(#${id})`}
      />
      <g className={cn(styles["sun-beams"], "stroke-background")}>
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </g>
    </svg>
  );
}
