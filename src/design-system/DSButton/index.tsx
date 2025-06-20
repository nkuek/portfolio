import { DSButtonProps } from "./types";
import { buttonVariants } from "./variants";

export default function DSButton({
  variant,
  size = "big",
  className,
  children,
  ...props
}: DSButtonProps) {
  return (
    <button
      className={buttonVariants({
        variant,
        size,
        className,
      })}
      {...props}
    >
      {children}
    </button>
  );
}
