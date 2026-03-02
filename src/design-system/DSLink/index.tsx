import Link from "next/link";
import cn from "~/utils/cn";
import { DSLinkProps } from "./types";

export default function DSLink({ children, className, ...props }: DSLinkProps) {
  return (
    <Link
      className={cn(
        "hover:text-link-hover body text-text outline-accent rounded transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-4",
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
