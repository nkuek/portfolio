"use client";
import { useRef } from "react";
import { useLenis } from "lenis/react";
import Link from "next/link";
import Logo from "../Logo";
import DesktopNavbar from "./DesktopNavbar";
import MobileNavbar, { useMobileNav } from "./MobileNavbar";

export default function Navbar() {
  return (
    <MobileNavbar>
      <NavShell />
    </MobileNavbar>
  );
}

function NavShell() {
  const { open } = useMobileNav();
  const shellRef = useRef<HTMLDivElement>(null);

  useLenis((lenis) => {
    shellRef.current?.toggleAttribute("data-scrolled", lenis.targetScroll > 0);
  });

  return (
    <div
      ref={shellRef}
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
        <div className="nav-content relative z-1 flex w-full items-center justify-between">
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
