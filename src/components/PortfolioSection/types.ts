import { AllTechnologies } from "~/utils/technologies";

export type Project = {
  title: React.ReactNode;
  technologies: AllTechnologies[];
  description: string;
  liveLink?: string;
  githubLink: string;
  src: string;
};

export type PortfolioSectionProps = {
  project: Project;
};
