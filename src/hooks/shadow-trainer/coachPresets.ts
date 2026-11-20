import { ShadowSettings } from "./types";

export interface CoachPreset {
  id: string;
  name: string;
  category: "bwf" | "specialized" | "custom";
  description?: string;
  badge?: string;
  mode: "standard" | "agility_test";
  drillMode: ShadowSettings["drillMode"];
  cornersMode: ShadowSettings["cornersMode"];
  drillPattern: ShadowSettings["drillPattern"];
  ageGroup: ShadowSettings["ageGroup"];
  sets: number;
  workSec: number;
  restSec: number;
  paceSec: number;
  deceptionEnabled?: boolean;
  leftHanded?: boolean;
  voiceSpeed?: number;
  isBuiltIn?: boolean;
  createdAt?: string;
}

export const DEFAULT_COACH_PRESETS: CoachPreset[] = [
  // ── BWF Международни Възрастови Категории ──
  {
    id: "bwf-u11",
    name: "BWF Shuttle Time (U9-U11)",
    category: "bwf",
    badge: "U9-U11",
    description: "Начинаещи • Основи на придвижването и координация",
    mode: "standard",
    drillMode: "all",
    cornersMode: "4-corners",
    drillPattern: "random",
    ageGroup: "U9-U11",
    sets: 2,
    workSec: 30,
    restSec: 60,
    paceSec: 4.0,
    deceptionEnabled: false,
    isBuiltIn: true,
  },
  {
    id: "bwf-u13",
    name: "BEC Development (U11-U13)",
    category: "bwf",
    badge: "U11-U13",
    description: "Напреднали деца • 6 ъгъла и ритмично темпо",
    mode: "standard",
    drillMode: "all",
    cornersMode: "6-corners",
    drillPattern: "random",
    ageGroup: "U11-U13",
    sets: 3,
    workSec: 40,
    restSec: 45,
    paceSec: 3.0,
    deceptionEnabled: false,
    isBuiltIn: true,
  },
  {
    id: "bwf-u15",
    name: "BWF Junior Circuit (U13-U15)",
    category: "bwf",
    badge: "U13-U15",
    description: "Младша възраст • Динамичен състезателен ритъм",
    mode: "standard",
    drillMode: "all",
    cornersMode: "6-corners",
    drillPattern: "random",
    ageGroup: "U13-U15",
    sets: 3,
    workSec: 45,
    restSec: 30,
    paceSec: 2.5,
    deceptionEnabled: false,
    isBuiltIn: true,
  },
  {
    id: "bwf-u17",
    name: "Asia & Euro Junior (U15-U17)",
    category: "bwf",
    badge: "U15-U17",
    description: "Старша възраст • Висока интензивност и експлозивност",
    mode: "standard",
    drillMode: "all",
    cornersMode: "6-corners",
    drillPattern: "random",
    ageGroup: "U15-U17",
    sets: 4,
    workSec: 45,
    restSec: 30,
    paceSec: 2.0,
    deceptionEnabled: false,
    isBuiltIn: true,
  },
  {
    id: "bwf-u17plus",
    name: "BWF World Tour / Elite (U17+)",
    category: "bwf",
    badge: "U17+ Елит",
    description: "Елит & Мъже/Жени • Максимална бързина и издръжливост",
    mode: "standard",
    drillMode: "all",
    cornersMode: "6-corners",
    drillPattern: "random",
    ageGroup: "U17+",
    sets: 4,
    workSec: 60,
    restSec: 30,
    paceSec: 1.8,
    deceptionEnabled: false,
    isBuiltIn: true,
  },

  // ── Специализирани Треньорски Шаблони ──
  {
    id: "doubles-front-mid",
    name: "Специфична за двойки – предна и средна зона",
    category: "specialized",
    badge: "Двойки",
    description:
      "Мрежа и защита • Без дълбока задна линия за максимална реакция",
    mode: "standard",
    drillMode: "front_only",
    cornersMode: "4-corners",
    drillPattern: "random",
    ageGroup: "U15-U17",
    sets: 4,
    workSec: 40,
    restSec: 30,
    paceSec: 1.9,
    deceptionEnabled: true,
    isBuiltIn: true,
  },
  {
    id: "rehab-slow-pace",
    name: "Възстановяване след контузия – бавно темпо 3.5s",
    category: "specialized",
    badge: "Рехаб",
    description: "Щадящ сплит-степ и контрол на ставите без резки спринтове",
    mode: "standard",
    drillMode: "all",
    cornersMode: "4-corners",
    drillPattern: "random",
    ageGroup: "U13-U15",
    sets: 2,
    workSec: 30,
    restSec: 60,
    paceSec: 3.5,
    deceptionEnabled: false,
    isBuiltIn: true,
  },
  {
    id: "agility-sprint-20",
    name: "Agility Тест – 20 спринтови движения",
    category: "specialized",
    badge: "Тест",
    description: "Контролен тест за бързина на реакцията и придвижването",
    mode: "agility_test",
    drillMode: "all",
    cornersMode: "6-corners",
    drillPattern: "random",
    ageGroup: "U17+",
    sets: 1,
    workSec: 20,
    restSec: 0,
    paceSec: 1.5,
    deceptionEnabled: false,
    isBuiltIn: true,
  },
];

const STORAGE_KEY = "shadow_custom_coach_presets_v1";

function getStorage(): Storage | null {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
    }
    if (typeof localStorage !== "undefined") {
      return localStorage;
    }
  } catch {
    // Storage unavailable
  }
  return null;
}

export function loadCustomCoachPresets(): CoachPreset[] {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (p) => p && typeof p.id === "string" && typeof p.name === "string"
      );
    }
    return [];
  } catch (err) {
    console.warn("Failed to load custom coach presets from localStorage:", err);
    return [];
  }
}

export function saveCustomCoachPreset(
  preset: Omit<CoachPreset, "isBuiltIn" | "category">
): CoachPreset {
  const fullPreset: CoachPreset = {
    ...preset,
    category: "custom",
    isBuiltIn: false,
    createdAt: new Date().toISOString(),
  };

  const storage = getStorage();
  if (storage) {
    try {
      const existing = loadCustomCoachPresets();
      const filtered = existing.filter((p) => p.id !== fullPreset.id);
      filtered.unshift(fullPreset);
      storage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (err) {
      console.warn("Failed to save custom coach preset to localStorage:", err);
    }
  }

  return fullPreset;
}

export function deleteCustomCoachPreset(presetId: string): boolean {
  const storage = getStorage();
  if (!storage) return false;
  try {
    const existing = loadCustomCoachPresets();
    const filtered = existing.filter((p) => p.id !== presetId);
    storage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (err) {
    console.warn(
      "Failed to delete custom coach preset from localStorage:",
      err
    );
    return false;
  }
}

export function getAllPresets(
  customPresets: CoachPreset[] = []
): CoachPreset[] {
  return [...customPresets, ...DEFAULT_COACH_PRESETS];
}

export function findPresetById(
  id: string,
  customPresets: CoachPreset[] = []
): CoachPreset | undefined {
  const all = getAllPresets(customPresets);
  return all.find((p) => p.id.toLowerCase() === id.toLowerCase());
}
