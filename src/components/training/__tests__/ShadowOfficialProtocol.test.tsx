import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import { ShadowOfficialProtocol } from "../shadow/ShadowOfficialProtocol";

describe("ShadowOfficialProtocol", () => {
  it("renders official club header and titles for standard shadow training", () => {
    const mockAthletes = [
      { id: "m1", name: "Иван Иванов", ageGroup: "U15", rpe: 7 },
      { id: "m2", name: "Мария Петрова", ageGroup: "U13", rpe: 5 },
    ];
    const mockHeatmap = {
      frontForehand: 30,
      backBackhand: 20,
    };

    render(
      <ShadowOfficialProtocol
        date="2026-11-20T10:00:00.000Z"
        coachName="Мира Георгиева"
        mode="standard"
        preset="U13-U15"
        cornersMode="6-corners"
        ageGroup="U13-U15"
        durationMs={180000}
        completedSets={3}
        totalSets={3}
        workSec={45}
        restSec={30}
        paceSec={2.5}
        notes="Отличен ритъм и добра реакция при предна мрежа."
        heatmap={mockHeatmap}
        athletes={mockAthletes}
      />
    );

    // Official club title
    expect(
      screen.getByText(/СНЦ „БАДМИНТОН КЛУБ ГЪЛЪБОВО“/i)
    ).toBeInTheDocument();

    // Document title
    expect(
      screen.getByText(/ОФИЦИАЛЕН ПРОТОКОЛ ОТ ТРЕНИРОВЪЧНА СЕСИЯ ПО ДВИЖЕНИЯ/i)
    ).toBeInTheDocument();

    // Coach and athletes
    expect(
      screen.getAllByText(/Мира Георгиева/i).length
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Иван Иванов")).toBeInTheDocument();
    expect(screen.getByText("Мария Петрова")).toBeInTheDocument();
    expect(screen.getByText("7/10")).toBeInTheDocument();

    // Notes
    expect(
      screen.getByText(/Отличен ритъм и добра реакция при предна мрежа/i)
    ).toBeInTheDocument();
  });

  it("renders specialized agility sprint test protocol when mode is agility_test", () => {
    const mockAthletes = [
      { id: "m1", name: "Димитър Стоянов", ageGroup: "U17", timeSec: 18.4 },
    ];

    render(
      <ShadowOfficialProtocol
        date="2026-11-20T10:00:00.000Z"
        mode="agility_test"
        preset="agility_test"
        ageGroup="U17"
        durationMs={18400}
        athletes={mockAthletes}
        agilityTestTimeSec={18.4}
        agilityActionsDone={20}
      />
    );

    // Agility test title
    expect(
      screen.getByText(/ОФИЦИАЛЕН ПРОТОКОЛ ОТ КОНТРОЛЕН НОРМАТИВ ЗА БЪРЗИНА/i)
    ).toBeInTheDocument();

    expect(screen.getByText("Димитър Стоянов")).toBeInTheDocument();
    expect(screen.getByText("18.4s")).toBeInTheDocument();
    expect(screen.getByText(/Контролен тест/i)).toBeInTheDocument();
  });
});
