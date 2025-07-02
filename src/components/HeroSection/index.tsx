import getCloudinaryPlaceholder from "~/utils/getCloudinaryPlaceholder";
import HeroSectionClient from "./client";

export default async function HeroSection() {
  const blurredPlaceholder = await getCloudinaryPlaceholder(
    "https://res.cloudinary.com/dunbkcyqq/image/upload/ar_1.0,c_fill,q_90/r_max/v1691183194/profile_uzs6ye.jpg",
  );
  return <HeroSectionClient blurredPlaceholder={blurredPlaceholder} />;
}
