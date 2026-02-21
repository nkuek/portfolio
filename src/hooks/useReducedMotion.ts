import { useState } from "react";

/**
 * Returns true if the user prefers reduced motion.
 *
 * Uses a useState initializer so the value is only read on the client,
 * avoiding hydration mismatches (server always returns false).
 */
export default function useReducedMotion(): boolean {
  const [reduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  return reduced;
}
