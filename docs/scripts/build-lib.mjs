// Build the raqam library (tsup) before `next build`.
//
// We invoke the tsup binary directly from the repo root rather than
// `pnpm --filter raqam build`: pnpm propagates `--filter` to child processes
// via `npm_config_filter`, so a nested filtered call intersects with the outer
// filter and matches nothing on Vercel ("No projects matched the filters").
// Running the binary sidesteps pnpm's filter machinery entirely.
import { execFileSync } from "node:child_process"
import path from "node:path"

const repoRoot = path.resolve(import.meta.dirname, "..", "..")
const tsupBin = path.join(repoRoot, "node_modules", ".bin", "tsup")

console.log("→ building raqam (tsup) before next build")
execFileSync(tsupBin, { cwd: repoRoot, stdio: "inherit" })
