"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { logoMap, Technology } from "~/utils/technologies";

const generateSkills = (skills: Technology[]) => {
  return skills.map((skill) => ({
    name: skill,
    ...logoMap[skill as keyof typeof logoMap],
  }));
};

const showcaseSkills: Technology[] = [
  "React",
  "Next.js",
  "TypeScript",
  "Three.js",
  "React Three Fiber",
  "GSAP",
  "CSS",
  "TailwindCSS",
  "Redux",
];

const skills = generateSkills(showcaseSkills);

export default function SkillsSection() {
  const iconContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let minId: number | null = null;
    let maxId: number | null = null;
    let debounceTimeout: NodeJS.Timeout;

    // because intersection observer is asynchronous, if the user scrolls too fast, they can pass over a skill name, meaning the opacity won't be updated
    // this debouncer loops over all skill elements and applies changes if the element is within the range of elements the user has scrolled past
    function applyChanges() {
      const skillElements = document.getElementsByClassName(
        "skill",
      ) as HTMLCollectionOf<HTMLSpanElement>;
      for (const el of skillElements) {
        const elementId = parseInt(el.getAttribute("data-id") ?? "");

        if (minId && elementId >= minId && maxId && elementId <= maxId) {
          el.setAttribute("data-highlight", "true");
        }
      }
      minId = null;
      maxId = null;
    }

    function reportIntersection(entries: IntersectionObserverEntry[]) {
      clearTimeout(debounceTimeout);
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const entryId = parseInt(entry.target.getAttribute("data-id") ?? "");
          // keep track of what element the user has scrolled past
          if (minId === null || maxId === null) {
            minId = entryId;
            maxId = entryId;
          } else {
            minId = Math.min(minId, entryId);
            maxId = Math.max(maxId, entryId);
          }
        }
      });
      debounceTimeout = setTimeout(applyChanges, 25);
    }

    const skillsObserver = new IntersectionObserver(reportIntersection, {
      rootMargin: "-60% 0% -40% 0%",
    });

    const skillElements = document.getElementsByClassName("skill");

    for (const el of skillElements) {
      skillsObserver.observe(el);
    }

    return () => {
      skillsObserver.disconnect();
      clearTimeout(debounceTimeout);
    };
  }, []);

  useEffect(() => {
    if (!iconContainerRef.current) {
      return;
    }
    const iconContainerObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          for (let i = 0; i < entries[0].target.children.length; i++) {
            const el = entries[0].target.children[i] as HTMLElement;

            el.style.setProperty("--delay", `${i * 75}ms`);
            el.setAttribute("data-animate", "true");
          }
        }
      },
      { threshold: 0.4 },
    );
    iconContainerObserver.observe(iconContainerRef.current);
    return () => {
      iconContainerObserver.disconnect();
    };
  }, []);

  return (
    <section
      id="skills"
      className="before:grainy-background text-text relative py-[108px]"
    >
      <div>
        <span className="hero block text-center md:sticky md:top-1/2">
          Honing my craft in...
        </span>
        <div className="flex flex-col pt-12 md:pt-[300px]">
          {skills.map((skill, idx) => (
            <span
              data-id={idx + 1}
              data-highlight={false}
              className="ease skill text-[clamp(3rem,_7vw,_7rem)] opacity-25 transition-opacity duration-250 data-[highlight=true]:opacity-100"
              key={skill.name}
            >
              {skill.name}
            </span>
          ))}
        </div>
      </div>
      <div
        ref={iconContainerRef}
        className="fill-text mx-auto grid max-w-[1408px] grid-cols-[repeat(2,_auto)] place-items-center justify-center gap-[3vmax] px-4 py-[104px] sm:grid-cols-[repeat(3,_auto)] md:px-8 md:py-[300px] lg:px-16"
      >
        {skills.map((skill, idx) => {
          return (
            <Link
              key={idx}
              href={skill.href}
              data-animate={false}
              className="*:ease *:fill-text max-w-[200px] transition-transform duration-500 ease-in-out *:aspect-square *:h-auto *:w-full *:max-w-[200px] *:scale-75 *:transition-transform *:delay-(--delay) *:duration-500 hover:scale-105 data-[animate=true]:*:scale-100"
              target="_blank"
              rel="noopener"
              aria-label={skill.name}
            >
              {"src" in skill.logo ? (
                <Image src={skill.logo.src} alt={skill.name} />
              ) : (
                <skill.logo alt={skill.name} />
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
