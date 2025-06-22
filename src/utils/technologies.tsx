import ReactLogo from "~/images/react.svg";
import ReduxLogo from "~/images/redux.svg";
import JavaScriptLogo from "~/images/javascript.svg";
import TypeScriptLogo from "~/images/typescript.svg";
import ThreeJSLogo from "~/images/threejs.svg";
import NextJSLogo from "~/images/nextjs.svg";
import GSAPLogo from "~/images/gsap.png";
import ReactThreeFiberLogo from "~/images/r3f.svg";
import CSSLogo from "~/images/css.svg";
import TailwindCSSLogo from "~/images/tailwind.svg";
import Image from "next/image";

type Technology =
  | "React"
  | "Redux"
  | "JavaScript"
  | "TypeScript"
  | "CSS"
  | "Next.js"
  | "GSAP"
  | "Three.js"
  | "React Three Fiber"
  | "MaterialUI"
  | "Python"
  | "Express"
  | "TailwindCSS";

type OldTechnologies = "MaterialUI" | "Python" | "Express";

export type AllTechnologies = Technology | OldTechnologies;

type ShowcasedTechnologies = Exclude<AllTechnologies, OldTechnologies>;

type TechnologyMap = {
  logo: typeof ReactLogo | typeof GSAPLogo;
  href: string;
};

export const logoMap: Record<ShowcasedTechnologies, TechnologyMap> = {
  React: {
    logo: ReactLogo,
    href: "https://react.dev/",
  },
  "React Three Fiber": {
    logo: ReactThreeFiberLogo,
    href: "https://docs.pmnd.rs/react-three-fiber/getting-started/introduction",
  },
  "Three.js": {
    logo: ThreeJSLogo,
    href: "https://threejs.org/",
  },
  TypeScript: {
    logo: TypeScriptLogo,
    href: "https://www.typescriptlang.org/",
  },
  JavaScript: { logo: JavaScriptLogo, href: "https://www.javascript.com/" },
  "Next.js": {
    logo: NextJSLogo,
    href: "https://nextjs.org/",
  },
  TailwindCSS: {
    logo: TailwindCSSLogo,
    href: "https://tailwindcss.com/",
  },
  CSS: {
    logo: CSSLogo,
    href: "https://developer.mozilla.org/en-US/docs/Web/CSS",
  },
  GSAP: {
    logo: <Image src={GSAPLogo} alt="gsap" />,
    href: "https://greensock.com/gsap/",
  },
  Redux: { logo: ReduxLogo, href: "https://redux.js.org/" },
};
