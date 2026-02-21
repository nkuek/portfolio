import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/be-mine/",
    },
    sitemap: "https://www.nkuek.dev/sitemap.xml",
  };
}
