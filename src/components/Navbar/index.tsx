"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Logo from "../Logo";
import DesktopNavbar from "./DesktopNavbar";
import MobileNavbar, { useMobileNav } from "./MobileNavbar";

const SCROLL_THRESHOLD = 50;

export default function Navbar() {
  // scrolled state is only used as fallback for browsers without scroll-timeline
  const [scrolled, setScrolled] = useState(false);
  const rafRef = useRef(0);

  useEffect(() => {
    function onScroll() {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setScrolled(window.scrollY > SCROLL_THRESHOLD);
      });
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <MobileNavbar>
      <NavShell scrolled={scrolled} />
    </MobileNavbar>
  );
}

function NavShell({ scrolled }: { scrolled: boolean }) {
  const { open } = useMobileNav();

  return (
    <div
      data-scrolled={scrolled || undefined}
      className={`nav-shell pointer-events-none fixed inset-x-0 flex justify-center ${open ? "z-4" : "z-2"}`}
    >
      <nav
        aria-label="Main navigation"
        className="nav-bar pointer-events-auto relative [&_a]:outline-offset-[5px]"
      >
        <div
          aria-hidden
          className="nav-pill-bg absolute inset-0 border"
        />
        <div className="relative z-1 flex items-center">
          <Link
            href="/"
            aria-label="Go to the top of the page"
            className="group"
          >
            <Logo className="nav-logo h-auto group-active:scale-97" />
          </Link>
          <DesktopNavbar />
          <MobileNavbar.Hamburger />
        </div>
      </nav>
    </div>
  );
}
