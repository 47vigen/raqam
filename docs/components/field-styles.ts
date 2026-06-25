/**
 * Shared Tailwind class strings for raqam demo fields (sharp, hairline,
 * Fumadocs tokens, mono tabular numerals). Pure utilities — no CSS file.
 */
export const fieldLabel = "text-sm font-semibold text-fd-foreground"

export const fieldDesc = "text-xs leading-relaxed text-fd-muted-foreground"

export const fieldGroup =
  "flex items-stretch border border-fd-border bg-fd-background transition-colors focus-within:border-fd-primary focus-within:ring-2 focus-within:ring-fd-ring/30"

export const fieldInput =
  "min-w-0 flex-1 bg-transparent px-3 py-2 font-mono text-[0.95rem] tabular-nums text-fd-foreground outline-none"

export const fieldButton =
  "flex w-10 shrink-0 items-center justify-center self-stretch bg-fd-foreground/[0.04] text-lg leading-none text-fd-foreground transition-colors hover:bg-fd-primary/15 hover:text-fd-primary"
