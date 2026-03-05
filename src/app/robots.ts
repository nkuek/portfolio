import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/be-mine", "/be-mine/"],
    },
    sitemap: "https://nkuek.dev/sitemap.xml",
  };
}
