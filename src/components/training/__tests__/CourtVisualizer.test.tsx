import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CourtVisualizer } from "../CourtVisualizer";

describe("CourtVisualizer Component", () => {
  it("renders correctly with no active zone", () => {
    const { container } = render(
      <CourtVisualizer activeZone={null} visualPhase="idle" />
    );
    expect(container.firstChild).toBeDefined();
    // Verify no zone is rendered with active class (bg-red-500/80)
    const activeZones = container.querySelectorAll(".bg-red-500\\/80");
    expect(activeZones.length).toBe(0);
  });

  it("highlights the frontForehand zone correctly during shot phase", () => {
    const { container } = render(
      <CourtVisualizer activeZone="frontForehand" visualPhase="shot" />
    );
    const activeZones = container.querySelectorAll(".bg-red-500\\/80");
    expect(activeZones.length).toBe(1);
    expect(activeZones[0].textContent).toContain("Форхенд");
  });

  it("highlights the backBackhand zone correctly during shot phase", () => {
    const { container } = render(
      <CourtVisualizer activeZone="backBackhand" visualPhase="shot" />
    );
    const activeZones = container.querySelectorAll(".bg-red-500\\/80");
    expect(activeZones.length).toBe(1);
    expect(activeZones[0].textContent).toContain("Бекхенд");
  });

  it("treats overhead as backLeft zone during shot phase", () => {
    const { container } = render(
      <CourtVisualizer activeZone="overhead" visualPhase="shot" />
    );
    const activeZones = container.querySelectorAll(".bg-red-500\\/80");
    expect(activeZones.length).toBe(1);
    expect(activeZones[0].textContent).toContain("Бекхенд");
  });
});
