const skills = [
  "React",
  "TypeScript",
  "Next.js",
  "Design Systems",
  "CSS",
  "Web Accessibility",
  "Three.js / R3F",
  "WebGPU / TSL",
  "GSAP",
];

export default function ActIV() {
  return (
    <section
      id="craft"
      aria-label="Technical craft"
      className="relative scroll-mt-14 py-24"
    >
      {/* Section header */}
      <div className="flex min-h-[30vh] items-center justify-center px-4">
        <h2 className="scroll-stagger-in text-text text-[clamp(2rem,5vw,4rem)] font-[300] tracking-[-0.02em]">
          Honing my craft in
        </h2>
      </div>

      {/* Skills list */}
      <div className="flex flex-col gap-2 px-4 md:px-8 lg:px-16">
        {skills.map((skill) => (
          <span
            key={skill}
            className="skill-reveal text-text text-[clamp(2.5rem,8vw,7rem)] leading-[1.15] font-[200] tracking-[-0.02em]"
          >
            {skill}
          </span>
        ))}
      </div>

      {/* Bottom breathing space */}
      <div className="h-[20vh]" aria-hidden="true" />
    </section>
  );
}
