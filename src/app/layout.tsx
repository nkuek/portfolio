import type { Metadata } from "next";
import {
  Poppins,
  Source_Code_Pro,
  Fira_Code,
  Libre_Baskerville,
} from "next/font/google";
import "./globals.css";
import Navbar from "~/components/Navbar";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ReactLenis } from "lenis/react";

const poppins = Poppins({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
  subsets: ["latin"],
});

const sourceCodePro = Source_Code_Pro({
  variable: "--font-source-code-pro",
  subsets: ["latin"],
});

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
});

const libreBaskerville = Libre_Baskerville({
  weight: ["400", "700"],
  variable: "--font-libre-baskerville",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.nkuek.dev"),
  title: {
    default: "Nick Kuek | Design Engineer",
    template: "%s | Nick Kuek",
  },
  description:
    "Design Engineer crafting scroll-driven narratives, WebGPU experiences, and creative interfaces with React, TypeScript, Three.js, and Next.js.",
  keywords: [
    "Nick Kuek",
    "Design Engineer",
    "Creative Developer",
    "Frontend Developer",
    "React",
    "TypeScript",
    "Next.js",
    "Three.js",
    "React Three Fiber",
    "WebGPU",
    "GLSL",
    "TSL",
    "GSAP",
    "CSS",
    "Web Accessibility",
    "Design Systems",
    "Creative Coding",
    "Interactive Web",
    "Portfolio",
  ],
  authors: [{ name: "Nick Kuek", url: "https://www.nkuek.dev" }],
  creator: "Nick Kuek",
  publisher: "Nick Kuek",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Nick Kuek — Design Engineer",
    description:
      "Design Engineer crafting scroll-driven narratives, WebGPU experiences, and creative interfaces with React, TypeScript, Three.js, and Next.js.",
    url: "/",
    siteName: "Nick Kuek",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Nick Kuek — Design Engineer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nick Kuek — Design Engineer",
    description:
      "Design Engineer crafting scroll-driven narratives, WebGPU experiences, and creative interfaces with React, TypeScript, Three.js, and Next.js.",
    images: ["/opengraph-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Nick Kuek",
  url: "https://www.nkuek.dev",
  jobTitle: "Design Engineer",
  description:
    "Design Engineer crafting scroll-driven narratives, WebGPU experiences, and creative interfaces.",
  sameAs: [
    "https://github.com/nkuek/",
    "https://www.linkedin.com/in/nick-kuek/",
  ],
  knowsAbout: [
    "React",
    "TypeScript",
    "Next.js",
    "Three.js",
    "WebGPU",
    "GLSL",
    "CSS",
    "Design Systems",
    "Web Accessibility",
    "Creative Coding",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-color-scheme",t)}catch(e){}})()`,
          }}
        />
      </head>
      <body
        className={`${poppins.variable} ${sourceCodePro.variable} ${firaCode.variable} ${libreBaskerville.variable} before:grainy-background overflow-x-clip antialiased before:fixed before:inset-0 before:-z-1`}
      >
        <ReactLenis root />
        <Analytics />
        <SpeedInsights />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
