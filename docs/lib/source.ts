import { docs } from "@/.source/server";
import { loader } from "fumadocs-core/source";

// See https://fumadocs.dev/docs/headless/source-api
export const source = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
})

/** URL of the raw-markdown route for a page (used by the page actions). */
export function getMarkdownUrl(slugs: string[] = []) {
  return slugs.length > 0 ? `/api/md/${slugs.join("/")}` : "/api/md"
};
