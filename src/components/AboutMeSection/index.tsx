import Image from "next/image";
import AboutMeText from "./Text";
import getCloudinaryPlaceholder from "~/utils/getCloudinaryPlaceholder";

export default async function AboutMe() {
  const blurredPlaceholder = await getCloudinaryPlaceholder(
    "https://res.cloudinary.com/dunbkcyqq/image/upload/v1692465808/overlook_zindcs.jpg",
  );
  return (
    <section
      id="about-me"
      className="clip-path-[inset(0)] before:image-grain relative flex min-h-screen w-full scroll-mt-14 flex-col items-end overflow-hidden before:z-[-1] sm:items-start md:flex-row"
    >
      <Image
        alt=""
        className="z-[-2] object-cover md:fixed md:inset-0 md:h-dvh md:w-full"
        src="https://res.cloudinary.com/dunbkcyqq/image/upload/v1692465808/overlook_zindcs.jpg"
        width={1440}
        height={1080}
        placeholder="blur"
        blurDataURL={blurredPlaceholder}
      />
      <AboutMeText />
    </section>
  );
}
