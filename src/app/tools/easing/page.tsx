import type { Metadata } from "next";
import EasingCurator from "~/components/EasingCurator";

export const metadata: Metadata = {
  title: "Easing Curator",
  description:
    "Craft, compare, and export cubic-bezier easing curves. A modern alternative to cubic-bezier.com with real UI previews.",
  alternates: {
    canonical: "/tools/easing",
  },
  openGraph: {
    title: "Easing Curator | Nick Kuek",
    description:
      "Craft, compare, and export cubic-bezier easing curves. A modern alternative to cubic-bezier.com with real UI previews.",
  },
  twitter: {
    title: "Easing Curator | Nick Kuek",
    description:
      "Craft, compare, and export cubic-bezier easing curves. A modern alternative to cubic-bezier.com with real UI previews.",
  },
};

export default function EasingPage() {
  return <EasingCurator />;
}
