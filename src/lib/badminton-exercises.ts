import { Exercise } from "@/types/planner.types";

export const INITIAL_BWF_EXERCISES: Omit<
  Exercise,
  "id" | "siteId" | "createdAt" | "updatedAt"
>[] = [
  // ================= PHYSICAL (ОФП) =================
  {
    name: "Илинойс тест за бързина (Illinois Agility)",
    description:
      "Бързо бягане със смяна на посоката около 4 конуса. Класически тест за експлозивност и пъргавина.",
    category: "physical",
    source: "Спортна физиология",
    location: ["outdoor", "indoor"],
    ageGroups: ["U13", "U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 15,
    equipment: "Конуси, хронометър",
  },
  {
    name: "BWF Beep Test",
    description:
      "Многостепенен фитнес тест (совалково бягане на 20м) за измерване на аеробна издръжливост.",
    category: "physical",
    source: "BWF High Performance",
    location: ["indoor", "outdoor"],
    ageGroups: ["U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 20,
    equipment: "Аудио запис, 20 метра разстояние",
  },
  {
    name: "Планк (Core Endurance)",
    description:
      "Статично задържане в планк позиция за укрепване на ядрото (core strength). Важно за превенция на контузии.",
    category: "physical",
    source: "BWF Level 2 Physical",
    location: ["indoor", "outdoor"],
    ageGroups: ["U11", "U13", "U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 10,
    equipment: "Постелка",
  },
  {
    name: "Медицинска топка - хвърляне от гърди",
    description:
      "Експлозивно хвърляне на медицинска топка към стена или партньор за развиване на сила в горната част на тялото.",
    category: "physical",
    source: "Национални методики",
    location: ["indoor", "outdoor"],
    ageGroups: ["U13", "U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 15,
    equipment: "Медицинска топка (1-3 кг)",
  },

  // ================= TECHNICAL (ТЕХНИКА) =================
  {
    name: "Star Footwork (Звезда)",
    description:
      "Shadow движение към 6-те ъгъла на корта. Фокус върху split-step, правилно стъпване с водещия крак и връщане в центъра.",
    category: "technical",
    source: "Badminton Europe",
    location: ["indoor"],
    ageGroups: ["U9", "U11", "U13", "U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 20,
    equipment: "Корт",
  },
  {
    name: "Мулти-фийд: Мрежа (Net Kills)",
    description:
      "Треньорът подава бързи пера плътно над филето. Играчът стои на мрежата с вдигната ракета и атакува с късо движение на китката.",
    category: "technical",
    source: "Badminton Asia",
    location: ["indoor"],
    ageGroups: ["U13", "U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 15,
    equipment: "Кош с пера",
  },
  {
    name: "Смеш защита (Smash Defense)",
    description:
      "Треньор забива от задна линия. Защитникът практикува стабилен, нисък стоеж и меко блокиране на перото в предната зона.",
    category: "technical",
    source: "BWF Level 2",
    location: ["indoor"],
    ageGroups: ["U13", "U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 20,
    equipment: "Пера",
  },
  {
    name: "Жонглиране с перо (Keep-uppy)",
    description:
      "За най-малките. Удряне на перото нагоре без да пада, развиване на координация око-ръка и основен форхенд хват.",
    category: "technical",
    source: "BWF Shuttle Time",
    location: ["indoor", "outdoor"],
    ageGroups: ["U9", "U11"],
    durationMinutes: 10,
    equipment: "Ракета, перо",
  },

  // ================= TACTICAL (ТАКТИКА) =================
  {
    name: "2 срещу 1: Атака и Защита",
    description:
      "Двама играчи в защита на цял корт срещу един атакуващ играч. Фокус върху тактическото разпределение на корта.",
    category: "tactical",
    source: "BWF Level 3",
    location: ["indoor"],
    ageGroups: ["U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 25,
    equipment: "Корт, пера",
  },
  {
    name: "Двойки: Drive Battle",
    description:
      "Бързо разиграване с плоски удари (drives) между две двойки. Ако някой повдигне перото, губи точка.",
    category: "tactical",
    source: "BWF Doubles Specific",
    location: ["indoor"],
    ageGroups: ["U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 20,
    equipment: "Корт",
  },
  {
    name: "Атака към бекхенд ъгъла",
    description:
      "Тактическо упражнение за изграждане на атака чрез изолиране на слабия бекхенд ъгъл на противника.",
    category: "tactical",
    source: "Badminton Europe",
    location: ["indoor"],
    ageGroups: ["U13", "U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 20,
    equipment: "Корт",
  },

  // ================= MENTAL (ПСИХОЛОГИЯ) =================
  {
    name: "Сервис под напрежение (19:19)",
    description:
      "Симулация на критичен момент. Играчът трябва да изпълни 5 перфектни сервиса при създаден външен шум или след спринт.",
    category: "mental",
    source: "Психологическа подготовка",
    location: ["indoor"],
    ageGroups: ["U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 15,
    equipment: "Корт, пера",
  },
  {
    name: "Концентрация при умора",
    description:
      "След много тежко физическо натоварване (напр. 2 мин shadow), играчът трябва да уцели 3 малки мишени на корта. Тренира фокус.",
    category: "mental",
    source: "BWF High Performance",
    location: ["indoor"],
    ageGroups: ["U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 15,
    equipment: "Мишени",
  },
];
