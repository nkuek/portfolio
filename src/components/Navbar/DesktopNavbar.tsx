import DSLink from "~/design-system/DSLink";
import DSAnchor from "~/design-system/DSLink/DSAnchor";
import { sections } from "./constants";
import ThemeToggle from "./ThemeToggle";

export default function DesktopNavbar() {
  return (
    <ul className="hidden flex-1 items-center justify-end gap-5 text-sm md:flex">
      {sections.map((section) => (
        <li key={section.title} className="flex">
          {section.external ? (
            <DSAnchor href={section.href}>{section.title}</DSAnchor>
          ) : (
            <DSLink href={section.href}>{section.title}</DSLink>
          )}
        </li>
      ))}
      <li className="flex">
        <ThemeToggle compact />
      </li>
    </ul>
  );
}
