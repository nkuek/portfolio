import Link from "next/link";
import Logo from "../Logo";
import DesktopNavbar from "./DesktopNavbar";
import MobileNavbar from "./MobileNavbar";

export default function Navbar() {
  return (
    <nav className="body fixed top-0 z-2 flex w-full items-center justify-between [&_a]:outline-offset-[5px]">
      <div className="px-6 py-4">
        <Link
          href="/"
          aria-label="Go to the top of the page"
          className="group"
        >
          <Logo className="h-auto w-11 transition-transform duration-200 ease-out group-active:scale-97" />
        </Link>
      </div>
      <MobileNavbar />
      <DesktopNavbar />
    </nav>
  );
}
