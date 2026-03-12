import type { Metadata } from "next";
import KeyframeSequencer from "~/components/KeyframeSequencer";

export const metadata: Metadata = {
  title: "Keyframe Sequencer",
  description:
    "Design multi-step CSS keyframe animations with per-segment easing, live preview, and export to CSS, Tailwind v4, and Framer Motion.",
  alternates: {
    canonical: "/tools/keyframe",
  },
  openGraph: {
    title: "Keyframe Sequencer | Nick Kuek",
    description:
      "Design multi-step CSS keyframe animations with per-segment easing, live preview, and export to CSS, Tailwind v4, and Framer Motion.",
  },
  twitter: {
    title: "Keyframe Sequencer | Nick Kuek",
    description:
      "Design multi-step CSS keyframe animations with per-segment easing, live preview, and export to CSS, Tailwind v4, and Framer Motion.",
  },
};

export default function KeyframePage() {
  return <KeyframeSequencer />;
}
