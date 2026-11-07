import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDeepLinkHighlight } from "../useDeepLinkHighlight";

// Mock next/navigation
const mockGet = vi.fn();
vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: mockGet,
  }),
}));

describe("useDeepLinkHighlight", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockGet.mockReset();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("does nothing when ready is false", () => {
    mockGet.mockReturnValue("123");
    const div = document.createElement("div");
    div.id = "trip-123";
    div.scrollIntoView = vi.fn();
    document.body.appendChild(div);

    renderHook(() => useDeepLinkHighlight("trip", false));

    vi.advanceTimersByTime(200);
    expect(div.scrollIntoView).not.toHaveBeenCalled();
    expect(div.classList.contains("ring-2")).toBe(false);
  });

  it("scrolls into view and highlights target element when id parameter matches", () => {
    mockGet.mockImplementation((key) => (key === "id" ? "trip-abc" : null));
    const div = document.createElement("div");
    div.id = "trip-trip-abc";
    div.scrollIntoView = vi.fn();
    document.body.appendChild(div);

    renderHook(() => useDeepLinkHighlight("trip", true));

    vi.advanceTimersByTime(200);
    expect(div.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "center",
    });
    expect(div.classList.contains("ring-2")).toBe(true);
    expect(div.classList.contains("ring-blue-500")).toBe(true);

    // After 3500ms highlight is removed
    vi.advanceTimersByTime(3600);
    expect(div.classList.contains("ring-2")).toBe(false);
  });

  it("supports extraParam like tripId or expenseId", () => {
    mockGet.mockImplementation((key) =>
      key === "expenseId" ? "exp-999" : null
    );
    const div = document.createElement("div");
    div.id = "expense-exp-999";
    div.scrollIntoView = vi.fn();
    document.body.appendChild(div);

    renderHook(() => useDeepLinkHighlight("expense", true, "expenseId"));

    vi.advanceTimersByTime(200);
    expect(div.scrollIntoView).toHaveBeenCalled();
    expect(div.classList.contains("ring-2")).toBe(true);
  });

  it("selects visible element when responsive mobile and desktop versions share the same id", () => {
    mockGet.mockImplementation((key) => (key === "id" ? "row-1" : null));

    // Hidden desktop element
    const hiddenEl = document.createElement("div");
    hiddenEl.id = "trip-row-1";
    hiddenEl.style.display = "none";
    hiddenEl.scrollIntoView = vi.fn();
    document.body.appendChild(hiddenEl);

    // Visible mobile element
    const visibleEl = document.createElement("div");
    visibleEl.id = "trip-row-1";
    visibleEl.style.display = "block";
    visibleEl.scrollIntoView = vi.fn();
    document.body.appendChild(visibleEl);

    renderHook(() => useDeepLinkHighlight("trip", true));

    vi.advanceTimersByTime(200);
    expect(visibleEl.scrollIntoView).toHaveBeenCalled();
    expect(visibleEl.classList.contains("ring-2")).toBe(true);
    expect(hiddenEl.scrollIntoView).not.toHaveBeenCalled();
  });
});
