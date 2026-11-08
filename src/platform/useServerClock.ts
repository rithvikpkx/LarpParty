"use client";

import { useCallback, useEffect, useRef } from "react";
import { getServerTime } from "./actions";

/**
 * Returns a function giving the current *server* time. Phone clocks drift by
 * seconds; deadlines are stamped by the server, so countdowns must use its clock.
 * Offset = serverTime - midpoint of the request round trip.
 */
export function useServerClock(): () => number {
  const offset = useRef(0);
  useEffect(() => {
    let cancelled = false;
    const t0 = Date.now();
    getServerTime().then((server) => {
      if (cancelled) return;
      const t1 = Date.now();
      offset.current = server - (t0 + t1) / 2;
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return useCallback(() => Date.now() + offset.current, []);
}
