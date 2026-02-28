"use client";
import Link from "next/link";
import ScrollReveal from "~/components/shared/ScrollReveal";
import useTyper from "~/hooks/useTyper";

const contactLinks = [
  {
    label: "GitHub",
    href: "https://github.com/nkuek/",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/nick-kuek/",
  },
  {
    label: "Email",
    href: "mailto:contact@nkuek.dev",
  },
];

const buzzwords = [
  "beautiful.",
  "magical.",
  "memorable.",
  "impactful.",
  "successful.",
  "innovative.",
  "accessible.",
];

export default function Footer() {
  const { display, cursorVisible, ref } = useTyper(buzzwords, {
    deleteSpeed: 100,
    pauseAfterType: 3000,
  });
  return (
    <section
      ref={ref}
      id="contact"
      aria-label="Get in touch"
      className="flex min-h-screen flex-col items-center justify-center gap-16 px-4 pb-24"
    >
      <ScrollReveal variant="stagger" as="h2" className="text-text text-center text-[clamp(1.75rem,4vw,3.5rem)] font-light tracking-[-0.02em]">
        Let&apos;s build something <br />
        <span className="relative inline-block">
          {/* Invisible longest word reserves line height */}
          <span className="invisible" aria-hidden="true">
            {buzzwords.reduce((a, b) => (a.length >= b.length ? a : b))}
          </span>
          {/* Typed text overlaid at the same position */}
          <span className="absolute inset-0 text-center">
            <span className="relative inline-block">
              {display}
              <span
                className="bg-primary absolute top-[0.15em] -right-2.5 h-[1.1em] w-1.5"
                style={{ opacity: display && cursorVisible ? 1 : 0 }}
              />
            </span>
          </span>
        </span>
      </ScrollReveal>

      <ScrollReveal variant="stagger" as="nav" aria-label="Contact links" className="flex gap-10">
        {contactLinks.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            target={link.href.startsWith("mailto:") ? undefined : "_blank"}
            rel={link.href.startsWith("mailto:") ? undefined : "noopener"}
            className="group text-text-muted hover:text-accent relative font-mono text-[clamp(0.875rem,1.5vw,1.125rem)] font-light tracking-[0.05em] uppercase transition-colors duration-200"
          >
            <span className="inline-flex items-center">
              <span
                className="inline-block w-0 overflow-hidden transition-all duration-300 ease-out group-hover:w-5 motion-reduce:transition-none"
                aria-hidden="true"
              >
                {"{ "}
              </span>
              {link.label}
              <span
                className="inline-block w-0 overflow-hidden text-right transition-all duration-300 ease-out group-hover:w-5 motion-reduce:transition-none"
                aria-hidden="true"
              >
                {" }"}
              </span>
            </span>
            <span className="bg-accent ease-smooth absolute -bottom-1 left-1/2 h-px w-0 -translate-x-1/2 transition-[width] duration-200 group-hover:w-full" />
          </Link>
        ))}
      </ScrollReveal>
    </section>
  );
}
