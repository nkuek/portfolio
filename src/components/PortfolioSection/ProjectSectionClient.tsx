"use client";

import Image from "next/image";
import { DSButtonLink } from "~/design-system/DSLink/DSButtonLink";
import { logoMap } from "~/utils/technologies";
import { PortfolioSectionClientProps } from "./types";
import { useEffect, useRef, useState } from "react";
import { buttonVariants } from "~/design-system/DSButton/variants";

export default function ProjectSectionClient({
  project,
  blurredPlaceholder,
}: PortfolioSectionClientProps) {
  // const Image = imageMap[project.key as keyof typeof imageMap];
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!sectionRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(sectionRef.current);

    return () => observer.disconnect();
  }, [visible]);
  return (
    <section
      ref={sectionRef}
      data-visible={visible}
      className="clip-path-[inset(0)] before:image-grain group relative flex overflow-hidden before:z-[-1] md:min-h-dvh md:even:justify-end"
    >
      <Image
        className="z-[-2] aspect-[325/206] md:fixed md:inset-0 md:aspect-auto md:h-[100dvh] md:w-full md:object-cover md:object-[0_62px]"
        alt=""
        src={project.src}
        width={1920}
        height={1080}
        placeholder="blur"
        blurDataURL={blurredPlaceholder}
      />
      <div className="bg-background-dark/95 text-text-dark md:group-data-visible=true]:translate-y-0 px-4 pt-12 pb-16 group-odd:group-data-[visible=false]:translate-x-[-15%] after:opacity-0 md:h-[100dvh] md:w-[max(35%,400px)] md:max-w-[660px] md:px-8 md:py-20 md:transition-[opacity,translate] md:duration-750 md:group-data-[visible=false]:opacity-0 md:group-even:group-data-[visible=false]:translate-x-[15%] lg:px-12 lg:py-[120px]">
        <h3 className="hero md:group-even:group-data-[visible=true]:after:animate-reveal-right-to-left md:group-odd:group-data-[visible=true]:after:animate-reveal-left-to-right after:after-underline text-text-dark relative mb-6">
          {project.title}
        </h3>
        <p className="body mt-3 mb-6">{project.description}</p>
        <div className="flex flex-wrap gap-5">
          {project.liveLink && (
            <DSButtonLink href={project.liveLink} variant="primary">
              Live
            </DSButtonLink>
          )}
          <DSButtonLink href={project.githubLink} variant="secondary">
            GitHub
          </DSButtonLink>
        </div>
        <div className="after:after-underline md:group-even:group-data-[visible=true]:after:animate-reveal-right-to-left group-data-[visible=true]:after:animation-state-running md:group-odd:group-data-[visible=true]:after:animate-reveal-left-to-right after:animation-delay-500 relative my-12 flex flex-wrap gap-3 py-6 after:top-0 after:opacity-0">
          {project.technologies.map((technology) => {
            const technologyInfo = logoMap[technology as keyof typeof logoMap];
            return technologyInfo ? (
              <DSButtonLink
                variant="tertiary"
                size="small"
                href={technologyInfo.href}
                target="_blank"
                rel="noopener"
                key={technology}
              >
                {technology}
              </DSButtonLink>
            ) : (
              <span
                className={buttonVariants({
                  variant: "tertiary",
                  size: "small",
                })}
                key={technology}
              >
                {technology}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
