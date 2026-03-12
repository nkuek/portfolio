import type { NavItem } from "./types";

export const navItems: NavItem[] = [
  {
    title: "Portfolio",
    children: [
      {
        title: "Work",
        href: "/#work",
        icon: "W",
        description: "Selected projects",
      },
      {
        title: "Skills",
        href: "/#skills",
        icon: "S",
        description: "Technical proficiencies",
      },
    ],
  },
  {
    title: "Tools",
    children: [
      {
        title: "Easing Curator",
        href: "/tools/easing",
        icon: "~",
        description: "Bezier & spring curves",
      },
      {
        title: "Shader Playground",
        href: "/tools/shader",
        icon: "#",
        description: "Live GLSL editor",
      },
      {
        title: "Keyframe Sequencer",
        href: "/tools/keyframe",
        icon: "▶",
        description: "Multi-step animations",
      },
    ],
  },
  { title: "Resume", href: "/resume", external: true },
  { title: "Contact", href: "/#contact" },
];
