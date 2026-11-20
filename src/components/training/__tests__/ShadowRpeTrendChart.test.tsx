import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import { TrainingSession } from "@/types/training.types";

import { ShadowRpeTrendChart } from "../shadow/ShadowRpeTrendChart";

describe("ShadowRpeTrendChart", () => {
  it("renders empty state message when no sessions provided", () => {
    render(<ShadowRpeTrendChart sessions={[]} athleteName="Иван Иванов" />);

    expect(
      screen.getByText(/Няма достатъчно данни за крива на умората/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Състезателят Иван Иванов няма регистрирани индивидуални сесии/i
      )
    ).toBeInTheDocument();
  });

  it("calculates adaptation trend and displays sparkline for improving athlete", () => {
    // 4 sessions where RPE drops from 8 to 5 (improving fitness / lower fatigue)
    const mockSessions = [
      {
        id: "s1",
        siteId: "bkgalabovo",
        type: "shadow",
        date: "2026-11-01T10:00:00.000Z",
        memberIds: ["m1"],
        durationMs: 300000,
        shadowDetails: {
          mode: "standard",
          setsCompleted: 3,
          totalSets: 3,
          workTimeSec: 45,
          restTimeSec: 30,
          paceSec: 2.5,
          deceptionEnabled: false,
          individualRpe: { m1: 8 },
        },
      },
      {
        id: "s2",
        siteId: "bkgalabovo",
        type: "shadow",
        date: "2026-11-05T10:00:00.000Z",
        memberIds: ["m1"],
        durationMs: 300000,
        shadowDetails: {
          mode: "standard",
          setsCompleted: 3,
          totalSets: 3,
          workTimeSec: 45,
          restTimeSec: 30,
          paceSec: 2.5,
          deceptionEnabled: false,
          individualRpe: { m1: 8 },
        },
      },
      {
        id: "s3",
        siteId: "bkgalabovo",
        type: "shadow",
        date: "2026-11-10T10:00:00.000Z",
        memberIds: ["m1"],
        durationMs: 300000,
        shadowDetails: {
          mode: "standard",
          setsCompleted: 3,
          totalSets: 3,
          workTimeSec: 45,
          restTimeSec: 30,
          paceSec: 2.5,
          deceptionEnabled: false,
          individualRpe: { m1: 5 },
        },
      },
      {
        id: "s4",
        siteId: "bkgalabovo",
        type: "shadow",
        date: "2026-11-15T10:00:00.000Z",
        memberIds: ["m1"],
        durationMs: 300000,
        shadowDetails: {
          mode: "standard",
          setsCompleted: 3,
          totalSets: 3,
          workTimeSec: 45,
          restTimeSec: 30,
          paceSec: 2.5,
          deceptionEnabled: false,
          individualRpe: { m1: 5 },
        },
      },
    ] as unknown as TrainingSession[];

    render(
      <ShadowRpeTrendChart
        sessions={mockSessions}
        athleteId="m1"
        athleteName="Иван Иванов"
      />
    );

    // Title & subtitle
    expect(
      screen.getByText("Тенденция на умората (RPE Trend)")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Динамика на натоварването за Иван Иванов/i)
    ).toBeInTheDocument();

    // Improving adaptation badge
    expect(screen.getByText(/Повишена издръжливост/i)).toBeInTheDocument();
  });

  it("detects rising fatigue when RPE goes up significantly", () => {
    // Sessions where RPE jumps from 4 to 9 (fatigue / overreaching)
    const mockSessions = [
      {
        id: "s1",
        siteId: "bkgalabovo",
        type: "shadow",
        date: "2026-11-01T10:00:00.000Z",
        memberIds: ["m1"],
        durationMs: 300000,
        shadowDetails: {
          mode: "standard",
          setsCompleted: 3,
          totalSets: 3,
          workTimeSec: 45,
          restTimeSec: 30,
          paceSec: 2.5,
          deceptionEnabled: false,
          individualRpe: { m1: 4 },
        },
      },
      {
        id: "s2",
        siteId: "bkgalabovo",
        type: "shadow",
        date: "2026-11-05T10:00:00.000Z",
        memberIds: ["m1"],
        durationMs: 300000,
        shadowDetails: {
          mode: "standard",
          setsCompleted: 3,
          totalSets: 3,
          workTimeSec: 45,
          restTimeSec: 30,
          paceSec: 2.5,
          deceptionEnabled: false,
          individualRpe: { m1: 4 },
        },
      },
      {
        id: "s3",
        siteId: "bkgalabovo",
        type: "shadow",
        date: "2026-11-10T10:00:00.000Z",
        memberIds: ["m1"],
        durationMs: 300000,
        shadowDetails: {
          mode: "standard",
          setsCompleted: 3,
          totalSets: 3,
          workTimeSec: 45,
          restTimeSec: 30,
          paceSec: 2.5,
          deceptionEnabled: false,
          individualRpe: { m1: 9 },
        },
      },
      {
        id: "s4",
        siteId: "bkgalabovo",
        type: "shadow",
        date: "2026-11-15T10:00:00.000Z",
        memberIds: ["m1"],
        durationMs: 300000,
        shadowDetails: {
          mode: "standard",
          setsCompleted: 3,
          totalSets: 3,
          workTimeSec: 45,
          restTimeSec: 30,
          paceSec: 2.5,
          deceptionEnabled: false,
          individualRpe: { m1: 9 },
        },
      },
    ] as unknown as TrainingSession[];

    render(
      <ShadowRpeTrendChart
        sessions={mockSessions}
        athleteId="m1"
        athleteName="Иван Иванов"
      />
    );

    // Rising fatigue badge
    expect(screen.getByText(/Повишено натоварване/i)).toBeInTheDocument();
  });
});
