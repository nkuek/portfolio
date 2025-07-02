import getCloudinaryPlaceholder from "~/utils/getCloudinaryPlaceholder";
import ProjectSectionClient from "./ProjectSectionClient";
import { PortfolioSectionProps } from "./types";

export default async function ProjectSection({
  project,
}: PortfolioSectionProps) {
  const dataUrl = await getCloudinaryPlaceholder(project.src);
  return (
    <ProjectSectionClient project={project} blurredPlaceholder={dataUrl} />
  );
}
