import Link from "next/link";
import { DSLinkProps } from "./types";
import cn from "~/utils/cn";

export function DSLinkContainer({
  className,
  children,
  ...props
}: Omit<DSLinkProps, "size">) {
  return (
    <Link {...props} className={cn("hover:text-link-hover", className)}>
      {children}
    </Link>
  );
}
