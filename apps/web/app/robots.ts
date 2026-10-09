import type { MetadataRoute } from "next";

/** Do not index controlled pre-production builds or private marketplace routes. */
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", disallow: "/" }] };
}
