import { BadmintonScore } from "@/types/beep-test.types";

/**
 * Изчислява VO2 Max на базата на общия брой совалки.
 * Използваме модифицираната формула на Flouris et al. (2005) за 20-метров тест.
 */
export function calculateVO2Max(totalShuttles: number): number {
  const vo2 =
    18.043461 +
    0.3689295 * totalShuttles -
    0.000349 * Math.pow(totalShuttles, 2);
  return Number(vo2.toFixed(1));
}

export function getTotalShuttles(level: number, shuttle: number): number {
  // Стандартен брой совалки на ниво в 20m Beep Test
  const shuttlesPerLevel = [
    0, 7, 8, 8, 9, 9, 10, 10, 11, 11, 11, 12, 12, 13, 13, 13, 14, 14, 15, 15,
    16, 16,
  ];

  let total = 0;
  for (let i = 1; i < level; i++) {
    total += shuttlesPerLevel[i] || 16;
  }
  total += shuttle;
  return total;
}

function getThresholds(ageGroup: string, gender: "male" | "female") {
  const isFemale = gender === "female";
  if (ageGroup === "U9" || ageGroup === "U11")
    return isFemale ? [5, 6, 7, 8] : [6, 7, 8, 9];
  if (ageGroup === "U13") return isFemale ? [6, 7, 8, 9] : [7, 8, 9, 10];
  if (ageGroup === "U15") return isFemale ? [7, 8, 9, 10] : [8, 9, 10, 12];
  // U17, U19, Adults
  return isFemale ? [8, 9, 10, 11] : [9, 10, 12, 13];
}

/**
 * Изчислява бадминтон оценка според възрастовата група, пола и достигнатото ниво.
 */
export function evaluateBadmintonScore(
  level: number,
  ageGroup: string,
  gender: "male" | "female"
): BadmintonScore {
  const [t1, t2, t3, t4] = getThresholds(ageGroup, gender);
  if (level < t1) return "Лош";
  if (level < t2) return "Среден";
  if (level < t3) return "Добър";
  if (level < t4) return "Отличен";
  return "Елитен състезател";
}
