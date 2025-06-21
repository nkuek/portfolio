"use client";
import { useEffect, useState } from "react";
import RoleTyper from "../RoleTyper";
import Image from "next/image";
import Link from "next/link";

export default function HeroSection() {
  const [hasScrolled, setHasScrolled] = useState(false);
  const [hideChevron, setHideChevron] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0 && !hasScrolled) {
        setHasScrolled(true);
      } else if (hasScrolled && window.scrollY === 0) {
        setHasScrolled(false);
        setHideChevron(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [hasScrolled, hideChevron]);

  return (
    <section className="relative mt-[76px] flex min-h-[calc(100dvh-76px)] w-full flex-col items-center justify-center px-4">
      <div className="flex w-full flex-col items-center justify-center gap-10 md:flex-row">
        <RoleTyper />

        <Image
          src="https://res.cloudinary.com/dunbkcyqq/image/upload/ar_1.0,c_fill,q_90/r_max/v1691183194/profile_uzs6ye.jpg"
          className="aspect-square h-[288px] items-center rounded-full object-cover"
          width={288}
          height={288}
          alt="Picture of me sitting on a wall with a sunset behind me."
          loading="eager"
          fetchPriority="high"
        />
      </div>
      <Link
        href="#about-me"
        style={{
          opacity: hasScrolled ? 0 : 1,
          visibility: hideChevron ? "hidden" : "visible",
        }}
        onTransitionEnd={() => {
          if (hasScrolled) {
            setHideChevron(true);
          }
        }}
        className="hover:text-link-hover absolute bottom-5 text-inherit transition-opacity duration-500 ease-in-out"
        aria-label="go to next section"
      >
        <svg
          className="stroke-text aspect-square w-6 animate-[bounce_1000ms_linear_infinite] md:w-10"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          // class="lucide lucide-chevron-down"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </Link>
    </section>
  );
}
