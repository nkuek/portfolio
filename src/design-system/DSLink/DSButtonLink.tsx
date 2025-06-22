import Link, { LinkProps } from "next/link";
import { DSButtonVariantProps } from "../DSButton/types";
import { PropsWithChildren } from "react";
import { buttonVariants } from "../DSButton/variants";

type DSButtonLinkProps = LinkProps &
  DSButtonVariantProps &
  React.AnchorHTMLAttributes<HTMLAnchorElement>;

export function DSButtonLink({
  variant,
  className,
  size = "big",
  children,
  ...props
}: PropsWithChildren<DSButtonLinkProps> & { className?: string }) {
  return (
    <Link {...props} className={buttonVariants({ variant, size, className })}>
      {children}
    </Link>
  );
}
