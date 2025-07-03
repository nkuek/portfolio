"use client";
import { useState } from "react";
import { sections } from "./constants";
import DSLink from "~/design-system/DSLink";
import ThemeToggle from "./ThemeToggle";
import DSAnchor from "~/design-system/DSLink/DSAnchor";

export default function MobileNavbar() {
  const [showNavDrawer, setShowNavDrawer] = useState(false);
  return (
    <>
      <div className="bg-inherit md:hidden">
        <div className="right-0 left-0 flex min-h-14 justify-end bg-inherit">
          <button
            className="group z-3 flex flex-col p-4 hover:cursor-pointer"
            onClick={() => {
              setShowNavDrawer((prev) => !prev);
            }}
            aria-haspopup
            aria-expanded={showNavDrawer}
            aria-controls="nav-menu"
            aria-label="open navigation menu"
          >
            <div
              className="[&>div]:bg-text flex flex-col gap-1.5 text-inherit transition-transform duration-200 ease-linear [&>div]:h-[2px] [&>div]:w-[23.5px] [&>div]:transition-transform group-aria-expanded:[&>div]:duration-200 group-aria-expanded:[&>div]:ease-linear"
              // class={vstack({
              //   color: "inherit",
              //   gap: 1.5,
              //   transform: showNavDrawer.value ? "translateY(4px)" : "none",
              //   transition: "linear 200ms transform",
              //   "& > div": {
              //     w: "23.5px",
              //     h: "2px",
              //     background: "text",
              //     transition: "linear 200ms transform",
              //     "&:first-child": {
              //       transform: showNavDrawer.value
              //         ? "rotateZ(45deg) translateY(2px)"
              //         : "none",
              //       transformOrigin: "center",
              //     },
              //     "&:nth-child(2)": {
              //       transform: showNavDrawer.value
              //         ? "rotate(-45deg) scaleX(1.37) translate(2.75px, -.75px)"
              //         : "none",
              //       transformOrigin: "center",
              //     },
              //     "&:last-child": {
              //       transform: showNavDrawer.value
              //         ? "rotateZ(45deg) translateY(-1.1px)"
              //         : "none",
              //       transformOrigin: "23.5px",
              //     },
              //   },
              // })}
            >
              <div className="origin-center group-aria-[expanded=true]:translate-y-[2px] group-aria-[expanded=true]:rotate-z-45" />
              <div className="origin-center group-aria-[expanded=true]:translate-x-[2.75px] group-aria-[expanded=true]:-translate-y-[0.75px] group-aria-[expanded=true]:scale-x-[1.37] group-aria-[expanded=true]:-rotate-45" />
              <div className="origin-[23.5px] group-aria-[expanded=true]:-translate-y-[1.1px] group-aria-[expanded=true]:rotate-z-45" />
            </div>
          </button>
        </div>
        <div
          aria-hidden="true"
          data-visible={showNavDrawer}
          className="fixed inset-0 z-[1] h-screen w-full bg-neutral-800 opacity-0 transition-[visibility,opacity] duration-500 ease-in-out data-[visible=false]:invisible data-[visible=true]:visible data-[visible=true]:opacity-50"
          onClick={() => setShowNavDrawer(false)}
        />
      </div>
      <ul
        aria-hidden={!showNavDrawer}
        className="ease bg-background fixed top-0 left-0 z-3 flex h-screen w-[max(40vw,266px)] flex-col items-start gap-0 overflow-y-auto overscroll-contain pt-6 transition-transform duration-250 aria-hidden:-translate-x-full md:hidden"
        role="menu"
        id="nav-menu"
      >
        <li
          className="flex w-full items-center px-4"
          onClick={() => setShowNavDrawer(false)}
          role="menuitem"
        >
          <DSAnchor
            href="/KuekResume.pdf"
            className="w-full border-b border-zinc-700 p-3"
          >
            Resume
          </DSAnchor>
        </li>
        {sections.map((section) => (
          <li
            key={section.title}
            className="flex w-full items-center px-4"
            onClick={() => setShowNavDrawer(false)}
            role="menuitem"
          >
            <DSLink
              href={section.href}
              className="w-full border-b border-zinc-700 p-3"
            >
              {section.title}
            </DSLink>
          </li>
        ))}
        <li
          className="flex w-full items-center justify-center py-6"
          role="menuitem"
        >
          <ThemeToggle />
        </li>
      </ul>
    </>
  );
}
