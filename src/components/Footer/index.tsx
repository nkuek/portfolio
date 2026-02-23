"use client";
import Link from "next/link";
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
      <h2 className="scroll-stagger-in text-text text-center text-[clamp(1.75rem,4vw,3.5rem)] font-[300] tracking-[-0.02em]">
        Let’s build something <br />
        {display}
        <span
          className="bg-primary ml-1 inline-block h-[1.1em] w-[6px] translate-y-[0.15em]"
          style={{ opacity: cursorVisible ? 1 : 0 }}
        />
      </h2>

      <nav aria-label="Contact links" className="scroll-stagger-in flex gap-10">
        {contactLinks.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            target={link.href.startsWith("mailto:") ? undefined : "_blank"}
            rel={link.href.startsWith("mailto:") ? undefined : "noopener"}
            className="contact-link group relative text-[clamp(0.875rem,1.5vw,1.125rem)] font-[300] tracking-[0.05em] text-text-muted uppercase transition-colors duration-200 hover:text-accent"
          >
            {link.label}
            <span className="absolute -bottom-1 left-1/2 h-px w-0 -translate-x-1/2 bg-accent transition-[width] duration-200 ease-smooth group-hover:w-full" />
          </Link>
        ))}
      </nav>
    </section>
  );
}
