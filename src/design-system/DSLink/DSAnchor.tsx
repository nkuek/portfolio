import cn from "~/utils/cn";

export default function DSAnchor({
  className,
  children,
  ...props
}: React.PropsWithChildren<React.AnchorHTMLAttributes<HTMLAnchorElement>>) {
  return (
    <a
      className={cn(
        "hover:text-link-hover body text-text outline-accent rounded transition-[color,transform] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-4 active:scale-97",
        className,
      )}
      {...props}
    >
      {children}
    </a>
  );
}
