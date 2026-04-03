import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  integrations: [
    starlight({
      title: "numra",
      description:
        "The definitive React number input: live formatting, full i18n, headless, accessible",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/47vigen/numra",
        },
      ],
      sidebar: [
        {
          label: "Getting Started",
          link: "/getting-started",
        },
        {
          label: "API Reference",
          items: [
            { label: "useNumberFieldState", link: "/api/use-number-field-state" },
            { label: "useNumberField", link: "/api/use-number-field" },
            { label: "NumberField Components", link: "/api/components" },
            { label: "useNumberFieldFormat", link: "/api/use-number-field-format" },
            { label: "Format Presets", link: "/api/presets" },
          ],
        },
        {
          label: "Guides",
          items: [
            { label: "Locales & i18n", link: "/guides/locales" },
            { label: "RTL Support", link: "/guides/rtl" },
            { label: "Next.js App Router", link: "/guides/nextjs" },
            { label: "Accessibility", link: "/guides/accessibility" },
          ],
        },
        {
          label: "Recipes",
          items: [
            { label: "react-hook-form", link: "/recipes/react-hook-form" },
            { label: "Formik", link: "/recipes/formik" },
            { label: "Tailwind CSS", link: "/recipes/tailwind" },
            { label: "shadcn/ui", link: "/recipes/shadcn-ui" },
            { label: "Financial App", link: "/recipes/financial" },
            { label: "Persian E-commerce", link: "/recipes/persian-ecommerce" },
          ],
        },
      ],
      customCss: ["./src/styles/custom.css"],
    }),
  ],
});
