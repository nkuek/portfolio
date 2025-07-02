import AboutMe from "~/components/AboutMeSection";
import HeroSection from "~/components/HeroSection";
import PortfolioSection from "~/components/PortfolioSection";
import SkillsSection from "~/components/SkillsSection";

export default function Home() {
  return (
    <main>
      <HeroSection />
      <AboutMe />
      <PortfolioSection />
      <SkillsSection />
    </main>
  );
}
