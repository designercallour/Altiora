"use client";

import * as React from "react";

/**
 * Returns true after the first client render. Used to avoid hydration
 * mismatches when reading client-only state (e.g. the resolved theme from
 * next-themes) — render a neutral value until mounted.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-time mount flag
    setMounted(true);
  }, []);
  return mounted;
}
