"use client";

import { useCallback, useEffect, useRef } from "react";

export interface UsePressAndHoldOptions {
  /** Milliseconds before repeating starts (default: 400) */
  delay?: number;
  /** Initial milliseconds between repeats — halves each tick, floors at 50 (default: 200) */
  interval?: number;
  /** Whether the element is disabled */
  disabled?: boolean;
}

export interface PressAndHoldProps {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerLeave: (e: React.PointerEvent) => void;
}

/**
 * Returns pointer event handlers that call `callback` immediately on press,
 * then repeatedly with accelerating frequency while held down.
 *
 * Acceleration schedule (default settings):
 *   immediate → 400ms wait → 200ms → 100ms → 50ms (floor, stays until release)
 *
 * All timing is handled via refs — zero state updates, zero re-renders.
 */
export function usePressAndHold(
  callback: () => void,
  options: UsePressAndHoldOptions = {}
): PressAndHoldProps {
  const { delay = 400, interval = 200, disabled = false } = options;

  // Stable refs so handlers don't re-create on every render
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  });

  const delayRef = useRef(delay);
  useEffect(() => {
    delayRef.current = delay;
  });

  const intervalRef = useRef(interval);
  useEffect(() => {
    intervalRef.current = interval;
  });

  // Timer handle refs (null = no active timer)
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const repeatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHeldRef = useRef(false);

  const clearTimers = useCallback(() => {
    isHeldRef.current = false;
    if (delayTimerRef.current !== null) {
      clearTimeout(delayTimerRef.current);
      delayTimerRef.current = null;
    }
    if (repeatTimerRef.current !== null) {
      clearTimeout(repeatTimerRef.current);
      repeatTimerRef.current = null;
    }
  }, []);

  // Recursive accelerating repeat
  const scheduleRepeat = useCallback((currentInterval: number) => {
    if (!isHeldRef.current) return;
    callbackRef.current();
    const nextInterval = Math.max(50, Math.floor(currentInterval / 2));
    repeatTimerRef.current = setTimeout(() => {
      scheduleRepeat(nextInterval);
    }, currentInterval);
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;
      // Only primary button (left mouse / single touch / pen)
      if (e.button !== 0 && e.pointerType === "mouse") return;

      // Fire immediately
      callbackRef.current();
      isHeldRef.current = true;

      // After initial delay, start accelerating repeats
      delayTimerRef.current = setTimeout(() => {
        scheduleRepeat(intervalRef.current);
      }, delayRef.current);
    },
    [disabled, scheduleRepeat]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      clearTimers();
    },
    [clearTimers]
  );

  const onPointerLeave = useCallback(
    (e: React.PointerEvent) => {
      void e;
      clearTimers();
    },
    [clearTimers]
  );

  // Safety: clear on unmount
  useEffect(() => clearTimers, [clearTimers]);

  return { onPointerDown, onPointerUp, onPointerLeave };
}
