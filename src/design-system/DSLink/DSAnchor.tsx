import cn from "~/utils/cn";

export default function DSAnchor({
  className,
  children,
  ...props
}: React.PropsWithChildren<React.AnchorHTMLAttributes<HTMLAnchorElement>>) {
  return (
    <a
      className={cn(
        "hover:text-link-hover body text-text transition-colors duration-200",
        className,
      )}
      {...props}
    >
      {children}
    </a>
  );
}
