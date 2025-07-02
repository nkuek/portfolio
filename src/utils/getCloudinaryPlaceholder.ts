import { getCldImageUrl } from "next-cloudinary";

export default async function getCloudinaryPlaceholder(src: string) {
  const imageUrl = getCldImageUrl({
    src,
    width: 100, // Resize the original file to a smaller size
  });
  const response = await fetch(imageUrl);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString("base64");
  const dataUrl = `data:${response.type};base64,${base64}`;
  return dataUrl;
}
