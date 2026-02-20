"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Logo from "../Logo";
import DesktopNavbar from "./DesktopNavbar";
import MobileNavbar from "./MobileNavbar";

export default function Navbar() {
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!navRef.current) return;
      const scrolled = window.scrollY > 0;
      navRef.current.setAttribute(
        "data-scrolled",
        scrolled ? "true" : "false",
      );
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <nav
        ref={navRef}
        className="body before:grainy-background data-[scrolled=true]:bg-background fixed top-0 z-2 flex w-full items-center justify-between transition-[background-color,box-shadow] duration-200 ease-out before:absolute before:inset-0 before:-z-1 before:transition-opacity before:duration-200 before:ease-out data-[scrolled=false]:before:opacity-0 data-[scrolled=true]:shadow-[0px_1px_0px_rgba(17,17,26,0.05),0px_0px_8px_rgba(17,17,26,0.1)] [&_a]:outline-offset-[5px]"
        data-scrolled="false"
      >
        <div className="px-6 py-4">
          <Link
            href="#top"
            aria-label="Go to the top of the page"
            className="group"
          >
            <Logo className="h-auto w-11 transition-transform duration-200 ease-out group-active:scale-97" />
          </Link>
        </div>
        <MobileNavbar />
        <DesktopNavbar />
      </nav>
    </>
  );
}
