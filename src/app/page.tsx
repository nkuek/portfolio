import HomeClient from "~/components/HomeClient";
import SkillsSection from "~/components/SkillsSection";

export default function Home() {
  return (
    <main>
      <HomeClient>
        <SkillsSection />
      </HomeClient>
    </main>
  );
}
