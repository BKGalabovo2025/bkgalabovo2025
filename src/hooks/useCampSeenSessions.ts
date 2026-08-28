"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_PREFIX = "bkg_camp_seen_sessions_";

export interface SessionDateItem {
  id: string;
  date: string;
}

/**
 * Hook to track which camp sessions have been viewed on this specific device.
 * Stores seen session IDs in localStorage keyed by campId.
 * Automatically marks sessions of the currently active day as seen.
 */
export function useCampSeenSessions(
  campId: string,
  selectedDateStr: string,
  sessions: SessionDateItem[]
) {
  const storageKey = `${STORAGE_PREFIX}${campId}`;

  const [seenSessionIds, setSeenSessionIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return new Set(parsed);
        }
      }
    } catch {
      // Ignore storage errors
    }
    return new Set();
  });

  // Mark all sessions for the currently selected date as seen on this device
  useEffect(() => {
    if (!campId || typeof window === "undefined") return;

    const currentDaySessionIds = sessions
      .filter((s) => s.date === selectedDateStr)
      .map((s) => s.id);

    if (currentDaySessionIds.length === 0) return;

    setSeenSessionIds((prev) => {
      let hasNew = false;
      const next = new Set(prev);
      for (const id of currentDaySessionIds) {
        if (!next.has(id)) {
          next.add(id);
          hasNew = true;
        }
      }
      if (hasNew) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(Array.from(next)));
        } catch {
          // Ignore storage errors
        }
        return next;
      }
      return prev;
    });
  }, [campId, selectedDateStr, sessions, storageKey]);

  // Determine if a specific day has any unread/newly added sessions on this device
  const hasNewSessionsOnDate = useCallback(
    (dateStr: string) => {
      const dateSessions = sessions.filter((s) => s.date === dateStr);
      if (dateSessions.length === 0) return false;
      return dateSessions.some((s) => !seenSessionIds.has(s.id));
    },
    [sessions, seenSessionIds]
  );

  return {
    seenSessionIds,
    hasNewSessionsOnDate,
  };
}
