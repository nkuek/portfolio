import Link from "next/link";
import cn from "~/utils/cn";
import { DSLinkProps } from "./types";

export default function DSLink({ children, className, ...props }: DSLinkProps) {
  return (
    <Link
      className={cn(
        "hover:text-link-hover body text-text dark:text-text-dark transition-colors duration-200",
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
