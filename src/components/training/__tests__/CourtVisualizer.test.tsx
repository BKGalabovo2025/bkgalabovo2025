import { render } from "@testing-library/react";
import * as React from "react";
import { describe, expect, it } from "vitest";

import { CourtVisualizer } from "../CourtVisualizer";

describe("CourtVisualizer Component", () => {
  it("renders correctly with no active zone", () => {
    const { container } = render(
      <CourtVisualizer activeZone={null} visualPhase="idle" />
    );
    expect(container.firstChild).toBeDefined();
    // Verify no zone is rendered with active class
    const activeZones = container.querySelectorAll(".fill-red-500\\/30");
    expect(activeZones).toHaveLength(0);
  });

  it.each([
    ["frontForehand", "МРЕЖА Д"],
    ["backBackhand", "ЗАДНА Л"],
    ["overhead", "ЗАДНА Л"],
  ])(
    "highlights the %s zone correctly during shot phase",
    (zone, expectedText) => {
      const { container } = render(
        <CourtVisualizer
          activeZone={
            zone as React.ComponentProps<typeof CourtVisualizer>["activeZone"]
          }
          visualPhase="shot"
        />
      );
      const activeZones = container.querySelectorAll(".fill-red-500\\/30");
      expect(activeZones).toHaveLength(1);
      const textNode = activeZones[0].nextElementSibling;
      expect(textNode?.textContent).toContain(expectedText);
    }
  );
});
