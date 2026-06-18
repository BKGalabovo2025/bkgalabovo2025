/* eslint-disable sonarjs/no-nested-conditional */
/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CourtVisualizer } from "../CourtVisualizer";

describe("CourtVisualizer Component", () => {
  it("renders correctly with no active zone", () => {
    const { container } = render(<CourtVisualizer activeZone={null} />);
    expect(container.firstChild).toBeDefined();
    // Verify no zone is rendered with active class (bg-primary/80)
    const activeZones = container.querySelectorAll(".bg-primary\\/80");
    expect(activeZones.length).toBe(0);
  });

  it("highlights the frontForehand zone correctly", () => {
    const { container } = render(
      <CourtVisualizer activeZone="frontForehand" />
    );
    const activeZones = container.querySelectorAll(".bg-primary\\/80");
    expect(activeZones.length).toBe(1);
    expect(activeZones[0].textContent).toContain("Форхенд");
  });

  it("highlights the backBackhand zone correctly", () => {
    const { container } = render(<CourtVisualizer activeZone="backBackhand" />);
    const activeZones = container.querySelectorAll(".bg-primary\\/80");
    expect(activeZones.length).toBe(1);
    expect(activeZones[0].textContent).toContain("Бекхенд");
  });

  it("treats overhead as backLeft zone", () => {
    const { container } = render(<CourtVisualizer activeZone="overhead" />);
    const activeZones = container.querySelectorAll(".bg-primary\\/80");
    expect(activeZones.length).toBe(1);
    expect(activeZones[0].textContent).toContain("Бекхенд");
  });
});
