import "./global.css"
import type { Metadata } from "next"
import { Geist, JetBrains_Mono, Vazirmatn } from "next/font/google"
import { RootProvider } from "fumadocs-ui/provider/next"
import type { ReactNode } from "react"
import { appDescription, appName, siteUrl } from "@/lib/shared"

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains-mono",
})

// Persian/Arabic glyphs fall back to Vazirmatn (Geist/JetBrains lack them).
const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${appName} — The definitive React number input`,
    template: `%s — ${appName}`,
  },
  description: appDescription,
  openGraph: {
    title: appName,
    description: appDescription,
    url: siteUrl,
    siteName: appName,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: appName,
    description: appDescription,
  },
  icons: {
    icon: [
      { url: "/favicon-light-48.png", media: "(prefers-color-scheme: light)", type: "image/png" },
      { url: "/favicon-dark-48.png", media: "(prefers-color-scheme: dark)", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon-light-180.png", media: "(prefers-color-scheme: light)" },
      { url: "/apple-touch-icon-dark-180.png", media: "(prefers-color-scheme: dark)" },
    ],
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${jetbrainsMono.variable} ${vazirmatn.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  )
}
