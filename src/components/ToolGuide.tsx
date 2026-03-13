"use client";

import { useState, type ReactNode } from "react";

type ToolGuideProps = {
  title?: string;
  children: ReactNode;
};

export default function ToolGuide({
  title = "How to use",
  children,
}: ToolGuideProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-surface-card border-border-hairline mb-6 rounded-xl border shadow-[var(--shadow-card)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="text-text-subtle flex w-full cursor-pointer items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium outline-[var(--accent)] transition-colors hover:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <svg
          aria-hidden="true"
          width="12"
          height="12"
          viewBox="0 0 10 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 transition-transform duration-200 ease-[var(--ease-spring)]"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          <path d="M3.5 2L6.5 5L3.5 8" />
        </svg>
        {title}
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-[var(--ease-spring)]"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="border-border-hairline border-t px-4 pt-3 pb-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Grid wrapper — lays sections out in 2 columns on wider screens */
export function GuideGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">{children}</div>
  );
}

export function GuideSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h4 className="text-text-subtle mb-1.5 text-xs font-medium uppercase tracking-wide">
        {title}
      </h4>
      {children}
    </div>
  );
}

export function GuideList({ children }: { children: ReactNode }) {
  return (
    <ul className="text-text-muted flex flex-col gap-1 text-xs leading-relaxed">
      {children}
    </ul>
  );
}

export function GuideItem({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-baseline gap-2">
      <span className="text-accent shrink-0 text-xs leading-relaxed" aria-hidden="true">
        ▸
      </span>
      <span>{children}</span>
    </li>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="bg-surface-card-alt border-border-hairline inline-block rounded border px-1 py-0.5 font-mono text-[11px] leading-none">
      {children}
    </kbd>
  );
}
