"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { sections } from "./constants";
import styles from "./styles.module.css";
import DSLink from "~/design-system/DSLink";
import DSAnchor from "~/design-system/DSLink/DSAnchor";
import ThemeToggle from "./ThemeToggle";

const MobileNavContext = createContext<{
  open: boolean;
  setOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
}>({ open: false, setOpen: () => {} });

export function useMobileNav() {
  return useContext(MobileNavContext);
}

/**
 * Provider wrapper — place around the <nav> so both the hamburger (inside nav)
 * and the overlay (portaled to document.body) share state.
 */
function MobileNavbar({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <MobileNavContext.Provider value={{ open, setOpen }}>
      {children}
      <MobileOverlay />
    </MobileNavContext.Provider>
  );
}

/** Hamburger toggle — rendered inside the <nav> pill, doubles as close button. */
function Hamburger() {
  const { open, setOpen } = useContext(MobileNavContext);
  return (
    <button
      className="group relative ml-auto flex flex-col p-2 transition-transform duration-150 ease-out hover:cursor-pointer active:scale-97 md:hidden"
      onClick={() => setOpen((prev) => !prev)}
      aria-haspopup
      aria-expanded={open}
      aria-controls="nav-menu"
      aria-label={open ? "close navigation menu" : "open navigation menu"}
    >
      <div className="[&>div]:bg-text flex flex-col gap-1.5 text-inherit [&>div]:h-[2px] [&>div]:w-5 [&>div]:transition-[translate,rotate,scale,opacity] [&>div]:duration-300 [&>div]:ease-[var(--ease-spring)]">
        <div className="origin-center group-aria-expanded:translate-y-2 group-aria-expanded:rotate-45" />
        <div className="origin-center group-aria-expanded:scale-0 group-aria-expanded:opacity-0" />
        <div className="origin-center group-aria-expanded:-translate-y-2 group-aria-expanded:-rotate-45" />
      </div>
    </button>
  );
}

/** Fullscreen overlay — portaled to document.body to escape nav's transform containing block. */
function MobileOverlay() {
  const { open, setOpen } = useContext(MobileNavContext);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      id="nav-menu"
      role="menu"
      aria-hidden={!open}
      className="bg-surface-overlay fixed inset-0 z-3 flex flex-col items-center justify-center backdrop-blur-xl transition-[opacity,visibility] duration-300 ease-[var(--ease-spring)] aria-hidden:invisible aria-hidden:opacity-0 md:hidden"
    >
      <ul className="flex flex-col items-center gap-6">
        {sections.map((section, i) => (
          <li
            key={section.title}
            role="menuitem"
            className={styles.linkIn}
            data-open={open || undefined}
            style={{ "--delay": `${i * 50}ms` } as React.CSSProperties}
            onClick={() => setOpen(false)}
          >
            {section.external ? (
              <DSAnchor href={section.href} className="text-2xl">
                {section.title}
              </DSAnchor>
            ) : (
              <DSLink href={section.href} className="text-2xl">
                {section.title}
              </DSLink>
            )}
          </li>
        ))}
        <li
          role="menuitem"
          className={`${styles.linkIn} pt-4`}
          data-open={open || undefined}
          style={
            {
              "--delay": `${sections.length * 50}ms`,
            } as React.CSSProperties
          }
        >
          <ThemeToggle />
        </li>
      </ul>
    </div>,
    document.body,
  );
}

MobileNavbar.Hamburger = Hamburger;
export default MobileNavbar;
