import DSLink from "~/design-system/DSLink";
import { sections } from "./constants";
import ThemeToggle from "./ThemeToggle";

export default function DesktopNavbar() {
  return (
    <ul className="hidden justify-end gap-6 px-6 py-4 text-lg sm:flex">
      {sections.map((section) => (
        <li key={section.title} className="flex">
          <DSLink href={section.href} className="h-full">
            {section.title}
          </DSLink>
        </li>
      ))}
      <li>
        <ThemeToggle />
      </li>
    </ul>
  );
}
