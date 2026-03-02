import Link from "next/link";
import { DSLinkProps } from "./types";
import cn from "~/utils/cn";

export function DSLinkContainer({
  className,
  children,
  ...props
}: Omit<DSLinkProps, "size">) {
  return (
    <Link
      {...props}
      className={cn(
        "hover:text-link-hover outline-accent rounded focus-visible:outline-2 focus-visible:outline-offset-2",
        className,
      )}
    >
      {children}
    </Link>
  );
}
