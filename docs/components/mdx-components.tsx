import { Callout } from "fumadocs-ui/components/callout"
import { Card, Cards } from "fumadocs-ui/components/card"
import { Step, Steps } from "fumadocs-ui/components/steps"
import { Tab, Tabs } from "fumadocs-ui/components/tabs"
import defaultMdxComponents from "fumadocs-ui/mdx"
import type { MDXComponents } from "mdx/types"
import { LiveNumberFieldDemo } from "@/components/demos/LiveNumberFieldDemo"
import { RaqamSandpackClient } from "@/components/playground/RaqamSandpackClient"

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    Callout,
    Tabs,
    Tab,
    Cards,
    Card,
    Steps,
    Step,
    // raqam interactive demos — usable in MDX without per-file imports
    LiveNumberFieldDemo,
    RaqamSandpack: RaqamSandpackClient,
    ...components,
  }
}

export const useMDXComponents = getMDXComponents
