import SectionTitleCard from "~/components/SectionTitleCard";

// ── Data: skills with hand-written annotations ──

const skills: { name: string; note: string }[] = [
  { name: "React", note: "// the foundation" },
  { name: "TypeScript", note: "// strict by choice" },
  { name: "Next.js", note: "// full-stack edge" },
  { name: "Design Systems", note: "// consistency at scale" },
  { name: "CSS", note: "// where the craft lives" },
  { name: "Web Accessibility", note: "// for everyone" },
  { name: "Three.js / R3F", note: "// thinking in 3D" },
  { name: "WebGPU / TSL", note: "// pushing limits" },
  { name: "GSAP", note: "// making things move" },
];

// ── Main section ──

export default function SkillsSection() {
  return (
    <section
      id="craft"
      aria-label="Technical craft"
      className="relative scroll-mt-14 py-32"
    >
      {/* Section title — scrapbook card */}
      <div className="flex items-center justify-center py-20">
        <SectionTitleCard
          title="Crafting with..."
          rotate={5}
          tapeColor="teal"
        />
      </div>

      {/* Skills list */}
      <div className="flex flex-col gap-3 px-6 md:px-12 lg:px-20">
        {skills.map((skill) => (
          <div
            key={skill.name}
            className="skill-row scroll-stagger-in flex items-baseline gap-6"
          >
            <span className="text-text text-[clamp(2.5rem,8vw,7rem)] leading-[1.15] font-[200] tracking-[-0.02em]">
              {skill.name}
            </span>
            <span className="skill-annotation shrink-0 font-mono text-[clamp(0.75rem,1.2vw,1rem)] tracking-[0.02em] italic">
              {skill.note}
            </span>
          </div>
        ))}
      </div>

      {/* Bottom breathing space */}
      <div className="h-[20vh]" aria-hidden="true" />
    </section>
  );
}
