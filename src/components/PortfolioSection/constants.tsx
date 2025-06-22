import { Project } from "./types";

export const projects: Project[] = [
  {
    title: "archetyper",
    technologies: ["React", "TypeScript", "MaterialUI", "CSS"],
    description:
      "Elevate your typing experience with this fully-themed type tester. Calculate and visualize your words per minute in style.",
    liveLink: "https://archetyper.vercel.app/",
    githubLink: "https://github.com/nkuek/archetyper",
    src: "https://res.cloudinary.com/dunbkcyqq/image/upload/v1692465807/archetyper_itxv7j.png",
  },
  {
    title: "SortEd",
    technologies: ["React", "JavaScript", "CSS", "MaterialUI"],
    description:
      "Discover the elegance of sorting algorithms through an interactive visualizer built with React. Customize themes, sizes, and speeds for deeper understanding and coding insights.",
    githubLink: "https://github.com/nkuek/SortEd",
    liveLink: "https://sort-ed.vercel.app/",
    src: "https://res.cloudinary.com/dunbkcyqq/image/upload/v1692465807/sorted_xq4pik.png",
  },
  {
    title: (
      <>
        Whats
        <wbr />
        Appening
      </>
    ),
    technologies: ["React", "Redux", "Express", "MaterialUI"],
    description:
      "A fully functional clone of the popular messaging app WhatsApp that employs a React/Redux frontend and an Express/Sequelize backend, enabling a real-time messaging experience on a single-page application.",
    githubLink: "https://github.com/nkuek/WhatsAppening",
    src: "https://res.cloudinary.com/dunbkcyqq/image/upload/v1692465807/whatsappening_gcaib9.png",
  },
  {
    title: "Discordance",
    technologies: ["React", "Redux", "JavaScript", "Python"],
    description:
      "A Discord-like clone, powered by React/Redux on the frontend and Flask-SQLAlchemy on the backend. It enables live server chat via web sockets, offers auto-complete search, and allows users to explore public groups by category.",
    githubLink: "https://github.com/nkuek/discordance",
    src: "https://res.cloudinary.com/dunbkcyqq/image/upload/v1692465807/discordance_oywept.png",
  },
];
