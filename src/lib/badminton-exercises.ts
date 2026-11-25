import { ALL_EXERCISES } from "./exercises/all";
import { BWF_TEXTBOOK_EXERCISES } from "./exercises/bwf-textbook";

const textbookNames = new Set(BWF_TEXTBOOK_EXERCISES.map((e) => e.name));

/**
 * Пълната официална BWF учебна база:
 * 1) Новите структурирани упражнения по 10-те BWF фундамента (приоритетни)
 * 2) Всички съществуващи упражнения (без дублиране по име)
 */
export const INITIAL_BWF_EXERCISES = [
  ...BWF_TEXTBOOK_EXERCISES,
  ...ALL_EXERCISES.filter((e) => !textbookNames.has(e.name)),
];
