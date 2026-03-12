import DSLink from "~/design-system/DSLink";
import DSAnchor from "~/design-system/DSLink/DSAnchor";
import { navItems } from "./constants";
import { isDropdown } from "./types";
import styles from "./styles.module.css";
import ThemeToggle from "./ThemeToggle";
import NavDropdown from "./NavDropdown";

export default function DesktopNavbar() {
  return (
    <ul className="hidden flex-1 items-center justify-end gap-5 text-sm md:flex">
      {navItems.map((item) => (
        <li key={item.title} className="flex">
          {isDropdown(item) ? (
            <NavDropdown item={item} />
          ) : (
            <span className={styles.navLink}>
              {item.external ? (
                <DSAnchor href={item.href}>{item.title}</DSAnchor>
              ) : (
                <DSLink href={item.href}>{item.title}</DSLink>
              )}
            </span>
          )}
        </li>
      ))}
      <li className="flex">
        <ThemeToggle compact />
      </li>
    </ul>
  );
}
