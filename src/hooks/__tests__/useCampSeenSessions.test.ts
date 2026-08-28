import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useCampSeenSessions } from "../useCampSeenSessions";

describe("useCampSeenSessions", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("marks sessions of the initial selected date as seen", () => {
    const sessions = [
      { id: "s1", date: "2026-08-28" },
      { id: "s2", date: "2026-08-29" },
    ];

    const { result } = renderHook(() =>
      useCampSeenSessions("camp-1", "2026-08-28", sessions)
    );

    expect(result.current.seenSessionIds.has("s1")).toBe(true);
    expect(result.current.hasNewSessionsOnDate("2026-08-28")).toBe(false);
    expect(result.current.hasNewSessionsOnDate("2026-08-29")).toBe(true);
  });

  it("marks next date sessions as seen when switching selectedDateStr", () => {
    const sessions = [
      { id: "s1", date: "2026-08-28" },
      { id: "s2", date: "2026-08-29" },
    ];

    let selectedDate = "2026-08-28";
    const { result, rerender } = renderHook(() =>
      useCampSeenSessions("camp-1", selectedDate, sessions)
    );

    expect(result.current.hasNewSessionsOnDate("2026-08-29")).toBe(true);

    act(() => {
      selectedDate = "2026-08-29";
      rerender();
    });

    expect(result.current.hasNewSessionsOnDate("2026-08-29")).toBe(false);
    expect(result.current.seenSessionIds.has("s2")).toBe(true);
  });

  it("detects newly added sessions in previously seen dates", () => {
    const initialSessions = [{ id: "s1", date: "2026-08-28" }];

    const { result, rerender } = renderHook(
      ({ date, sessions }) => useCampSeenSessions("camp-1", date, sessions),
      {
        initialProps: {
          date: "2026-08-28",
          sessions: initialSessions,
        },
      }
    );

    expect(result.current.hasNewSessionsOnDate("2026-08-28")).toBe(false);

    // Switch away to day 2
    rerender({
      date: "2026-08-29",
      sessions: initialSessions,
    });

    // Now a new session is added by the coach to 2026-08-28
    rerender({
      date: "2026-08-29",
      sessions: [
        { id: "s1", date: "2026-08-28" },
        { id: "s3-new", date: "2026-08-28" },
      ],
    });

    // 2026-08-28 should now indicate that it has a new session
    expect(result.current.hasNewSessionsOnDate("2026-08-28")).toBe(true);
  });
});
