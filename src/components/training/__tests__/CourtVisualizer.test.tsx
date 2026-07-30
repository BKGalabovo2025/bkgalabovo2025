import { render } from "@testing-library/react";
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
    expect(activeZones.length).toBe(0);
  });

  it("highlights the frontForehand zone correctly during shot phase", () => {
    const { container } = render(
      <CourtVisualizer activeZone="frontForehand" visualPhase="shot" />
    );
    const activeZones = container.querySelectorAll(".fill-red-500\\/30");
    expect(activeZones.length).toBe(1);
    // Since it's SVG, text content of the next sibling <text> tag
    const textNode = activeZones[0].nextElementSibling;
    expect(textNode?.textContent).toContain("МРЕЖА Д");
  });

  it("highlights the backBackhand zone correctly during shot phase", () => {
    const { container } = render(
      <CourtVisualizer activeZone="backBackhand" visualPhase="shot" />
    );
    const activeZones = container.querySelectorAll(".fill-red-500\\/30");
    expect(activeZones.length).toBe(1);
    const textNode = activeZones[0].nextElementSibling;
    expect(textNode?.textContent).toContain("ЗАДНА Л");
  });

  it("treats overhead as backLeft zone during shot phase", () => {
    const { container } = render(
      <CourtVisualizer activeZone="overhead" visualPhase="shot" />
    );
    const activeZones = container.querySelectorAll(".fill-red-500\\/30");
    expect(activeZones.length).toBe(1);
    const textNode = activeZones[0].nextElementSibling;
    expect(textNode?.textContent).toContain("ЗАДНА Л");
  });
});
