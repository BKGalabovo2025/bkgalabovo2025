import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { OfflineStatusIndicator } from "../components/shared/OfflineStatusIndicator";

describe("PWA: Offline Resilience & Status Indicator", () => {
  const originalOnLine = navigator.onLine;

  const setNavigatorOnline = (status: boolean) => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: status,
    });
  };

  beforeEach(() => {
    setNavigatorOnline(true);
  });

  afterEach(() => {
    setNavigatorOnline(originalOnLine);
  });

  it("should not render banner when network is online", () => {
    render(<OfflineStatusIndicator />);
    const offlineMessage = screen.queryByText(/Работите в офлайн режим/i);
    expect(offlineMessage).toBeNull();
  });

  it("should render offline banner when window offline event fires", () => {
    render(<OfflineStatusIndicator />);

    act(() => {
      setNavigatorOnline(false);
      window.dispatchEvent(new Event("offline"));
    });

    const offlineMessage = screen.getByText(/Работите в офлайн режим/i);
    expect(offlineMessage).toBeInTheDocument();
  });

  it("should hide offline banner when window online event fires", () => {
    render(<OfflineStatusIndicator />);

    // Go offline
    act(() => {
      setNavigatorOnline(false);
      window.dispatchEvent(new Event("offline"));
    });
    expect(screen.getByText(/Работите в офлайн режим/i)).toBeInTheDocument();

    // Recover online
    act(() => {
      setNavigatorOnline(true);
      window.dispatchEvent(new Event("online"));
    });

    expect(screen.queryByText(/Работите в офлайн режим/i)).toBeNull();
  });
});
