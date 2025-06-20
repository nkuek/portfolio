import Link from "next/link";
import Logo from "../Logo";
import DesktopNavbar from "./DesktopNavbar";
import MobileNavbar from "./MobileNavbar";

export default function Navbar() {
  return (
    <>
      <nav className="fixed top-0 z-[2] flex w-full items-center justify-between backdrop-blur-xs [&_a]:outline-offset-[5px]">
        <div className="px-6 py-4">
          <Link href="/" aria-label="Home">
            <Logo className="h-auto w-11" />
          </Link>
        </div>
        <MobileNavbar />
        <DesktopNavbar />
      </nav>
    </>
  );
}
