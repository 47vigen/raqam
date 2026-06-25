import type { MetadataRoute } from "next"
import { siteUrl } from "@/lib/shared"
import { source } from "@/lib/source"

export const dynamic = "force-static"

export default function sitemap(): MetadataRoute.Sitemap {
  const docs = source.getPages().map((page) => ({
    url: new URL(page.url, siteUrl).toString(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }))

  return [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    ...docs,
  ]
}
