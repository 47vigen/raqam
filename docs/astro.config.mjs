import { defineConfig } from "astro/config"
import react from "@astrojs/react"
import starlight from "@astrojs/starlight"

export default defineConfig({
  site: "https://47vigen.github.io",
  base: "/raqam",
  integrations: [
    react(),
    starlight({
      components: {
        Hero: "./src/components/Hero.astro"
      },
      title: "🔢 Raqam",
      description:
        "The definitive React number input: live formatting, full i18n, headless, accessible",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/47vigen/raqam"
        }
      ],
      sidebar: [
        {
          label: "Getting Started",
          link: "/getting-started"
        },
        {
          label: "Playground",
          link: "/playground"
        },
        {
          label: "API Reference",
          items: [
            {
              label: "useNumberFieldState",
              link: "/api/use-number-field-state"
            },
            { label: "useNumberField", link: "/api/use-number-field" },
            { label: "NumberField Components", link: "/api/components" },
            {
              label: "useNumberFieldFormat",
              link: "/api/use-number-field-format"
            },
            { label: "Format Presets", link: "/api/presets" },
            { label: "Core Utilities", link: "/api/core-utilities" },
            { label: "Advanced Primitives", link: "/api/advanced-primitives" }
          ]
        },
        {
          label: "Guides",
          items: [
            { label: "Formatting & Behavior", link: "/guides/formatting" },
            { label: "Locales & i18n", link: "/guides/locales" },
            { label: "RTL Support", link: "/guides/rtl" },
            { label: "Next.js App Router", link: "/guides/nextjs" },
            { label: "Accessibility", link: "/guides/accessibility" }
          ]
        },
        {
          label: "Recipes",
          items: [
            { label: "react-hook-form", link: "/recipes/react-hook-form" },
            { label: "Formik", link: "/recipes/formik" },
            { label: "Tailwind CSS", link: "/recipes/tailwind" },
            { label: "shadcn/ui", link: "/recipes/shadcn-ui" },
            { label: "Financial App", link: "/recipes/financial" },
            { label: "Persian E-commerce", link: "/recipes/persian-ecommerce" }
          ]
        }
      ],
      head: [],
      customCss: [
        "./src/styles/docs-layout.css",
        "./src/styles/raqam-demos.css",
        "./src/styles/hero-showcase.css"
      ]
    })
  ]
})
