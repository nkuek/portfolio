"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { NavDropdown as NavDropdownType } from "./types";
import styles from "./styles.module.css";

export default function NavDropdown({ item }: { item: NavDropdownType }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        containerRef.current
          ?.querySelector<HTMLElement>("[aria-haspopup]")
          ?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [open]);

  // Close when focus leaves the container
  useEffect(() => {
    if (!open) return;
    const container = containerRef.current;
    const onFocusOut = (e: FocusEvent) => {
      if (container && !container.contains(e.relatedTarget as Node)) {
        setOpen(false);
      }
    };
    container?.addEventListener("focusout", onFocusOut);
    return () => container?.removeEventListener("focusout", onFocusOut);
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        requestAnimationFrame(() => itemRefs.current[0]?.focus());
      } else {
        itemRefs.current[0]?.focus();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (open) {
        itemRefs.current[itemRefs.current.length - 1]?.focus();
      }
    }
  };

  const handleItemKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      itemRefs.current[index + 1]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      itemRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={handleKeyDown}
        className={`${styles.navLink} body hover:text-link-hover text-text outline-accent flex cursor-pointer items-center gap-1 rounded transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-4`}
      >
        {item.title}
        <svg
          aria-hidden="true"
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path d="M2 3.5L5 6.5L8 3.5" />
        </svg>
      </button>

      <div
        role="menu"
        className={`${styles.dropdownPanel} ${open ? styles.dropdownOpen : ""}`}
        aria-hidden={!open}
      >
        {item.children.map((child, i) => (
          <Link
            key={child.href}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            href={child.href}
            role="menuitem"
            tabIndex={open ? 0 : -1}
            onClick={() => setOpen(false)}
            onKeyDown={(e) => handleItemKeyDown(e, i)}
            style={{ "--stagger": `${i * 40}ms` } as React.CSSProperties}
            className={`${styles.dropdownItem} outline-accent group before:bg-accent hover:bg-surface-card-alt relative flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150 before:absolute before:inset-y-1 before:left-0 before:w-0.5 before:rounded-full before:opacity-0 before:transition-opacity before:duration-150 hover:before:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2`}
          >
            {child.icon && (
              <span className="bg-accent/10 text-accent font-source-code-pro flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold">
                {child.icon}
              </span>
            )}
            <span className="flex flex-col gap-0.5">
              <span className="text-text-card-title text-sm font-medium">
                {child.title}
              </span>
              {child.description && (
                <span className="text-text-muted text-xs">
                  {child.description}
                </span>
              )}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
