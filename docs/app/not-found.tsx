import { buttonVariants } from "fumadocs-ui/components/ui/button"
import Link from "next/link"

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="font-mono text-7xl font-bold tracking-tight text-fd-primary">404</p>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-fd-foreground">Page not found</h1>
        <p className="text-fd-muted-foreground">
          That number doesn’t add up. The page may have moved.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className={buttonVariants({ color: "primary", className: "px-5 py-2.5" })}>
          Back home
        </Link>
        <Link
          href="/docs"
          className={buttonVariants({ color: "secondary", className: "px-5 py-2.5" })}
        >
          Read the docs
        </Link>
      </div>
    </main>
  )
}
