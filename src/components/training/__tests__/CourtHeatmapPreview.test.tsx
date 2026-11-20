import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { CourtHeatmapPreview } from "../shadow/CourtHeatmapPreview";

describe("CourtHeatmapPreview", () => {
  it("renders empty state gracefully when no heatmap data provided", () => {
    render(<CourtHeatmapPreview heatmap={{}} />);

    expect(
      screen.getByText("Топлинна карта на ударите (Heatmap)")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Няма отчетени удари за тази сесия/i)
    ).toBeInTheDocument();
  });

  it("calculates total hits and dominant zone accurately", () => {
    const mockHeatmap = {
      frontForehand: 42,
      frontBackhand: 18,
      backForehand: 12,
      backBackhand: 6,
    };

    render(<CourtHeatmapPreview heatmap={mockHeatmap} />);

    // Total hits = 42 + 18 + 12 + 6 = 78
    expect(
      screen.getByText(/78 удара разпределени по зони/i)
    ).toBeInTheDocument();

    // Dominant zone is frontForehand (42)
    expect(
      screen.getByText(/Най-натоварена: Мрежа Форхенд \(42\)/i)
    ).toBeInTheDocument();
  });

  it("displays shot counts and percentages on the zones", () => {
    const mockHeatmap = {
      frontForehand: 50,
      backBackhand: 50,
    };

    render(<CourtHeatmapPreview heatmap={mockHeatmap} />);

    // Each should be 50%
    const pctElements = screen.getAllByText("50% от сесията");
    expect(pctElements.length).toBeGreaterThanOrEqual(2);
  });

  it("handles left-handed mirroring orientation", () => {
    const mockHeatmap = {
      frontForehand: 30,
    };

    const { rerender } = render(
      <CourtHeatmapPreview heatmap={mockHeatmap} leftHanded={false} />
    );
    expect(
      screen.getByText("Топлинна карта на ударите (Heatmap)")
    ).toBeInTheDocument();

    rerender(<CourtHeatmapPreview heatmap={mockHeatmap} leftHanded={true} />);
    expect(
      screen.getByText("Топлинна карта на ударите (Heatmap)")
    ).toBeInTheDocument();
  });

  it("allows selecting a zone to reveal detailed biomechanical feedback", () => {
    const mockHeatmap = {
      frontForehand: 42,
      frontBackhand: 18,
    };
    const onZoneClick = vi.fn();

    render(
      <CourtHeatmapPreview heatmap={mockHeatmap} onZoneClick={onZoneClick} />
    );

    // Click on the quick pill for frontForehand
    const pill = screen.getAllByRole("button", {
      name: /МРЕЖА ФОРХЕНД/i,
    })[0];
    fireEvent.click(pill);

    expect(onZoneClick).toHaveBeenCalledWith("frontForehand");
    // Deep analysis card should appear
    expect(
      screen.getByText(/Придвижване към преден десен ъгъл/i)
    ).toBeInTheDocument();
  });
});
