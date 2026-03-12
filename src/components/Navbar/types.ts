export type NavLink = {
  title: string;
  href: string;
  /** Use a plain anchor instead of Next.js Link (for external URLs or file routes) */
  external?: boolean;
  /** Monospace glyph shown as an icon badge in dropdown items */
  icon?: string;
  /** One-line subtitle shown below the title in dropdown items */
  description?: string;
};

export type NavDropdown = {
  title: string;
  /** If provided, the title itself is a navigable link */
  href?: string;
  children: NavLink[];
};

export type NavItem = NavLink | NavDropdown;

export function isDropdown(item: NavItem): item is NavDropdown {
  return "children" in item;
}
