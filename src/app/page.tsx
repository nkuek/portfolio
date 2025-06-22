import AboutMe from "~/components/AboutMeSection";
import HeroSection from "~/components/HeroSection";
import PortfolioSection from "~/components/PortfolioSection";

export default function Home() {
  return (
    <main>
      <HeroSection />
      <AboutMe />
      <PortfolioSection />
    </main>
  );
}
