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
import GridTicks from "~/components/GridTicks";
import Crosshair, { type CrosshairData } from "~/components/Crosshair";
import XAxisTicks, { type XAxisData } from "~/components/XAxisTicks";

export default function HomeClient() {
  const highlightRef = useRef<HighlightData>({ text: "", intensity: 0 });
  const crosshairRef = useRef<CrosshairData>({
    label: "",
    focused: false,
    visible: false,
  });
  const xAxisRef = useRef<XAxisData>({
    cameraX: 0,
    translateX: 0,
    visible: false,
  });

  return (
    <>
      {/* Fixed ASCII canvas — one instance behind everything */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <AsciiAmbient highlightRef={highlightRef} />
      </div>
      <GridTicks />
      <Crosshair dataRef={crosshairRef} />
      <XAxisTicks dataRef={xAxisRef} />
      <div className="relative z-1">
        <HeroSection />
        <ProjectSection
          highlightRef={highlightRef}
          crosshairRef={crosshairRef}
          xAxisRef={xAxisRef}
        />
        <InTheWild
          highlightRef={highlightRef}
          crosshairRef={crosshairRef}
          xAxisRef={xAxisRef}
        />
        <SkillsSection />
        <Footer />
      </div>
    </>
  );
}
