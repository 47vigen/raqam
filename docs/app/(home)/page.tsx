import { Card, Cards } from "fumadocs-ui/components/card"
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock"
import { buttonVariants } from "fumadocs-ui/components/ui/button"
import { ArrowRight, ArrowUpRight, CircleCheck, Languages, Pencil, Puzzle } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { LiveNumberFieldDemo } from "@/components/demos/LiveNumberFieldDemo"
import { CopyInstall } from "@/components/landing/CopyInstall"
import { HeroBackdrop } from "@/components/landing/HeroBackdrop"
import { Showcase } from "@/components/landing/Showcase"
import { githubUrl } from "@/lib/shared"

export const metadata: Metadata = {
  title: "Raqam — The definitive React number input",
}

const FEATURES = [
  {
    icon: <Pencil />,
    title: "Live formatting",
    description:
      "Formats as you type with the same cursor-boundary algorithm as react-number-format — no flicker, cursor stays put.",
  },
  {
    icon: <Languages />,
    title: "Full i18n",
    description:
      "Accepts Persian ۱۲۳, Arabic ١٢٣, Bengali ১২৩, Devanagari १२३, Thai ๑๒๓. Separators derived via Intl.NumberFormat.",
  },
  {
    icon: <Puzzle />,
    title: "Headless",
    description:
      "Zero styles. Bring Tailwind, CSS Modules, or any design system. Compound components or raw hooks — your call.",
  },
  {
    icon: <CircleCheck />,
    title: "Accessible",
    description:
      "WAI-ARIA spinbutton role, aria-valuenow/min/max/valuetext, full keyboard navigation and focus management.",
  },
]

const BUNDLE = [
  { name: "raqam/core", size: "~1.84 KB", w: "16%" },
  { name: "raqam/react", size: "~8.1 KB", w: "68%" },
  { name: "raqam (full)", size: "~8.3 KB", w: "70%" },
  { name: "raqam/locales/fa", size: "189 B", w: "4%" },
]

const EXAMPLE = `import { NumberField } from "raqam";

export function PriceInput() {
  return (
    <NumberField.Root
      locale="en-US"
      formatOptions={{ style: "currency", currency: "USD" }}
      defaultValue={0}
      minValue={0}
    >
      <NumberField.Label>Price</NumberField.Label>
      <NumberField.Group>
        <NumberField.Decrement>−</NumberField.Decrement>
        <NumberField.Input />
        <NumberField.Increment>+</NumberField.Increment>
      </NumberField.Group>
      <NumberField.HiddenInput />
    </NumberField.Root>
  );
}`

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2.5 font-mono text-xs uppercase tracking-[0.2em] text-fd-muted-foreground">
      <span className="size-1.5 rounded-full bg-fd-primary" />
      {children}
    </span>
  )
}

const container = "mx-auto w-full max-w-6xl px-6"
const sectionTitle =
  "font-display text-3xl font-bold tracking-tight text-fd-foreground sm:text-4xl"

export default function HomePage() {
  return (
    <main className="flex flex-col">
      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <HeroBackdrop />
        <div className={`${container} grid items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24`}>
          <div className="flex flex-col items-start gap-6">
          <span className="animate-rise">
            <Eyebrow>Headless · i18n · ~1.8 KB</Eyebrow>
          </span>
          <h1 className="animate-rise font-display text-5xl font-bold leading-[0.98] tracking-[-0.03em] text-fd-foreground sm:text-6xl">
            The number input,
            <br />
            <span className="text-fd-primary">done right.</span>
          </h1>
          <p className="animate-rise max-w-[34ch] text-lg leading-relaxed text-fd-muted-foreground">
            <b className="font-semibold text-fd-foreground">Live formatting</b>,{" "}
            <b className="font-semibold text-fd-foreground">full i18n</b>,{" "}
            <b className="font-semibold text-fd-foreground">headless</b>, and{" "}
            <b className="font-semibold text-fd-foreground">accessible</b> — in a ~1.8 KB
            core. The React number field you stop fighting.
          </p>
          <div className="animate-rise flex flex-wrap items-center gap-3">
            <Link
              href="/docs/getting-started"
              className={buttonVariants({ color: "primary", className: "h-10 gap-2 px-5" })}
            >
              Get started <ArrowRight size={16} />
            </Link>
            <Link
              href="/docs/playground"
              className={buttonVariants({ color: "secondary", className: "h-10 px-5" })}
            >
              Playground
            </Link>
            <a
              href={githubUrl}
              target="_blank"
              rel="noreferrer noopener"
              className={buttonVariants({ color: "ghost", className: "h-10 gap-1.5 px-3 text-fd-muted-foreground" })}
            >
              GitHub <ArrowUpRight size={15} />
            </a>
          </div>
          <div className="animate-rise">
            <CopyInstall />
          </div>
        </div>

          <div className="animate-rise">
            <Showcase variant="hero" />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="border-t border-fd-border py-16 lg:py-20">
        <div className={container}>
          <div className="mb-10 flex max-w-[46ch] flex-col gap-3">
            <Eyebrow>Why raqam</Eyebrow>
            <h2 className={sectionTitle}>Eliminates all four trade-offs.</h2>
            <p className="leading-relaxed text-fd-muted-foreground">
              Every other React number input forces a compromise. raqam refuses to pick.
            </p>
          </div>
          <Cards>
            {FEATURES.map((f) => (
              <Card key={f.title} icon={f.icon} title={f.title} description={f.description} />
            ))}
          </Cards>
        </div>
      </section>

      {/* SHOWCASE BAND */}
      <section className="border-t border-fd-border bg-fd-muted/40 py-16 lg:py-20">
        <div className={container}>
          <div className="mb-10 flex max-w-[46ch] flex-col gap-3">
            <Eyebrow>One component, every surface</Eyebrow>
            <h2 className={sectionTitle}>Currency to scrubbing to Persian.</h2>
            <p className="leading-relaxed text-fd-muted-foreground">
              All headless, all accessible, all live. Type into any field — the caret never
              jumps.
            </p>
          </div>
          <Showcase variant="all" />
        </div>
      </section>

      {/* CODE EXAMPLE */}
      <section className="border-t border-fd-border py-16 lg:py-20">
        <div className={container}>
          <div className="mb-10 flex max-w-[46ch] flex-col gap-3">
            <Eyebrow>Thirty seconds</Eyebrow>
            <h2 className={sectionTitle}>Compose it, ship it.</h2>
          </div>
          <div className="grid items-start gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <DynamicCodeBlock lang="tsx" code={EXAMPLE} />
            <div className="flex flex-col gap-4 border border-fd-border bg-fd-muted/40 p-5">
              <span className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-fd-muted-foreground">
                Result · type 1234
              </span>
              <LiveNumberFieldDemo variant="currency" bare />
            </div>
          </div>
        </div>
      </section>

      {/* BUNDLE SIZE */}
      <section className="border-t border-fd-border bg-fd-muted/40 py-16 lg:py-20">
        <div className={container}>
          <div className="mb-10 flex max-w-[46ch] flex-col gap-3">
            <Eyebrow>Pay for what you import</Eyebrow>
            <h2 className={sectionTitle}>Tiny by construction.</h2>
            <p className="leading-relaxed text-fd-muted-foreground">
              Min + brotli, dependencies included, enforced in CI.
            </p>
          </div>
          <div className="border border-fd-border bg-fd-card">
            {BUNDLE.map((row, i) => (
              <div
                key={row.name}
                className={`grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-3.5 ${
                  i < BUNDLE.length - 1 ? "border-b border-fd-border" : ""
                }`}
              >
                <span className="font-mono text-sm text-fd-foreground">{row.name}</span>
                <span className="flex items-center gap-4">
                  <span className="hidden h-1.5 w-[clamp(80px,22vw,180px)] overflow-hidden bg-fd-foreground/10 sm:block">
                    <span className="block h-full bg-fd-primary" style={{ width: row.w }} />
                  </span>
                  <span className="min-w-[4.5rem] text-right font-mono text-sm tabular-nums text-fd-muted-foreground">
                    {row.size}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CLOSING CTA */}
      <section className="border-t border-fd-border py-20 text-center lg:py-28">
        <div className={`${container} flex flex-col items-center gap-6`}>
          <h2 className={`${sectionTitle} max-w-[18ch]`}>
            Ship correct numbers, every locale.
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/docs/getting-started"
              className={buttonVariants({ color: "primary", className: "h-10 gap-2 px-5" })}
            >
              Get started <ArrowRight size={16} />
            </Link>
            <Link
              href="/docs/playground"
              className={buttonVariants({ color: "secondary", className: "h-10 px-5" })}
            >
              Open the playground
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
