import type { Point } from "./cameraPath";

export type FragmentLayout = {
  imageRotate: number;
  imageOffset: [number, number];
  infoRotate: number;
  infoOffset: [number, number];
};

export type StickyNote = {
  text: string;
  color: "teal" | "rose" | "amber";
  offset: [number, number];
  rotate: number;
};

export type Project = {
  title: string;
  description: string;
  technologies: string[];
  liveLink?: string;
  githubLink?: string;
  src: string;
  isShowcase?: boolean;
  showcaseSlug?: string;
  /** Position in the 2D world (px from origin) */
  position: Point;
  /** Per-project pinned fragment layout — hand-tuned curated chaos */
  fragments: FragmentLayout;
  /** Sticky notes that converge on the project when focused */
  stickyNotes: StickyNote[];
};

export const projects: Project[] = [
  {
    title: "archetyper",
    description:
      "A fully-themed typing tester with real-time WPM visualization, custom themes, and a focus on interaction design and polish.",
    technologies: ["React", "TypeScript", "CSS"],
    liveLink: "https://archetyper.vercel.app/",
    githubLink: "https://github.com/nkuek/archetyper",
    src: "https://res.cloudinary.com/dunbkcyqq/video/upload/f_auto,q_auto,h_800/archetyper.mov",
    position: { x: 0, y: 0 },
    fragments: {
      imageRotate: -2.5,
      imageOffset: [-30, 0],
      infoRotate: 1.2,
      infoOffset: [-320, 200],
    },
    stickyNotes: [
      { text: "my favorite", color: "amber", offset: [-440, -140], rotate: -6 },
      {
        text: "personal record: 152 wpm 👀",
        color: "teal",
        offset: [460, -280],
        rotate: 4,
      },
    ],
  },
  {
    title: "Particle Displacement",
    description:
      "65,000 particles arranged on a sphere, scattered by mouse interaction via WebGPU compute shaders. Real-time physics with TSL.",
    technologies: ["Three.js", "React Three Fiber", "WebGPU", "TSL"],
    liveLink: "https://showcase.nkuek.dev/particle-displacement",
    isShowcase: true,
    showcaseSlug: "particle-displacement",
    src: "https://res.cloudinary.com/dunbkcyqq/video/upload/f_auto,q_auto,w_800/particle-displacement.mov",
    position: { x: -450, y: 2000 },
    fragments: {
      imageRotate: -1.3,
      imageOffset: [20, 0],
      infoRotate: 1.8,
      infoOffset: [-320, 380],
    },
    stickyNotes: [
      {
        text: "as seen on Mercury Spheres",
        color: "rose",
        offset: [-440, -50],
        rotate: -30,
      },
      {
        text: "now built with TSL",
        color: "teal",
        offset: [330, 380],
        rotate: -3,
      },
    ],
  },
  {
    title: "Corne Keyboard",
    description:
      "A 3D interactive split keyboard model. Type on your physical keyboard and watch the keys respond in 3D space. A personal passion project bridging hardware and web.",
    technologies: ["Blender", "Three.js", "React Three Fiber", "GLSL"],
    liveLink: "https://showcase.nkuek.dev/corne",
    isShowcase: true,
    showcaseSlug: "corne",
    src: "https://res.cloudinary.com/dunbkcyqq/video/upload/f_auto,q_auto,w_800/corne.mov",
    position: { x: 1350, y: 4000 },
    fragments: {
      imageRotate: 2.2,
      imageOffset: [-35, 0],
      infoRotate: -20,
      infoOffset: [-310, 300],
    },
    stickyNotes: [
      {
        text: "modeled after my trusty daily driver keyboard",
        color: "amber",
        offset: [450, -110],
        rotate: -5,
      },
      {
        text: "hardware meets web",
        color: "teal",
        offset: [-400, -200],
        rotate: -30,
      },
    ],
  },
  {
    title: "Particle Morphing",
    description:
      "An interactive WebGL experiment built with React Three Fiber and custom GLSL shaders, where videos seamlessly morph between each other. Transitions are choreographed with GSAP and enhanced with bloom postprocessing.",
    technologies: ["Three.js", "React Three Fiber", "GLSL", "GSAP"],
    liveLink: "https://showcase.nkuek.dev/particle-morphing",
    isShowcase: true,
    showcaseSlug: "particle-morphing",
    src: "https://res.cloudinary.com/dunbkcyqq/video/upload/f_auto,q_auto,w_800/particle-morphing.mov",
    position: { x: -300, y: 6000 },
    fragments: {
      imageRotate: -3.0,
      imageOffset: [24, 0],
      infoRotate: 5.4,
      infoOffset: [-280, 185],
    },
    stickyNotes: [
      {
        text: "creative coding",
        color: "rose",
        offset: [440, -200],
        rotate: 3,
      },
      {
        text: "curl noise + bloom",
        color: "amber",
        offset: [-445, -70],
        rotate: -4,
      },
    ],
  },
];

/** Camera waypoints — the viewport centers on these as you scroll */
export const cameraWaypoints: Point[] = projects.map((p) => p.position);

/** Floating labels scattered in the negative space between projects */
export const floatingLabels: {
  text: string;
  position: Point;
  size: "sm" | "md" | "lg";
}[] = [
  // ── Around archetyper (0, 0) ──
  { text: "interaction design", position: { x: 620, y: -400 }, size: "lg" },
  { text: "real-time WPM", position: { x: -650, y: -380 }, size: "sm" },
  { text: "custom themes", position: { x: 700, y: 400 }, size: "md" },
  { text: "keyboard events", position: { x: -620, y: 420 }, size: "sm" },
  { text: "React", position: { x: 750, y: -150 }, size: "lg" },
  { text: "TypeScript", position: { x: -700, y: 150 }, size: "lg" },
  { text: "CSS", position: { x: 900, y: -350 }, size: "lg" },

  // ── Between archetyper → Particle Displacement ──
  { text: "Next.js", position: { x: -200, y: 1050 }, size: "lg" },
  { text: "TSL", position: { x: -400, y: 800 }, size: "md" },
  { text: "WebGPU", position: { x: -600, y: 1700 }, size: "lg" },
  { text: "Three.js", position: { x: 750, y: 1900 }, size: "lg" },
  { text: "R3F", position: { x: 1200, y: 2100 }, size: "md" },
  { text: "compute shaders", position: { x: 400, y: 2100 }, size: "lg" },

  // ── Around Particle Displacement (-450, 2700) ──
  { text: "65k particles", position: { x: -1150, y: 2450 }, size: "md" },
  { text: "sphere geometry", position: { x: 350, y: 2400 }, size: "sm" },
  { text: "mouse repulsion", position: { x: -1200, y: 2800 }, size: "md" },
  { text: "real-time physics", position: { x: 400, y: 3050 }, size: "lg" },

  // ── Between Particle Displacement → Corne ──
  { text: "GLSL", position: { x: 500, y: 3350 }, size: "lg" },
  { text: "TailwindCSS", position: { x: -600, y: 3550 }, size: "md" },
  { text: "Design Systems", position: { x: -350, y: 3850 }, size: "lg" },
  { text: "custom shaders", position: { x: 1350, y: 3500 }, size: "md" },

  // ── Around Corne Keyboard (1350, 4200) ──
  { text: "split ergonomic", position: { x: 600, y: 3950 }, size: "sm" },
  { text: "3D key response", position: { x: 2100, y: 3950 }, size: "md" },
  { text: "physical → digital", position: { x: 550, y: 4500 }, size: "md" },
  { text: "type to interact", position: { x: 2100, y: 4650 }, size: "md" },

  // ── Between Corne → Particle Morphing ──
  { text: "GSAP", position: { x: 1400, y: 4850 }, size: "md" },

  // ── Around Particle Morphing (-300, 5700) ──
  { text: "video textures", position: { x: -1050, y: 5400 }, size: "md" },
  { text: "curl noise", position: { x: 500, y: 5400 }, size: "md" },
  { text: "post-processing", position: { x: -1000, y: 5900 }, size: "sm" },
  { text: "bloom transitions", position: { x: 550, y: 5950 }, size: "sm" },
  { text: "GLSL", position: { x: -1050, y: 6150 }, size: "lg" },
  { text: "geometry morphing", position: { x: 500, y: 6200 }, size: "md" },
];

/** Lines connecting projects — sequential path + cross-links */
export const connectionLines: [number, number][] = [
  [0, 1], // archetyper → Particle Displacement
  [1, 2], // Particle Displacement → Corne
  [2, 3], // Corne → Particle Morphing
  [1, 3], // Particle Displacement → Particle Morphing (cross-link: both particle/shader projects)
];
