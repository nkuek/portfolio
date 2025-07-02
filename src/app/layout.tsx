import type { Metadata } from "next";
import { Poppins, Source_Code_Pro, Fira_Code } from "next/font/google";
import "./globals.css";
import Navbar from "~/components/Navbar";
import Footer from "~/components/Footer";

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

export const metadata: Metadata = {
  title: "Nick Kuek's Portfolio",
  description:
    "Nick Kuek is a frontend engineer with a passion for making the web more beautiful.",
  alternates: {
    canonical: "https://www.nkuek.dev/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${poppins.variable} ${sourceCodePro.variable} ${firaCode.variable} before:grainy-background antialiased before:fixed before:inset-0 before:z-[-1]`}
      >
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
