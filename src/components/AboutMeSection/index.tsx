import Image from "next/image";
import AboutMeText from "./Text";

export default function AboutMe() {
  return (
    <section
      id="about-me"
      className="clip-path-[inset(0)] before:image-grain relative flex min-h-screen w-full scroll-mt-14 flex-col items-end overflow-hidden before:z-[-1] sm:flex-row sm:items-start"
    >
      <Image
        alt=""
        className="z-[-2] object-cover md:fixed md:inset-0 md:h-[100dvh] md:w-full"
        src="https://res.cloudinary.com/dunbkcyqq/image/upload/v1692465808/overlook_zindcs.jpg"
        width={1440}
        height={1080}
      />
      <AboutMeText />
    </section>
  );
}
