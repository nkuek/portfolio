import type { Metadata } from "next";
import ValentineForm from "./ValentineForm";

export const metadata: Metadata = {
  title: "Be Mine? 💌",
  description: "A very important question...",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Be Mine? 💌",
    description: "A very important question...",
  },
  alternates: {
    canonical: "/be-mine",
  },
};

export default function BeMinePage() {
  return <ValentineForm />;
}
