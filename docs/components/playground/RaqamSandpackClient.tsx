"use client"

import dynamic from "next/dynamic"

// Sandpack cannot server-render — load it client-only with a skeleton placeholder.
const RaqamSandpack = dynamic(
  () => import("./RaqamSandpack").then((m) => m.RaqamSandpack),
  {
    ssr: false,
    loading: () => (
      <div
        className="my-7 grid min-h-[420px] place-items-center border border-fd-border bg-fd-card text-sm text-fd-muted-foreground"
        aria-busy="true"
      >
        Loading playground…
      </div>
    ),
  },
)

export function RaqamSandpackClient() {
  return <RaqamSandpack />
}
