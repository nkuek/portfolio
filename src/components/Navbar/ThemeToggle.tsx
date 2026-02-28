"use client";
import { useEffect, useState } from "react";
import cn from "~/utils/cn";
import SunAndMoon from "./SunAndMoon";

export type ThemePreference = "light" | "dark";

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [preference, setPreference] = useState<ThemePreference>("light");
  function updatePreference(next?: ThemePreference, persist = false) {
    setPreference((prev) => {
      const newPreference = next || (prev === "light" ? "dark" : "light");
      document.documentElement.setAttribute("data-color-scheme", newPreference);
      if (persist) {
        try {
          localStorage.setItem("theme", newPreference);
        } catch {}
      }
      return newPreference;
    });
  }

  useEffect(() => {
    const saved = (() => {
      try {
        return localStorage.getItem("theme");
      } catch {
        return null;
      }
    })();

    if (saved === "light" || saved === "dark") {
      updatePreference(saved);
    } else {
      updatePreference(
        window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light",
      );
    }

    const abortController = new AbortController();
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener(
      "change",
      (e) => {
        const hasSaved = (() => {
          try {
            return localStorage.getItem("theme") !== null;
          } catch {
            return false;
          }
        })();
        if (!hasSaved) {
          updatePreference(e.matches ? "dark" : "light");
        }
      },
      { signal: abortController.signal },
    );

    return () => abortController.abort();
  }, []);

  return (
    <>
      <div className={cn("relative flex justify-center", !compact && "mx-[17.5px]")}>
        <button
          type="button"
          role="switch"
          aria-checked={preference === "dark"}
          className={cn(
            "group block aspect-square rounded-full transition-transform duration-200 ease-out hover:cursor-pointer focus-visible:outline-offset-[5px] focus-visible:outline-none active:scale-97",
            !compact &&
              "before:bg-track-color before:absolute before:m-auto before:flex before:h-[125%] before:w-[250%] before:translate-x-[-25%] before:translate-y-[-12.5%] before:rounded-2xl before:transition-colors before:group-focus-visible:outline",
          )}
          title="Toggles light & dark"
          aria-live="polite"
          onClick={() => updatePreference(undefined, true)}
        >
          <span className="sr-only">{`Toggle Theme: ${preference}`}</span>
          <SunAndMoon compact={compact} />
        </button>
      </div>
    </>
  );
}
