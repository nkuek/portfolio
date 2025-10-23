import cn from "~/utils/cn";

export default function DSAnchor({
  className,
  children,
  ...props
}: React.PropsWithChildren<React.AnchorHTMLAttributes<HTMLAnchorElement>>) {
  return (
    <a
      className={cn(
        "hover:text-link-hover body text-text transition-[color,transform] duration-200 ease-out active:scale-97",
        className,
      )}
      {...props}
    >
      {children}
    </a>
  );
}
