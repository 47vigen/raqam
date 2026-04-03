"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { NumberFieldState, ScrubAreaOptions } from "../core/types.js";

export interface ScrubAreaReturn {
  /** Whether pointer lock is currently active */
  isScrubbing: boolean;
  /** Props to spread on the scrub area element */
  scrubAreaProps: {
    role: string;
    tabIndex: number;
    style: React.CSSProperties;
    "aria-label": string;
    "data-scrubbing": string | undefined;
    onPointerDown: (e: React.PointerEvent) => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
  };
  /**
   * Virtual cursor position (screen coordinates, updated by mousemove
   * during pointer lock). Use for positioning the ScrubAreaCursor.
   */
  virtualCursor: { x: number; y: number };
}

/**
 * Implements Pointer Lock API–based drag-to-scrub behavior.
 *
 * Flow:
 *  1. User presses pointer down → element requests pointer lock
 *  2. Browser hides cursor, starts delivering movementX/Y on mousemove
 *  3. Accumulated movement ÷ pixelSensitivity → increment/decrement calls
 *  4. Pointer lock exits on Escape key or programmatic exit
 */
export function useScrubArea(
  state: NumberFieldState,
  options: ScrubAreaOptions = {}
): ScrubAreaReturn {
  const { direction = "horizontal", pixelSensitivity = 4 } = options;

  const [isScrubbing, setIsScrubbingLocal] = useState(false);

  // Keep stable refs to avoid stale closures in event listeners
  const stateRef = useRef(state);
  stateRef.current = state;

  const directionRef = useRef(direction);
  directionRef.current = direction;

  const sensitivityRef = useRef(pixelSensitivity);
  sensitivityRef.current = pixelSensitivity;

  const isScrubbingRef = useRef(false);
  const accumulatorRef = useRef(0);
  const elementRef = useRef<Element | null>(null);
  const virtualCursorRef = useRef({ x: 0, y: 0 });
  const [virtualCursor, setVirtualCursor] = useState({ x: 0, y: 0 });

  // Stable mousemove handler (always reads latest state via refs)
  const stableMouseMove = useRef((e: MouseEvent) => {
    if (!isScrubbingRef.current) return;

    // Update virtual cursor
    const nx = virtualCursorRef.current.x + e.movementX;
    const ny = virtualCursorRef.current.y + e.movementY;
    virtualCursorRef.current = { x: nx, y: ny };
    setVirtualCursor({ x: nx, y: ny });

    // Determine delta based on direction
    const dir = directionRef.current;
    let delta = 0;
    if (dir === "horizontal") {
      delta = e.movementX;
    } else if (dir === "vertical") {
      delta = -e.movementY;
    } else {
      delta = Math.abs(e.movementX) >= Math.abs(e.movementY) ? e.movementX : -e.movementY;
    }

    accumulatorRef.current += delta;

    // Fire step when accumulated movement exceeds sensitivity
    const sensitivity = sensitivityRef.current;
    while (accumulatorRef.current >= sensitivity) {
      stateRef.current.increment();
      accumulatorRef.current -= sensitivity;
    }
    while (accumulatorRef.current <= -sensitivity) {
      stateRef.current.decrement();
      accumulatorRef.current += sensitivity;
    }
  });

  // Stable pointer lock change handler
  const stablePointerLockChange = useRef(() => {
    if (document.pointerLockElement === elementRef.current) {
      // Lock acquired — start scrubbing
      isScrubbingRef.current = true;
      accumulatorRef.current = 0;
      setIsScrubbingLocal(true);
      stateRef.current.setIsScrubbing(true);
      document.addEventListener("mousemove", stableMouseMove.current);
    } else {
      // Lock released — stop scrubbing
      isScrubbingRef.current = false;
      accumulatorRef.current = 0;
      document.removeEventListener("mousemove", stableMouseMove.current);
      setIsScrubbingLocal(false);
      stateRef.current.setIsScrubbing(false);
    }
  });

  // Register stable pointerlockchange listener once on mount
  useEffect(() => {
    const handler = stablePointerLockChange.current;
    document.addEventListener("pointerlockchange", handler);
    return () => {
      document.removeEventListener("pointerlockchange", handler);
      document.removeEventListener("mousemove", stableMouseMove.current);
    };
  }, []); // Empty deps — truly stable refs, no need to re-register

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (stateRef.current.options.disabled || stateRef.current.options.readOnly) return;
      if (e.button !== 0) return;

      const el = e.currentTarget as HTMLElement;
      elementRef.current = el;
      virtualCursorRef.current = { x: e.clientX, y: e.clientY };
      setVirtualCursor({ x: e.clientX, y: e.clientY });

      el.requestPointerLock();
    },
    [] // No deps — reads via refs
  );

  // Keyboard support: arrow keys while scrub area is focused
  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (stateRef.current.options.disabled || stateRef.current.options.readOnly) return;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      stateRef.current.increment();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      stateRef.current.decrement();
    }
  }, []);

  // Cursor CSS based on direction
  const cursorStyle =
    direction === "horizontal" ? "ew-resize" : direction === "vertical" ? "ns-resize" : "move";

  const scrubAreaProps = {
    role: "slider",
    tabIndex: state.options.disabled ? -1 : 0,
    style: {
      cursor: state.options.disabled ? undefined : cursorStyle,
      userSelect: "none" as const,
      WebkitUserSelect: "none" as const,
    } satisfies React.CSSProperties,
    "aria-label": "Scrub to change value",
    "data-scrubbing": isScrubbing ? "" : undefined,
    onPointerDown,
    onKeyDown,
  };

  return { isScrubbing, scrubAreaProps, virtualCursor };
}
