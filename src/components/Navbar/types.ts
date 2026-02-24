export type NavbarSection = {
  title: string;
  href: string;
  /** Use a plain anchor instead of Next.js Link (for external URLs or file routes) */
  external?: boolean;
};
