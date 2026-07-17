"use client";

import * as React from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * Debounced autosave. Watches a serializable value; when its content changes
 * (after the first render), schedules `save` after `delay` ms. Tracks status +
 * last-saved time for an "unsaved / saving / saved" indicator.
 *
 * Refs are updated in effects (never during render), and state updates happen
 * inside the debounced callback — avoiding cascading renders.
 */
export function useAutosave<T>(
  value: T,
  save: (value: T) => Promise<void>,
  { delay = 1200, enabled = true }: { delay?: number; enabled?: boolean } = {},
) {
  const [status, setStatus] = React.useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = React.useState<Date | null>(null);

  const saveRef = React.useRef(save);
  const valueRef = React.useRef(value);
  const isFirst = React.useRef(true);

  React.useEffect(() => {
    saveRef.current = save;
    valueRef.current = value;
  });

  const serialized = React.useMemo(() => JSON.stringify(value), [value]);

  React.useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    if (!enabled) return;

    const timer = setTimeout(async () => {
      setStatus("saving");
      try {
        await saveRef.current(valueRef.current);
        setStatus("saved");
        setLastSavedAt(new Date());
      } catch {
        setStatus("error");
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [serialized, delay, enabled]);

  return { status, lastSavedAt };
}
