"use client";

import { useRef } from "react";
import HeroDappledZone from "~/components/HeroDappledZone";
import ProjectSection from "~/components/ProjectSection";
import InTheWild from "~/components/InTheWild";
import Footer from "~/components/Footer";
import ScrollToTop from "~/components/ScrollToTop";
import AsciiAmbient from "~/components/HeroSection/AsciiAmbient";
import type { HighlightData } from "~/types/highlight";
import GridTicks, {
  type MouseOffset,
  type YAxisData,
} from "~/components/GridTicks";
import Crosshair, { type CrosshairData } from "~/components/Crosshair";
import XAxisTicks, { type XAxisData } from "~/components/XAxisTicks";

export default function HomeClient({
  children,
}: {
  children?: React.ReactNode;
}) {
  const highlightRef = useRef<HighlightData>({ text: "", intensity: 0 });
  const heroCompleteRef = useRef(false);
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
  const mouseOffsetRef = useRef<MouseOffset>({ x: 0, y: 0 });
  const yAxisRef = useRef<YAxisData>({ y: 0, active: false });

  return (
    <>
      {/* Fixed ASCII canvas — one instance behind everything */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <AsciiAmbient
          highlightRef={highlightRef}
          enabledRef={heroCompleteRef}
        />
      </div>
      <GridTicks mouseOffsetRef={mouseOffsetRef} yAxisRef={yAxisRef} />
      <Crosshair dataRef={crosshairRef} />
      <XAxisTicks dataRef={xAxisRef} mouseOffsetRef={mouseOffsetRef} />
      <div className="relative z-1">
        <HeroDappledZone onComplete={heroCompleteRef} />
        <ProjectSection
          highlightRef={highlightRef}
          crosshairRef={crosshairRef}
          xAxisRef={xAxisRef}
          mouseOffsetRef={mouseOffsetRef}
        />
        <InTheWild
          highlightRef={highlightRef}
          crosshairRef={crosshairRef}
          xAxisRef={xAxisRef}
          yAxisRef={yAxisRef}
        />
        {children}
        <Footer />
        <ScrollToTop />
      </div>
    </>
  );
}
