import { createFromSource } from "fumadocs-core/search/server"
import { source } from "@/lib/source"

// Server-side Orama search index, built from the loaded MDX source.
export const { GET } = createFromSource(source, {
  language: "english",
})
