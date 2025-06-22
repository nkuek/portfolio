import { projects } from "./constants";
import ProjectSection from "./ProjectSection";

export default function PortfolioSection() {
  return (
    <div id="portfolio">
      {projects.map((project, idx) => (
        <ProjectSection project={project} key={idx} />
      ))}
    </div>
  );
}
