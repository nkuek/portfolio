import LinkedInLogo from "~/images/linkedin.svg";
import GitHubLogo from "~/images/github.svg";
import Envelope from "~/images/envelope.svg";
import cn from "~/utils/cn";
import Link, { LinkProps } from "next/link";

function FooterLinkGroup({
  title,
  containerClass,
  children,
}: React.PropsWithChildren<{ title?: string; containerClass?: string }>) {
  return (
    <div className={cn("flex flex-col items-center", containerClass)}>
      {title && <span>{title}</span>}
      <ul className="flex gap-[10px]">{children}</ul>
    </div>
  );
}

function FooterLinkItem(
  props: React.PropsWithChildren<LinkProps & { title?: string }>,
) {
  return (
    <li className="flex items-center">
      <Link
        className="title ease *:fill-text *:hover:fill-link-hover h-auto w-8 transition-transform duration-250 *:transition-colors *:duration-250 *:ease-in-out hover:scale-110"
        target="_blank"
        rel="noopener"
        {...props}
      >
        {props.children}
      </Link>
    </li>
  );
}

export default function Footer() {
  return (
    <footer className="relative top-[70px] mx-auto flex h-[70px] w-full max-w-[1408px] items-center justify-center">
      <FooterLinkGroup containerClass="justify-end h-full pb-3">
        <FooterLinkItem
          href="https://github.com/nkuek/"
          aria-label="GitHub"
          title="GitHub"
        >
          <GitHubLogo />
        </FooterLinkItem>
        <FooterLinkItem
          href="https://www.linkedin.com/in/nick-kuek/"
          aria-label="LinkedIn"
          title="LinkedIn"
        >
          <LinkedInLogo />
        </FooterLinkItem>
        <FooterLinkItem
          href="mailto:contact@nkuek.dev"
          aria-label="Email"
          title="Email"
        >
          <Envelope />
        </FooterLinkItem>
      </FooterLinkGroup>
    </footer>
  );
}
