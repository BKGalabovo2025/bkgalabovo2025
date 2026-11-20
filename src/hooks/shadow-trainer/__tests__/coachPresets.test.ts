import { beforeEach, describe, expect, it } from "vitest";

import {
  DEFAULT_COACH_PRESETS,
  deleteCustomCoachPreset,
  findPresetById,
  loadCustomCoachPresets,
  saveCustomCoachPreset,
} from "../coachPresets";

describe("CoachPresets Service", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("provides built-in BWF and specialized presets", () => {
    expect(DEFAULT_COACH_PRESETS.length).toBeGreaterThanOrEqual(8);
    const u11 = findPresetById("bwf-u11");
    expect(u11).toBeDefined();
    expect(u11?.ageGroup).toBe("U9-U11");
    expect(u11?.paceSec).toBe(4.0);

    const doubles = findPresetById("doubles-front-mid");
    expect(doubles).toBeDefined();
    expect(doubles?.drillMode).toBe("front_only");

    const rehab = findPresetById("rehab-slow-pace");
    expect(rehab).toBeDefined();
    expect(rehab?.paceSec).toBe(3.5);
  });

  it("saves and loads custom coach presets in localStorage", () => {
    expect(loadCustomCoachPresets()).toEqual([]);

    const saved = saveCustomCoachPreset({
      id: "my-custom-drill",
      name: "Мой личен шаблон за бързина",
      mode: "standard",
      drillMode: "all",
      cornersMode: "6-corners",
      drillPattern: "random",
      ageGroup: "U17+",
      sets: 5,
      workSec: 50,
      restSec: 25,
      paceSec: 1.7,
    });

    expect(saved.id).toBe("my-custom-drill");
    expect(saved.category).toBe("custom");

    const loaded = loadCustomCoachPresets();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].name).toBe("Мой личен шаблон за бързина");

    const found = findPresetById("my-custom-drill", loaded);
    expect(found).toBeDefined();
    expect(found?.sets).toBe(5);
  });

  it("deletes a custom coach preset successfully", () => {
    saveCustomCoachPreset({
      id: "preset-to-delete",
      name: "Временен шаблон",
      mode: "standard",
      drillMode: "all",
      cornersMode: "4-corners",
      drillPattern: "random",
      ageGroup: "U11-U13",
      sets: 3,
      workSec: 30,
      restSec: 30,
      paceSec: 3.0,
    });

    let loaded = loadCustomCoachPresets();
    expect(loaded).toHaveLength(1);

    const deleted = deleteCustomCoachPreset("preset-to-delete");
    expect(deleted).toBe(true);

    loaded = loadCustomCoachPresets();
    expect(loaded).toHaveLength(0);
  });
});
