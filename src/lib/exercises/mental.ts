import { Exercise } from "@/types/planner.types";

export const MENTAL_EXERCISES: Omit<
  Exercise,
  "id" | "siteId" | "createdAt" | "updatedAt"
>[] = [
  {
    name: "Сервис под напрежение (19:19)",
    description:
      "Симулация на критичен момент. Мачът започва от 19:19. Играчът трябва да изпълни 5 перфектни сервиса, докато всички други вдигат шум или го разсейват.",
    category: "mental",
    source: "Психологическа подготовка",
    location: ["indoor"],
    ageGroups: ["U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 15,
    equipment: "Корт, пера",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+mental+pressure+training+serve",
  },
  {
    name: "Концентрация при умора (Fatigue Focus)",
    description:
      "След много тежко физическо натоварване (напр. 2 мин shadow или suicide sprints), играчът трябва да уцели 3 малки мишени на корта от сервис. Тренира фокуса.",
    category: "mental",
    source: "BWF High Performance",
    location: ["indoor"],
    ageGroups: ["U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 15,
    equipment: "Мишени, пера",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+fatigue+focus+drills",
  },
  {
    name: "Игра с хендикап (Handicap Matches)",
    description:
      "По-силният играч започва с пасив от -5 или -8 точки (или играе само на половин корт). Целта е да запази спокойствие и методично да навакса изоставането.",
    category: "mental",
    source: "Badminton Europe",
    location: ["indoor"],
    ageGroups: ["U13", "U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 20,
    equipment: "Корт",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+handicap+match+training",
  },
  {
    name: "Безгрешна серия (Consistency Challenge)",
    description:
      "Двама играчи трябва да направят 50 последователни удара (напр. само Clears) без грешка. Ако някой сгреши на 49, започват отначало. Изгражда търпение.",
    category: "mental",
    source: "BWF Level 2",
    location: ["indoor"],
    ageGroups: ["U11", "U13", "U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 20,
    equipment: "Пера",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+consistency+drills",
  },
  {
    name: "Смяна на ракетата по време на разиграване",
    description:
      "Симулация на скъсване на кордаж по време на мач (двойки). Треньорът дава сигнал, единият играч тича да си смени ракетата, а партньорът му защитава сам цял корт.",
    category: "mental",
    source: "Badminton Asia",
    location: ["indoor"],
    ageGroups: ["U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 15,
    equipment: "Резервни ракети",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+doubles+racket+change+mid+rally",
  },
  {
    name: "Сляпа защита (Blind Defense)",
    description:
      "Защитникът стои с гръб към мрежата. Треньорът казва 'ХОП', защитникът се обръща и има 0.5 секунди да реагира на забит смаш. Тренира рефлекси и липса на страх.",
    category: "mental",
    source: "Национални методики",
    location: ["indoor"],
    ageGroups: ["U17", "U19", "Мъже и Жени"],
    durationMinutes: 15,
    equipment: "Кош с пера",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+blind+defense+reaction+drill",
  },
  {
    name: "Лоши отсъждания (Bad Umpire Drill)",
    description:
      "По време на тренировъчен мач, треньорът нарочно отсъжда 2-3 напълно грешни 'Аут' или 'Вътре'. Целта е играчът да се научи да не губи контрол над емоциите си.",
    category: "mental",
    source: "Психологическа подготовка",
    location: ["indoor"],
    ageGroups: ["U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 30,
    equipment: "Корт",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+mental+toughness+bad+calls",
  },
  {
    name: "Медитация и Визуализация (Imagery)",
    description:
      "Преди важен турнир, състезателите лягат в тишина за 10 минути и визуално пресъздават своите най-добри удари и победни моменти.",
    category: "mental",
    source: "Спортна психология",
    location: ["indoor"],
    ageGroups: ["U13", "U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 15,
    equipment: "Постелки",
    videoUrl:
      "https://www.youtube.com/results?search_query=sports+psychology+visualization+techniques",
  },
  {
    name: "Симулация на Златен Гейм (Sudden Death)",
    description:
      "Играе се мач до 1 точка. Този, който спечели точката, печели мача. Всяка грешка е фатална. Учи ги на 100% концентрация при всеки удар.",
    category: "mental",
    source: "BWF High Performance",
    location: ["indoor"],
    ageGroups: ["U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 10,
    equipment: "Корт",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+sudden+death+match+point",
  },
  {
    name: "Дишане 4-7-8 (Box Breathing)",
    description:
      "Техника за успокояване на пулса в паузата между геймовете (11 точки). Вдишване 4 сек, задържане 7 сек, издишване 8 сек.",
    category: "mental",
    source: "Спортна психология",
    location: ["indoor", "outdoor"],
    ageGroups: ["U11", "U13", "U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 5,
    equipment: "Няма",
    videoUrl:
      "https://www.youtube.com/results?search_query=box+breathing+technique+for+athletes",
  },
];
