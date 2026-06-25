// Generates every logo/icon asset from the two source goose marks.
// Sources (commit these):
//   docs/assets/logo-light.png  — dark goose on paper tile (for light UI)
//   docs/assets/logo-dark.png   — white goose on black tile (for dark UI)
// Run: pnpm --filter raqam-docs logos
import { mkdir } from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"

const ROOT = path.join(import.meta.dirname, "..")
const SRC = {
  light: path.join(ROOT, "assets/logo-light.png"),
  dark: path.join(ROOT, "assets/logo-dark.png"),
}
const OUT = path.join(ROOT, "public")

// Brand tile backgrounds, used to pad the PWA maskable safe-zone.
const BG = { light: "#FBFAF8", dark: "#000000" }

const FAVICON = [16, 32, 48]
const APPLE = [180, 167, 152, 120]
const ANDROID = [192, 512]
const NAV = 64

async function square(src, size) {
  return sharp(src).resize(size, size, { fit: "cover" }).png()
}

async function maskable(src, size, bg) {
  const inner = Math.round(size * 0.78) // ~80% safe-zone for Android maskable
  const fg = await sharp(src).resize(inner, inner, { fit: "cover" }).png().toBuffer()
  return sharp({
    create: { width: size, height: size, channels: 4, background: bg },
  })
    .composite([{ input: fg, gravity: "center" }])
    .png()
}

async function run() {
  await mkdir(OUT, { recursive: true })
  const written = []
  const save = async (img, name) => {
    await img.toFile(path.join(OUT, name))
    written.push(name)
  }

  for (const theme of ["light", "dark"]) {
    const src = SRC[theme]
    for (const s of FAVICON) await save(await square(src, s), `favicon-${theme}-${s}.png`)
    for (const s of APPLE) await save(await square(src, s), `apple-touch-icon-${theme}-${s}.png`)
    for (const s of ANDROID) await save(await square(src, s), `icon-${theme}-${s}.png`)
    await save(await maskable(src, 512, BG[theme]), `maskable-${theme}-512.png`)
    await save(await square(src, NAV), `logo-${theme}.png`)
  }

  console.log(`Generated ${written.length} assets → docs/public/`)
  for (const f of written) console.log(`  • ${f}`)
}

run().catch((err) => {
  console.error("Logo generation failed:", err.message)
  process.exit(1)
})
