import path from "node:path";
import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // Pin the monorepo root explicitly (docs is a workspace member at <repo>/docs).
  turbopack: {
    root: path.join(import.meta.dirname, ".."),
  },
};

export default withMDX(config);
