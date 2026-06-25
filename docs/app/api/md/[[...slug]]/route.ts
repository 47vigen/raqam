import { notFound } from "next/navigation"
import { source } from "@/lib/source"

export const dynamic = "force-static"

export function generateStaticParams() {
  return source.generateParams()
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug?: string[] }> },
) {
  const { slug } = await params
  const page = source.getPage(slug)
  if (!page) notFound()

  const md = (page.data as { _markdown?: string })._markdown ?? ""
  const body = `# ${page.data.title}\n\n${page.data.description ?? ""}\n\n${md}`.trim()

  return new Response(body, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  })
}
