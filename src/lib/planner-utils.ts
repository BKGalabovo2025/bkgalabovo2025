import { Member } from "@/types";

/**
 * Изчислява нивото на умения на база на регистрираното време.
 * Под 3 месеца = Начинаещ. Над 3 месеца = Напреднал.
 */
export function getSkillLevel(member: Member): string {
  if (member.skillLevel) {
    switch (member.skillLevel) {
      case "beginner":
        return "Начинаещи";
      case "intermediate":
        return "Среднонапреднали";
      case "advanced":
        return "Напреднали";
      case "professional":
        return "Професионалисти";
    }
  }

  // Fallback to registration date
  if (member.registrationDate) {
    const regDate = new Date(member.registrationDate);
    const now = new Date();
    const diffMonths =
      (now.getFullYear() - regDate.getFullYear()) * 12 +
      now.getMonth() -
      regDate.getMonth();

    if (diffMonths < 3) {
      return "Начинаещи";
    } else if (diffMonths < 12) {
      return "Напреднали";
    } else {
      return "Експерти";
    }
  }

  return "Начинаещи";
}

/**
 * Динамични BWF интервали (серии, време за работа, време за почивка)
 * на база на възрастовата група.
 */
export function getBWFIntervals(ageGroup: string): {
  sets: number;
  workSec: number;
  restSec: number;
} {
  switch (ageGroup) {
    case "U9":
      return { sets: 2, workSec: 30, restSec: 60 };
    case "U11":
      return { sets: 3, workSec: 45, restSec: 60 };
    case "U13":
      return { sets: 3, workSec: 60, restSec: 45 };
    case "U15":
      return { sets: 4, workSec: 90, restSec: 45 };
    case "U17":
      return { sets: 4, workSec: 120, restSec: 60 };
    case "U19":
      return { sets: 5, workSec: 120, restSec: 60 };
    case "Мъже и Жени":
    case "Мъже/Жени":
      return { sets: 5, workSec: 180, restSec: 90 };
    default:
      return { sets: 3, workSec: 60, restSec: 60 };
  }
}
