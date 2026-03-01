import { useEffect, useState } from "react";

/**
 * Returns true if the user prefers reduced motion.
 *
 * Uses a useState initializer so the value is only read on the client,
 * avoiding hydration mismatches (server always returns false).
 * Listens for changes so toggling the OS setting updates live.
 */
export default function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return reduced;
}
