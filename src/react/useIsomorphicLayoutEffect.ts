"use client";

import { useEffect, useLayoutEffect } from "react";

/**
 * `useLayoutEffect` in the browser, `useEffect` on the server — avoids React's
 * "useLayoutEffect does nothing on the server" warning for SSR consumers while
 * keeping synchronous cursor restoration on the client.
 */
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
