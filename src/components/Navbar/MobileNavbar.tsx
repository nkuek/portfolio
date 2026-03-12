"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { navItems } from "./constants";
import { isDropdown, type NavDropdown, type NavLink } from "./types";
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
      className="group outline-accent relative ml-auto flex flex-col rounded p-2 transition-transform duration-150 ease-out hover:cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 active:scale-97 md:hidden"
      onClick={() => setOpen((prev) => !prev)}
      aria-haspopup="menu"
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

function MobileLinkItem({
  link,
  onNavigate,
}: {
  link: NavLink;
  onNavigate: () => void;
}) {
  if (link.external) {
    return (
      <DSAnchor href={link.href} className="text-2xl" onClick={onNavigate}>
        {link.title}
      </DSAnchor>
    );
  }
  return (
    <DSLink href={link.href} className="text-2xl" onClick={onNavigate}>
      {link.title}
    </DSLink>
  );
}

function MobileAccordion({
  item,
  expanded,
  onToggle,
  onNavigate,
}: {
  item: NavDropdown;
  expanded: boolean;
  onToggle: () => void;
  onNavigate: () => void;
}) {

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={onToggle}
        aria-expanded={expanded}
        aria-label={`${item.title} submenu`}
        className="text-text hover:text-link-hover outline-accent flex cursor-pointer items-center gap-1 rounded p-1 text-2xl font-light transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        {item.title}
        <svg
          aria-hidden="true"
          width="14"
          height="14"
          viewBox="0 0 10 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`${styles.chevron} ${expanded ? styles.chevronExpanded : ""}`}
        >
          <path d="M2 3.5L5 6.5L8 3.5" />
        </svg>
      </button>

      <div
        className={styles.accordionContent}
        data-expanded={expanded || undefined}
        aria-hidden={!expanded}
      >
        <div className={styles.accordionInner}>
          <ul className="flex flex-col gap-3 pt-3">
            {item.children.map((child) => (
              <li key={child.href}>
                <Link
                  href={child.href}
                  tabIndex={expanded ? 0 : -1}
                  className="hover:bg-surface-card-alt outline-accent flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150 focus-visible:outline-2 focus-visible:-outline-offset-2"
                  onClick={onNavigate}
                >
                  {child.icon && (
                    <span className="bg-accent/10 text-accent font-source-code-pro flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold">
                      {child.icon}
                    </span>
                  )}
                  <span className="flex flex-col gap-0.5">
                    <span className="text-text text-sm font-medium">
                      {child.title}
                    </span>
                    {child.description && (
                      <span className="text-text-muted text-xs">
                        {child.description}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/** Fullscreen overlay — portaled to document.body to escape nav's transform containing block. */
function MobileOverlay() {
  const { open, setOpen } = useContext(MobileNavContext);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const handleNavigate = useCallback(() => setOpen(false), [setOpen]);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // Reset accordion when overlay closes
  useEffect(() => {
    if (!open) setExpandedItem(null);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen]);

  if (!mounted) return null;

  let itemIndex = 0;

  return createPortal(
    <nav
      id="nav-menu"
      aria-label="Mobile navigation"
      aria-hidden={!open}
      className="bg-surface-overlay fixed inset-0 z-40 flex flex-col items-center justify-center backdrop-blur-xl transition-[opacity,visibility] duration-300 ease-[var(--ease-spring)] aria-hidden:invisible aria-hidden:opacity-0 md:hidden"
    >
      <ul className="flex flex-col items-center gap-6">
        {navItems.map((item) => {
          const delay = `${itemIndex * 50}ms`;
          itemIndex += 1;

          return (
            <li
              key={item.title}
              className={styles.linkIn}
              data-open={open || undefined}
              style={{ "--delay": delay } as React.CSSProperties}
            >
              {isDropdown(item) ? (
                <MobileAccordion
                  item={item}
                  expanded={expandedItem === item.title}
                  onToggle={() =>
                    setExpandedItem((prev) =>
                      prev === item.title ? null : item.title,
                    )
                  }
                  onNavigate={handleNavigate}
                />
              ) : (
                <MobileLinkItem link={item} onNavigate={handleNavigate} />
              )}
            </li>
          );
        })}
        <li
          className={`${styles.linkIn} pt-4`}
          data-open={open || undefined}
          style={
            {
              "--delay": `${navItems.length * 50}ms`,
            } as React.CSSProperties
          }
        >
          <ThemeToggle />
        </li>
      </ul>
    </nav>,
    document.body,
  );
}

MobileNavbar.Hamburger = Hamburger;
export default MobileNavbar;
