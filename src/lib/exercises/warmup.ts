import { Exercise } from "@/types/planner.types";

export const WARMUP_EXERCISES: Omit<
  Exercise,
  "id" | "siteId" | "createdAt" | "updatedAt"
>[] = [
  {
    name: "Динамичен стречинг и мобилност (BWF Standard)",
    description:
      "Стандартен протокол за загрявка на BWF. Включва: 1. Леко бягане 3 мин. 2. Ротации на ставите (врата, рамене, китки, таз, глезени). 3. Динамични разтягания (високо коляно, пети към седалището, странични напади, 'crossover' бягане). 4. Спринтове на къси дистанции (5-10 метра) с постепенно увеличаване на скоростта.",
    category: "warmup",
    source: "BWF Coach Education Manual Level 1",
    location: ["both"],
    ageGroups: ["U9", "U11", "U13", "U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 15,
    equipment: "Няма",
  },
  {
    name: "Специфична бадминтон загрявка с перо (Shadow & Tap)",
    description:
      "Специфична загрявка преди мач или техническа тренировка. Започва със 'Shadow Badminton' (имитация на удари без перо) с акцент върху работата на краката (Footwork). Следват 5 минути леко подаване (Drives & Clears) в центъра на корта, постепенно преминавайки към по-широки ъгли.",
    category: "warmup",
    source: "Badminton Europe Pre-Match Protocol",
    location: ["indoor"],
    ageGroups: ["U9", "U11", "U13", "U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 10,
    equipment: "Ракети, Пера",
  },
  {
    name: "Agility Ladder Warm-up (Координационна стълба)",
    description:
      "Използване на координационна стълба за загрявка на нервната система и подобряване на бързината на краката. Упражнения: 'One in, one out', 'Two in, two out', 'Icky Shuffle', 'Lateral runs'. Всяко упражнение се повтаря по 2 пъти с плавно увеличаване на темпото.",
    category: "warmup",
    source: "Badminton Asia Fundamentals",
    location: ["both"],
    ageGroups: ["U9", "U11", "U13", "U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 10,
    equipment: "Координационна стълбичка",
  },
  {
    name: "Реакционна загрявка (Reaction Games)",
    description:
      "Игри за реакция, подходящи за всички възрасти за 'събуждане' на състезателите. Треньорът посочва посока или цвят на конус, а състезателите трябва да реагират със сплит-степ (split-step) и спринт до съответната точка. Включва и игра на двойки: 'Докосни коляното на партньора' (Tag games) за загрявка на краката и торса.",
    category: "warmup",
    source: "BWF Shuttle Time Programme",
    location: ["indoor"],
    ageGroups: ["U9", "U11", "U13", "U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 8,
    equipment: "Цветни конуси",
  },
  {
    name: "Загрявка със съпротивителни ластици (Theraband Activation)",
    description:
      "Протокол за активация на ротаторния маншон и мускулите около раменната става. Включва външна и вътрешна ротация с лек ластик (15 повторения), симулация на удар над глава срещу съпротивление и издърпване към гърдите (Face pulls).",
    category: "warmup",
    source: "BWF Sports Science & Medicine",
    location: ["both"],
    ageGroups: ["U13", "U15", "U17", "U19", "Мъже и Жени"], // Usually U9/U11 do less band work
    durationMinutes: 7,
    equipment: "Съпротивителни ластици (Theraband)",
  },
];
