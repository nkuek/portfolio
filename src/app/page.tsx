"use client";

import { useRef } from "react";
import HeroSection from "~/components/HeroSection";
import ProjectSection from "~/components/ProjectSection";
import InTheWild from "~/components/InTheWild";
import SkillsSection from "~/components/SkillsSection";
import Footer from "~/components/Footer";
import AsciiAmbient, {
  type HighlightData,
} from "~/components/HeroSection/AsciiAmbient";

export default function Home() {
  const highlightRef = useRef<HighlightData>({ text: "", intensity: 0 });

  return (
    <main>
      {/* Fixed ASCII canvas — one instance behind everything */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <AsciiAmbient highlightRef={highlightRef} />
      </div>
      <div className="relative z-[1]">
        <HeroSection />
        <ProjectSection highlightRef={highlightRef} />
        <InTheWild highlightRef={highlightRef} />
        <SkillsSection />
        <Footer />
      </div>
    </main>
  );
}
