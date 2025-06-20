"use client";
import { useEffect, useState } from "react";
import SunAndMoon from "./SunAndMoon";

export type ThemePreference = "light" | "dark";

export default function ThemeToggle() {
  const [preference, setPreference] = useState<ThemePreference>("light");
  function togglePreference() {
    setPreference((prev) => {
      const opposite = prev === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-color-scheme", opposite);
      return opposite;
    });
  }

  useEffect(() => {
    const abortController = new AbortController();
    const listener = () => {
      togglePreference();
    };
    window.addEventListener("change", listener, {
      signal: abortController.signal,
    });

    return () => abortController.abort();
  }, []);
  return (
    <>
      <div className="relative mx-[17.5px] flex justify-center">
        <button
          type="button"
          role="switch"
          aria-checked={preference === "dark"}
          className="before:bg-track-color group block aspect-square rounded-[50%] duration-200 before:absolute before:m-auto before:flex before:h-[125%] before:w-[250%] before:translate-x-[-25%] before:translate-y-[-12.5%] before:rounded-2xl before:transition-colors before:group-focus-visible:outline hover:cursor-pointer focus-visible:outline-offset-[5px] focus-visible:outline-none"
          title="Toggles light & dark"
          aria-live="polite"
          onClick={togglePreference}
        >
          <span className="sr-only">{`Toggle Theme: ${preference}`}</span>
          <SunAndMoon />
        </button>
      </div>
    </>
  );
}
