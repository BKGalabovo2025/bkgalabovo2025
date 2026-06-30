import { z } from "zod";

const TournamentFormatEnum = z.enum(["berger", "knockout", "mixed"]);
const TournamentStatusEnum = z.enum([
  "upcoming",
  "registration_open",
  "ongoing",
  "completed",
]);
const MatchStatusEnum = z.enum(["pending", "in_progress", "completed"]);
const CategoryEnum = z.enum([
  "singles", // Единично
  "doubles", // Двойки
  "mixed", // Смесени двойки
]);

// ──────────────────────────────────────────────
// Формати за игра (системи за точкуване)
// ──────────────────────────────────────────────
export interface MatchFormatPreset {
  id: string;
  label: string; // Описание за потребителя
  gamesNeededToWin: number; // Колко гейма трябва да спечелиш (1 → best of 1, 2 → best of 3, 3 → best of 5)
  pointsPerGame: number; // До колко точки е геймът
  twoPointAdvantage: boolean; // Трябва ли 2-точкова разлика при равен резултат
  maxPoints: number; // Максимален брой точки (при 2-точкова разлика)
}

export const MATCH_FORMAT_PRESETS: MatchFormatPreset[] = [
  {
    id: "official_21",
    label:
      "🏸 Официален (2 от 3 гейма до 21 т., при 20:20 – до 2 разлика, макс. 30)",
    gamesNeededToWin: 2,
    pointsPerGame: 21,
    twoPointAdvantage: true,
    maxPoints: 30,
  },
  {
    id: "single_21",
    label: "1 гейм до 21 точки",
    gamesNeededToWin: 1,
    pointsPerGame: 21,
    twoPointAdvantage: false,
    maxPoints: 21,
  },
  {
    id: "single_30",
    label: "1 гейм до 30 точки",
    gamesNeededToWin: 1,
    pointsPerGame: 30,
    twoPointAdvantage: false,
    maxPoints: 30,
  },
  {
    id: "best_of_5_15",
    label: "3 от 5 гейма до 15 точки",
    gamesNeededToWin: 3,
    pointsPerGame: 15,
    twoPointAdvantage: false,
    maxPoints: 15,
  },
  {
    id: "best_of_3_15",
    label: "2 от 3 гейма до 15 точки",
    gamesNeededToWin: 2,
    pointsPerGame: 15,
    twoPointAdvantage: false,
    maxPoints: 15,
  },
];

export function getMatchFormat(id?: string): MatchFormatPreset {
  return (
    MATCH_FORMAT_PRESETS.find((f) => f.id === id) ?? MATCH_FORMAT_PRESETS[0]
  );
}

// Валидация на един гейм спрямо формата
export function isValidGameScore(
  p1: number,
  p2: number,
  fmt: MatchFormatPreset
): { valid: boolean; error?: string } {
  const winner = Math.max(p1, p2);
  const loser = Math.min(p1, p2);

  if (fmt.twoPointAdvantage) {
    // Официален режим
    if (winner < fmt.pointsPerGame) {
      return {
        valid: false,
        error: `Победителят трябва да има поне ${fmt.pointsPerGame} точки`,
      };
    }
    if (winner === fmt.maxPoints) {
      // При максималния резултат се приема каквато и да е разлика (30-29 е валидно)
      return { valid: true };
    }
    if (winner > fmt.maxPoints) {
      return {
        valid: false,
        error: `Максималният брой точки е ${fmt.maxPoints}`,
      };
    }
    if (winner - loser < 2) {
      return {
        valid: false,
        error: `При ${fmt.pointsPerGame}:${fmt.pointsPerGame} трябва 2 точки разлика`,
      };
    }
    if (winner - loser > 2 && loser >= fmt.pointsPerGame) {
      return {
        valid: false,
        error: `При ${loser} точки на губещия разликата трябва да е точно 2`,
      };
    }
  } else {
    // Опростен режим – просто до N точки
    if (winner !== fmt.pointsPerGame) {
      return {
        valid: false,
        error: `Победителят трябва да има точно ${fmt.pointsPerGame} точки`,
      };
    }
  }

  return { valid: true };
}

// 1. Схема за самия турнир
export const TournamentSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2, "Заглавието трябва да е поне 2 символа"),
  description: z.string().optional(),
  startDate: z.string().datetime({ message: "Невалидна начална дата" }),
  endDate: z.string().datetime({ message: "Невалидна крайна дата" }),
  location: z.string().min(1, "Локацията е задължителна"),
  status: TournamentStatusEnum,
  format: TournamentFormatEnum,
  categories: z.array(CategoryEnum).min(1, "Изберете поне една категория"),
  matchFormatId: z.string(), // Формат за точкуване
  countsForRanking: z.boolean(), // Влиза ли в ранглистата
  pointsMultiplier: z.number().min(0),
  entryFee: z.number().min(0),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type Tournament = z.infer<typeof TournamentSchema>;

// 2. Схема за записване (Участник / Отбор)
export const TournamentEntrySchema = z.object({
  id: z.string().optional(),
  tournamentId: z.string(),
  categoryId: CategoryEnum,

  // Участник 1 (може да е член на клуба или гост)
  memberId: z.string().optional(),
  externalName: z.string().optional(),

  // Участник 2 (за двойки)
  partnerMemberId: z.string().optional(),
  partnerExternalName: z.string().optional(),

  seed: z.number().optional(), // Поставен номер в схемата
  pointsAwarded: z.number().optional(), // Спечелени точки след края на турнира
  registrationDate: z.string().datetime().optional(),
});

export type TournamentEntry = z.infer<typeof TournamentEntrySchema>;

// 3. Схема за Мач
const MatchSchema = z.object({
  id: z.string().optional(),
  tournamentId: z.string(),
  categoryId: CategoryEnum,
  stage: z.string(), // Напр. "Група А", "Полуфинал"
  round: z.number().optional(), // Кръг 1, 2, 3... при система на Бергер

  player1EntryId: z.string().nullable().optional(), // null ако почива (BYE)
  player2EntryId: z.string().nullable().optional(), // null ако почива (BYE)

  score: z.string().optional(), // Напр. "21-15, 19-21, 21-18"
  winnerEntryId: z.string().optional(),

  status: MatchStatusEnum.default("pending"),
  nextMatchId: z.string().optional(), // За свързване на мачове в елиминационна схема
  updatedAt: z.any().optional(),
  createdAt: z.any().optional(),
});

export type Match = z.infer<typeof MatchSchema>;
