"use client"

import { Check, Copy } from "lucide-react"
import { useState } from "react"

export function CopyInstall({ command = "npm install raqam" }: { command?: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(command)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // clipboard unavailable — no-op
    }
  }

  return (
    <div className="inline-flex items-center gap-2 border border-fd-border bg-fd-card py-1.5 pl-3.5 pr-1.5 font-mono text-sm text-fd-foreground">
      <span className="select-none text-fd-primary" aria-hidden>
        $
      </span>
      <code>{command}</code>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Copied" : "Copy install command"}
        className={`grid size-7 place-items-center transition-colors hover:bg-fd-foreground/10 ${
          copied ? "text-fd-primary" : "text-fd-muted-foreground hover:text-fd-foreground"
        }`}
      >
        {copied ? <Check size={15} /> : <Copy size={15} />}
      </button>
    </div>
  )
}
