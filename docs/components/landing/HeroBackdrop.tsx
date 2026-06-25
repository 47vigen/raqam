// Decorative hero backdrop: a faint, theme-aware lattice of the same value
// formatted across locales, anchored to the right and fading left so the
// headline stays on clean canvas. Pure CSS — crisp at any resolution, and
// Persian/Arabic numerals render in Vazirmatn via the global font stack.
const NUM_ROW = "1,234.00      ۱٬۲۵۰٬۰۰۰      ١٢٣      २२३      ๑๒๓"

export function HeroBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-y-0 right-0 flex flex-col justify-center gap-2.5 whitespace-nowrap pr-6 text-right font-mono text-2xl leading-none tabular-nums text-fd-foreground/[0.055] [mask-image:linear-gradient(to_left,#000_42%,transparent_86%)] lg:pr-10">
        {Array.from({ length: 16 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static decorative rows
          <span key={i}>{NUM_ROW}</span>
        ))}
      </div>
      {/* goose hairline + square marker (desktop only) */}
      <div className="absolute inset-y-0 right-[17%] hidden w-px bg-fd-primary/30 lg:block" />
      <div className="absolute right-[17%] top-1/2 hidden size-2.5 -translate-y-1/2 translate-x-1/2 bg-fd-primary lg:block" />
    </div>
  )
}
