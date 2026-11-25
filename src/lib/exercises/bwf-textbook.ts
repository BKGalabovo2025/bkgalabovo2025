import {
  BWF_FUNDAMENTAL_BY_ID,
  getFundamentalChapter,
} from "@/lib/bwf-fundamentals";
import type {
  CoachMethodology,
  DrillCourtDiagramData,
  Exercise,
  FundamentalId,
  ProgressionStage,
} from "@/types/planner.types";

type TextbookExerciseSeed = Omit<
  Exercise,
  "id" | "siteId" | "createdAt" | "updatedAt"
>;

const ALL_AGES = ["U9", "U11", "U13", "U15", "U17", "U19", "Мъже и Жени"];
const YOUTH_AGES = ["U9", "U11", "U13"];
const OLDER_AGES = ["U13", "U15", "U17", "U19", "Мъже и Жени"];

/**
 * Помощна функция: създава упражнение с пълната 5-блокова методология от главата,
 * с възможност за специфични допълнения за конкретното упражнение.
 */
function buildTextbookExercise(
  fundamentalId: FundamentalId,
  progressionStage: ProgressionStage,
  partial: Omit<
    TextbookExerciseSeed,
    "fundamentalId" | "progressionStage" | "methodology" | "source"
  > & {
    methodologyOverrides?: Partial<CoachMethodology>;
  }
): TextbookExerciseSeed {
  const chapter = BWF_FUNDAMENTAL_BY_ID[fundamentalId];
  const { methodologyOverrides, ...rest } = partial;
  const methodology: CoachMethodology = {
    ...chapter.methodology,
    ...methodologyOverrides,
  };

  return {
    ...rest,
    fundamentalId,
    progressionStage,
    source: methodology.officialSource,
    linkedTestIds: rest.linkedTestIds ?? chapter.linkedTestIds,
    courtDiagram: rest.courtDiagram ?? chapter.defaultDiagram,
    methodology,
  };
}

export const BWF_TEXTBOOK_EXERCISES: TextbookExerciseSeed[] = [
  // =========================================================================
  // ГЛАВА 1: ХВАТОВЕ И СМЯНА НА ХВАТ
  // =========================================================================
  buildTextbookExercise("grips", "learn", {
    name: "Фундамент: Форхенд хват „Здрависване“ и баланс на перо",
    description:
      "Овладяване на правилния V-хват (форхенд) чрез балансиране на перо върху струните, събиране на перо от пода с ракетата и леко почукване пред тялото.",
    category: "technique",
    phase: "main-tech",
    location: ["court"],
    ageGroups: ["U9", "U11", "U13"],
    durationMinutes: 8,
    dosageText: "3 × 90 сек. (проверка на V-хвата след всяка серия)",
    equipment: ["Ракета", "Пера"],
    coachFeedRequired: false,
    isHomeFriendly: true,
    intensity: 1,
    complexityLevel: 1,
    focusTags: ["Форхенд хват", "Координация", "Усет за ракета"],
    coachingPoints: [
      "V-формата между палеца и показалеца е точно на тесния ръб.",
      "Показалецът е леко изнесен напред като спусък.",
      "Дръжката стои в пръстите, не стегната в юмрук.",
    ],
  }),
  buildTextbookExercise("grips", "consolidate", {
    name: "Игра за хват: Жонглиране „Форхенд–Бекхенд“ (Keep-uppy)",
    description:
      "Състезателят жонглира с перо във въздуха, като на всяко докосване завърта ракетата с пръсти и редува форхенд и бекхенд хват. Игрова задача: поставяне на личен рекорд без изпускане.",
    category: "games",
    phase: "main-tech",
    location: ["court"],
    ageGroups: ALL_AGES,
    durationMinutes: 8,
    dosageText: "3 серии × до личен рекорд (цел: 15–30 докосвания)",
    equipment: ["Ракета", "Пера"],
    coachFeedRequired: false,
    isHomeFriendly: true,
    intensity: 2,
    complexityLevel: 2,
    focusTags: ["Смяна на хват", "Форхенд хват", "Бекхенд хват"],
  }),
  buildTextbookExercise("grips", "apply", {
    name: "Бърза смяна на хват до стена (Wall Drive)",
    description:
      "Непрекъснати плоски удари до стена от 2 метра разстояние с принудителна смяна между форхенд и бекхенд хват. Развива релаксирано стискане на пръстите (finger power) под високо темпо.",
    category: "technique",
    phase: "main-tech",
    location: ["court"],
    ageGroups: OLDER_AGES,
    durationMinutes: 10,
    dosageText: "4 × 45 сек. работа / 30 сек. почивка",
    equipment: ["Ракета", "Пера"],
    coachFeedRequired: false,
    isHomeFriendly: true,
    intensity: 3,
    complexityLevel: 3,
    focusTags: ["Смяна на хват", "Finger power", "Рефлекс"],
  }),

  // =========================================================================
  // ГЛАВА 2: СПЛИТ СТЕП И ГОТОВА СТОЙКА
  // =========================================================================
  buildTextbookExercise("split-step", "learn", {
    name: "Фундамент: Сплит степ „Пружинка“ на звуков сигнал",
    description:
      "Усвояване на ниското, тихо отскокче (Split Step) с кацане на възглавничките при пляскане или свирка, последвано от „замръзване“ за 1 секунда в широка атлетична стойка.",
    category: "technique",
    phase: "main-tech",
    location: ["court"],
    ageGroups: ALL_AGES,
    durationMinutes: 8,
    dosageText: "3 × 10 повторения (1 сек. задържане в ниска стойка)",
    equipment: ["Конуси"],
    coachFeedRequired: false,
    isHomeFriendly: true,
    intensity: 2,
    complexityLevel: 1,
    focusTags: ["Сплит степ", "Готова стойка", "Баланс"],
  }),
  buildTextbookExercise("split-step", "consolidate", {
    name: "Игра за сплит степ: „Огледало“ по двойки с конуси",
    description:
      "Двама играчи стоят един срещу друг през мрежата (или на линия) с по 2 конуса отстрани. Водещият прави сплит степ и тръгва рязко към конус, а „огледалото“ трябва да кацне в сплит степ в същия миг и да го последва.",
    category: "games",
    phase: "main-tech",
    location: ["court"],
    ageGroups: ALL_AGES,
    durationMinutes: 10,
    dosageText: "4 × 45 сек. (смяна на водещия на всеки рунд)",
    equipment: ["Конуси"],
    coachFeedRequired: false,
    isHomeFriendly: false,
    intensity: 3,
    complexityLevel: 2,
    focusTags: ["Сплит степ", "Реакция", "Игрова вариация"],
  }),
  buildTextbookExercise("split-step", "consolidate", {
    name: "Игра за сплит степ: „Светофар“ в 4 и 6 ъгъла",
    description:
      "Игрова форма с цветни конуси или посочване с ракета: при сигнал играчът прави навременен сплит степ, докосва посочения конус с правилна стъпка и се връща в базата.",
    category: "games",
    phase: "main-tech",
    location: ["court"],
    ageGroups: YOUTH_AGES,
    durationMinutes: 10,
    dosageText: "3 × 60 сек. работа / 45 сек. почивка",
    equipment: ["Конуси"],
    coachFeedRequired: false,
    isHomeFriendly: false,
    intensity: 3,
    complexityLevel: 2,
    focusTags: ["Сплит степ", "Придвижване", "Игра"],
  }),
  buildTextbookExercise("split-step", "apply", {
    name: "Реактивен сплит степ с подаване в 6 посоки",
    description:
      "Партньор или треньор подава с ракета в произволен ъгъл. Фокусът е кацането от сплит степа да съвпада точно с контакта на ракетата с перото, преди експлозивното излитане.",
    category: "tactics",
    phase: "main-tact",
    location: ["court"],
    ageGroups: OLDER_AGES,
    durationMinutes: 12,
    dosageText: "4 × 12 пера на серия (смяна на ролите)",
    equipment: ["Ракета", "Пера", "Конуси"],
    coachFeedRequired: true,
    isHomeFriendly: false,
    intensity: 4,
    complexityLevel: 4,
    focusTags: ["Сплит степ", "Тайминг", "6 ъгъла"],
  }),

  // =========================================================================
  // ГЛАВА 3: ПРИДВИЖВАНЕ НАПРЕД — ФОРХЕНД (4-ТЕ ВАРИАНТА)
  // =========================================================================
  buildTextbookExercise("front-forehand", "learn", {
    name: "Фундамент: Приставна крачка + напад напред ФХ (без и с перо)",
    description:
      "Овладяване на точния ритъм „Сплит → Приставна крачка → Напад на пета с ракетен крак“ към предния форхенд ъгъл, с рано изнесена ракета и прав гръб.",
    category: "technique",
    phase: "main-tech",
    location: ["court"],
    ageGroups: ALL_AGES,
    durationMinutes: 10,
    dosageText: "3 × 8 повторения (първо без перо, после с подаване от ръка)",
    equipment: ["Ракета", "Пера", "Конуси"],
    coachFeedRequired: false,
    isHomeFriendly: true,
    intensity: 2,
    complexityLevel: 1,
    focusTags: ["Придвижване напред ФХ", "Приставна крачка", "Напад"],
  }),
  buildTextbookExercise("front-forehand", "consolidate", {
    name: "Напред ФХ — Вариант 1: Добиване над мрежата (Net Kill)",
    description:
      "Придвижване с приставна крачка и напад напред към високо подадено перо над лентата и рязко, компактно добиване надолу с пръсти и предмишница, без докосване на мрежата.",
    category: "technique",
    phase: "main-tech",
    location: ["court"],
    ageGroups: ALL_AGES,
    durationMinutes: 12,
    dosageText: "3 × 10 пера (по двойки с подаване от ръка или ракета)",
    equipment: ["Ракета", "Пера", "Конуси"],
    coachFeedRequired: false,
    isHomeFriendly: false,
    intensity: 3,
    complexityLevel: 2,
    focusTags: ["Придвижване напред ФХ", "Добиване", "Net Kill"],
    courtDiagram: {
      players: [{ x: 52, y: 74, label: "Играч" }],
      coach: { x: 76, y: 42, label: "Подаващ" },
      targetZones: [{ x: 76, y: 30, r: 7, label: "Добиване" }],
      arrows: [
        {
          from: { x: 52, y: 74 },
          to: { x: 76, y: 56 },
          type: "movement",
          label: "Приставна+Напад",
        },
        {
          from: { x: 76, y: 53 },
          to: { x: 76, y: 30 },
          type: "shuttle",
          label: "Net Kill",
        },
      ],
      caption: "Приставна крачка напред ФХ → рязко добиване стръмно надолу",
    },
  }),
  buildTextbookExercise("front-forehand", "consolidate", {
    name: "Напред ФХ — Вариант 2: Късо по правата (Straight Net Shot)",
    description:
      "Придвижване с приставна крачка и напад към форхенд мрежа и нежно прехвърляне по правата точно над лентата (tumbling net shot). Игрова цел: перото да падне пред линията за сервис.",
    category: "technique",
    phase: "main-tech",
    location: ["court"],
    ageGroups: ALL_AGES,
    durationMinutes: 12,
    dosageText: "3 × 12 пера (броене на точни къси в зоната)",
    equipment: ["Ракета", "Пера", "Конуси"],
    coachFeedRequired: false,
    isHomeFriendly: false,
    intensity: 2,
    complexityLevel: 2,
    focusTags: ["Придвижване напред ФХ", "Късо по правата", "Мрежа"],
    courtDiagram: {
      players: [{ x: 52, y: 74, label: "Играч" }],
      coach: { x: 76, y: 38, label: "Партньор" },
      targetZones: [{ x: 78, y: 44, r: 6, label: "Права" }],
      arrows: [
        { from: { x: 52, y: 74 }, to: { x: 76, y: 56 }, type: "movement" },
        {
          from: { x: 76, y: 55 },
          to: { x: 78, y: 44 },
          type: "shuttle",
          label: "Късо права",
        },
      ],
      caption: "Приставна крачка напред ФХ → меко късо по правата до лентата",
    },
  }),
  buildTextbookExercise("front-forehand", "consolidate", {
    name: "Напред ФХ — Вариант 3: Късо по диагонала (Cross-Court Net)",
    description:
      "От същия напад напред ФХ играчът извърта леко главата на ракетата навътре и насочва ниско късо перо по диагонала към далечния преден ъгъл.",
    category: "technique",
    phase: "main-tech",
    location: ["court"],
    ageGroups: OLDER_AGES,
    durationMinutes: 12,
    dosageText: "3 × 10 пера (цел: диагонален конус пред линията за сервис)",
    equipment: ["Ракета", "Пера", "Конуси"],
    coachFeedRequired: false,
    isHomeFriendly: false,
    intensity: 3,
    complexityLevel: 3,
    focusTags: ["Придвижване напред ФХ", "Късо по диагонала", "Мрежа"],
    courtDiagram: {
      players: [{ x: 52, y: 74, label: "Играч" }],
      coach: { x: 74, y: 38, label: "Партньор" },
      targetZones: [{ x: 22, y: 44, r: 6, label: "Диагонал" }],
      arrows: [
        { from: { x: 52, y: 74 }, to: { x: 76, y: 56 }, type: "movement" },
        {
          from: { x: 76, y: 55 },
          to: { x: 22, y: 44 },
          type: "shuttle",
          label: "Късо диаг.",
        },
      ],
      caption:
        "Приставна крачка напред ФХ → късо по диагонала към далечния ъгъл",
    },
  }),
  buildTextbookExercise("front-forehand", "learn", {
    name: "Напред ФХ — Вариант 4: Форхенд изтегляне към задна линия (Lift)",
    description:
      "Основно упражнение за форхенд изтегляне от мрежата до последния 1.5 м на задната линия. Фокус върху стабилен напад на пета, нисък замах от предмишницата и рязко стягане на пръстите.",
    category: "technique",
    phase: "main-tech",
    location: ["court"],
    ageGroups: ALL_AGES,
    durationMinutes: 12,
    dosageText: "3 × 12 пера (целева зона с конуси на задната линия)",
    equipment: ["Ракета", "Пера", "Конуси"],
    coachFeedRequired: false,
    isHomeFriendly: false,
    intensity: 3,
    complexityLevel: 2,
    focusTags: ["Придвижване напред ФХ", "Форхенд изтегляне", "Lift"],
    courtDiagram: {
      players: [{ x: 52, y: 74, label: "Играч" }],
      coach: { x: 74, y: 40, label: "Подаващ" },
      targetZones: [{ x: 74, y: 12, r: 8, label: "Задна линия" }],
      arrows: [
        {
          from: { x: 52, y: 74 },
          to: { x: 76, y: 56 },
          type: "movement",
          label: "Напад",
        },
        {
          from: { x: 76, y: 55 },
          to: { x: 74, y: 12 },
          type: "shuttle",
          label: "Високо изтегляне",
        },
      ],
      caption: "Напад напред ФХ → високо и дълбоко изтегляне до задната линия",
    },
  }),
  buildTextbookExercise("front-forehand", "consolidate", {
    name: "Игра за ФХ изтегляне: „Коридор до задната линия“ по двойки",
    description:
      "Игрова вариация за затвърждаване на форхенд изтеглянето: единият играч пуска къс дроп/мрежа, а другият влиза с приставна крачка и изтегля високо в обозначената задна зона (1 т. за всяко точно попадане).",
    category: "games",
    phase: "main-tact",
    location: ["court"],
    ageGroups: ALL_AGES,
    durationMinutes: 12,
    dosageText: "2 рунда × до 15 точни изтегляния (смяна на ролите)",
    equipment: ["Ракета", "Пера", "Конуси"],
    coachFeedRequired: false,
    isHomeFriendly: false,
    intensity: 3,
    complexityLevel: 2,
    focusTags: ["Форхенд изтегляне", "Игрова вариация", "Точност"],
  }),
  buildTextbookExercise("front-forehand", "apply", {
    name: "ФХ Мрежа с децепция: 4 опции по сигнал (Треньорски мултифийд)",
    description:
      "Треньорът подава към преден ФХ, а в последния миг дава сигнал за избор: добиване, късо по правата, късо по диагонала или изтегляне. Изгражда еднаква подготовка и тактическо решение под натиск.",
    category: "tactics",
    phase: "main-tact",
    location: ["court"],
    ageGroups: OLDER_AGES,
    durationMinutes: 12,
    dosageText: "3 × 12 пера на състезател (ротация през корта на треньора)",
    equipment: ["Ракета", "Пера", "Кош с пера"],
    coachFeedRequired: true,
    isHomeFriendly: false,
    intensity: 4,
    complexityLevel: 4,
    focusTags: ["Придвижване напред ФХ", "Децепция", "Мултифийд"],
  }),

  // =========================================================================
  // ГЛАВА 4: ПРИДВИЖВАНЕ НАПРЕД — БЕКХЕНД
  // =========================================================================
  buildTextbookExercise("front-backhand", "learn", {
    name: "Фундамент: Приставна крачка + напад напред БХ (смяна към палец)",
    description:
      "Усвояване на придвижването към предния бекхенд ъгъл с ракетен крак отпред и ранна смяна към бекхенд хват (палец на широката стена).",
    category: "technique",
    phase: "main-tech",
    location: ["court"],
    ageGroups: ALL_AGES,
    durationMinutes: 10,
    dosageText: "3 × 8 повторения (с устна команда „ПАЛЕЦ!“)",
    equipment: ["Ракета", "Пера", "Конуси"],
    coachFeedRequired: false,
    isHomeFriendly: true,
    intensity: 2,
    complexityLevel: 1,
    focusTags: ["Придвижване напред БХ", "Бекхенд хват", "Напад"],
  }),
  buildTextbookExercise("front-backhand", "consolidate", {
    name: "Напред БХ: Редуване късо по правата / диагонала и БХ изтегляне",
    description:
      "По двойки: подаване в преден БХ ъгъл → играчът редува 1 късо по правата, 1 късо по диагонала и 1 дълбоко бекхенд изтегляне с натиск на палеца.",
    category: "technique",
    phase: "main-tech",
    location: ["court"],
    ageGroups: ALL_AGES,
    durationMinutes: 12,
    dosageText: "3 × 12 пера (смяна на подаващия)",
    equipment: ["Ракета", "Пера", "Конуси"],
    coachFeedRequired: false,
    isHomeFriendly: false,
    intensity: 3,
    complexityLevel: 3,
    focusTags: ["Придвижване напред БХ", "БХ изтегляне", "Мрежа"],
  }),
  buildTextbookExercise("front-backhand", "apply", {
    name: "Игра на предна линия: Мрежови дуел (ФХ ↔ БХ)",
    description:
      "Състезателно рали 1v1 само в предната половина (пред линията за сервис). Учи на бърза смяна ФХ–БХ, ранно посрещане над лентата и мигновено добиване при висока грешка.",
    category: "games",
    phase: "main-tact",
    location: ["court"],
    ageGroups: ALL_AGES,
    durationMinutes: 10,
    dosageText: "Геймове до 11 точки (смяна на партньор след всеки гейм)",
    equipment: ["Ракета", "Пера"],
    coachFeedRequired: false,
    isHomeFriendly: false,
    intensity: 3,
    complexityLevel: 3,
    focusTags: ["Мрежа", "БХ и ФХ", "Игрова вариация"],
  }),

  // =========================================================================
  // ГЛАВА 5: ПРИДВИЖВАНЕ НАЗАД И НОЖИЧНА СТЪПКА
  // =========================================================================
  buildTextbookExercise("rear-footwork", "learn", {
    name: "Фундамент: Странично шасе назад + ножична стъпка (Scissor Kick)",
    description:
      "Без ракета и с мека топка/перо: странично завъртане, приставни крачки назад, плавна размяна на краката (ножица) при хвърляне напред и мигновено тръгване към базата.",
    category: "technique",
    phase: "main-tech",
    location: ["court"],
    ageGroups: ALL_AGES,
    durationMinutes: 10,
    dosageText: "3 × 8 повторения (контрол на мекото кацане)",
    equipment: ["Конуси", "Пера"],
    coachFeedRequired: false,
    isHomeFriendly: true,
    intensity: 2,
    complexityLevel: 2,
    focusTags: ["Придвижване назад", "Ножична стъпка", "Възстановяване"],
  }),
  buildTextbookExercise("rear-footwork", "consolidate", {
    name: "Ножичен клиър + докосване на централния конус",
    description:
      "По двойки на половин корт: високо подаване към задната линия → странично шасе + ножичен клиър + мигновено докосване на централния конус преди следващия удар.",
    category: "technique",
    phase: "main-tech",
    location: ["court"],
    ageGroups: ALL_AGES,
    durationMinutes: 12,
    dosageText: "3 × 10 удара на състезател",
    equipment: ["Ракета", "Пера", "Конуси"],
    coachFeedRequired: false,
    isHomeFriendly: false,
    intensity: 3,
    complexityLevel: 3,
    focusTags: ["Ножична стъпка", "Възстановяване", "Клиър"],
  }),
  buildTextbookExercise("rear-footwork", "apply", {
    name: "Диагонална комбинация: Задна ножица → Преден напад",
    description:
      "Пълно покриване на диагонала: висок клиър/дроп от задна линия с ножична стъпка, последван от експлозивно излизане напред за късо на мрежата.",
    category: "tactics",
    phase: "main-tact",
    location: ["court"],
    ageGroups: OLDER_AGES,
    durationMinutes: 12,
    dosageText: "4 × 10 пера (мултифийд или рали по диагонал)",
    equipment: ["Ракета", "Пера", "Кош с пера"],
    coachFeedRequired: true,
    isHomeFriendly: false,
    intensity: 4,
    complexityLevel: 4,
    focusTags: ["Придвижване назад", "Диагонал", "Издръжливост"],
  }),

  // =========================================================================
  // ГЛАВА 6: СЕРВИС И ПОСРЕЩАНЕ
  // =========================================================================
  buildTextbookExercise("serve-receive", "learn", {
    name: "Фундамент: Къс бекхенд сервис в мишена (обръч / „Т“-зона)",
    description:
      "Техника на късия бекхенд сервис под 1.15 м с цел перото да преминава ниско над лентата и да каца в мишена до „Т“-то.",
    category: "technique",
    phase: "main-tech",
    location: ["court"],
    ageGroups: ALL_AGES,
    durationMinutes: 10,
    dosageText: "3 × 15 сервиса (броене на точните попадения)",
    equipment: ["Ракета", "Пера", "Конуси"],
    coachFeedRequired: false,
    isHomeFriendly: true,
    intensity: 1,
    complexityLevel: 1,
    focusTags: ["Къс сервис", "Точност", "Бекхенд хват"],
  }),
  buildTextbookExercise("serve-receive", "consolidate", {
    name: "Игра за сервис: „Зони за точки“ (Къс vs Висок/Флик)",
    description:
      "Срещу мишени на корта: 2 точки за попадане до „Т“-то, 2 точки за попадане в задната лента при висок/флик сервис, -1 точка при висок прелет над ластика.",
    category: "games",
    phase: "main-tech",
    location: ["court"],
    ageGroups: ALL_AGES,
    durationMinutes: 10,
    dosageText: "2 серии × 20 сервиса (индивидуален или отборен резултат)",
    equipment: ["Ракета", "Пера", "Конуси"],
    coachFeedRequired: false,
    isHomeFriendly: false,
    intensity: 2,
    complexityLevel: 2,
    focusTags: ["Сервис", "Флик", "Игрова вариация"],
  }),
  buildTextbookExercise("serve-receive", "apply", {
    name: "Ситуация 20–20: Сервис + Атака на посрещането (Първи 3 удара)",
    description:
      "По двойки: разиграват се само първите 3 удара (Сервис → Посрещане → 3-ти удар) при психологически сценарий 20–20. Изгражда увереност и инициатива в началото на точката.",
    category: "tactics",
    phase: "main-tact",
    location: ["court"],
    ageGroups: OLDER_AGES,
    durationMinutes: 12,
    dosageText: "5 мини-сета по 5 точки (смяна на сервиращия)",
    equipment: ["Ракета", "Пера"],
    coachFeedRequired: false,
    isHomeFriendly: false,
    intensity: 3,
    complexityLevel: 4,
    focusTags: ["Сервис", "Посрещане", "Първи 3 удара"],
  }),

  // =========================================================================
  // ГЛАВА 7: КЛИЪР
  // =========================================================================
  buildTextbookExercise("clear", "learn", {
    name: "Фундамент: „Стрелец с лък“ — Висок форхенд клиър от 3/4 корт",
    description:
      "Изграждане на правилната кинетична верига над глава (странична стойка → висок лакът → пронация пред рамото → пълен завършек) от скъсена дистанция.",
    category: "technique",
    phase: "main-tech",
    location: ["court"],
    ageGroups: ALL_AGES,
    durationMinutes: 12,
    dosageText: "3 × 12 клиъра по двойки",
    equipment: ["Ракета", "Пера"],
    coachFeedRequired: false,
    isHomeFriendly: false,
    intensity: 2,
    complexityLevel: 2,
    focusTags: ["Клиър", "Удар над глава", "Пронация"],
  }),
  buildTextbookExercise("clear", "consolidate", {
    name: "Игра за клиър: „Задна крепост“ (20 поредни в задната зона)",
    description:
      "Кооперативна игра по двойки: перото трябва да пада единствено в последния 1.5 м на корта (между задната линия и конусите). Цел: 20 последователни удара без грешка.",
    category: "games",
    phase: "main-tech",
    location: ["court"],
    ageGroups: ALL_AGES,
    durationMinutes: 12,
    dosageText: "2 × 5 мин. (рекорд на двойката)",
    equipment: ["Ракета", "Пера", "Конуси"],
    coachFeedRequired: false,
    isHomeFriendly: false,
    intensity: 3,
    complexityLevel: 2,
    focusTags: ["Клиър", "Дълбочина", "Игрова вариация"],
  }),
  buildTextbookExercise("clear", "apply", {
    name: "Атакуващ vs Защитен клиър (Прав и Диагонал)",
    description:
      "Тактическо редуване на висок защитен клиър (когато си под напрежение) и плосък атакуващ клиър по диагонала (когато стигнеш рано зад перото).",
    category: "tactics",
    phase: "main-tact",
    location: ["court"],
    ageGroups: OLDER_AGES,
    durationMinutes: 12,
    dosageText: "3 × 2 мин. рали с преброяване на печеливши атакуващи клиъри",
    equipment: ["Ракета", "Пера"],
    coachFeedRequired: false,
    isHomeFriendly: false,
    intensity: 4,
    complexityLevel: 4,
    focusTags: ["Атакуващ клиър", "Тактика", "Рали"],
  }),

  // =========================================================================
  // ГЛАВА 8: ДРОП И СМАШ
  // =========================================================================
  buildTextbookExercise("drop-smash", "learn", {
    name: "Фундамент: „Еднаква маска“ — Клиър + Дроп в предна мишена",
    description:
      "Редуване на 1 висок клиър и 1 бавен дроп шот със 100% еднаква начална подготовка над глава. Цел: дропът да каца пред линията за сервис.",
    category: "technique",
    phase: "main-tech",
    location: ["court"],
    ageGroups: ALL_AGES,
    durationMinutes: 12,
    dosageText: "3 × 10 комбинации (Клиър → Дроп)",
    equipment: ["Ракета", "Пера", "Конуси"],
    coachFeedRequired: false,
    isHomeFriendly: false,
    intensity: 2,
    complexityLevel: 2,
    focusTags: ["Дроп", "Децепция", "Удар над глава"],
  }),
  buildTextbookExercise("drop-smash", "consolidate", {
    name: "Атакуваща комбинация: Смаш → Добиване на мрежата",
    description:
      "От задна линия състезателят изпълнява стръмен смаш по правата и веднага излиза напред с 2 крачки, за да довърши блока на защитника на мрежата.",
    category: "tactics",
    phase: "main-tact",
    location: ["court"],
    ageGroups: OLDER_AGES,
    durationMinutes: 12,
    dosageText: "3 × 8 серии (смяна атакуващ ↔ защитник)",
    equipment: ["Ракета", "Пера"],
    coachFeedRequired: false,
    isHomeFriendly: false,
    intensity: 4,
    complexityLevel: 3,
    focusTags: ["Смаш", "Добиване", "Преход напред"],
  }),
  buildTextbookExercise("drop-smash", "apply", {
    name: "Мултифийд атака: 15 пера Смаш / Крос-дроп (Треньорски корт)",
    description:
      "Високоинтензивна серия с подаване от треньора: редуване на прав смаш, диагонален смаш и бърз крос-дроп с фокус върху ъгъла и точността под умора.",
    category: "tactics",
    phase: "main-tact",
    location: ["court"],
    ageGroups: ["U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 12,
    dosageText: "3 × 15 пера / 60 сек. почивка (ротация на корта)",
    equipment: ["Ракета", "Пера", "Кош с пера"],
    coachFeedRequired: true,
    isHomeFriendly: false,
    intensity: 5,
    complexityLevel: 4,
    focusTags: ["Смаш", "Крос-дроп", "Мултифийд"],
  }),

  // =========================================================================
  // ГЛАВА 9: ЗАЩИТА, ДРАЙВ И КОНТРААТАКА
  // =========================================================================
  buildTextbookExercise("defense-drive", "learn", {
    name: "Фундамент: „Вратар“ — Ниска бекхенд защита пред тялото",
    description:
      "От ниска широка стойка с бекхенд хват състезателят блокира меко подадени полу-смашове директно пред тялото, без да замахва назад.",
    category: "technique",
    phase: "main-tech",
    location: ["court"],
    ageGroups: ALL_AGES,
    durationMinutes: 10,
    dosageText: "3 × 12 блока (смяна атакуващ ↔ защитник)",
    equipment: ["Ракета", "Пера"],
    coachFeedRequired: false,
    isHomeFriendly: false,
    intensity: 2,
    complexityLevel: 2,
    focusTags: ["Защита", "Бекхенд хват", "Блок"],
  }),
  buildTextbookExercise("defense-drive", "consolidate", {
    name: "Игра за драйв: Плоско рали „Не пускай под мрежата“",
    description:
      "Двама играчи в средата на корта играят бързи плоски драйв удари на височината на гърдите. Печели двойката с най-дълга серия без повдигане на високо перо.",
    category: "games",
    phase: "main-tech",
    location: ["court"],
    ageGroups: ALL_AGES,
    durationMinutes: 10,
    dosageText: "4 × 45 сек. (броене на най-дългата серия)",
    equipment: ["Ракета", "Пера"],
    coachFeedRequired: false,
    isHomeFriendly: false,
    intensity: 3,
    complexityLevel: 2,
    focusTags: ["Драйв", "Рефлекс", "Игрова вариация"],
  }),
  buildTextbookExercise("defense-drive", "apply", {
    name: "Контраатака 1 срещу 2: Защита → Блок или Плосък контра-драйв",
    description:
      "Един защитник посреща атаки от двама съотборници (или треньорски мултифийд) и избира между къс блок на мрежата и плосък драйв в празното пространство.",
    category: "tactics",
    phase: "main-tact",
    location: ["court"],
    ageGroups: OLDER_AGES,
    durationMinutes: 12,
    dosageText:
      "3 × 45 сек. на защитник (ротация в тройката — идеално за 2v1!)",
    equipment: ["Ракета", "Пера"],
    coachFeedRequired: false,
    isHomeFriendly: false,
    intensity: 4,
    complexityLevel: 4,
    focusTags: ["Защита", "Контраатака", "2v1 ротация"],
  }),

  // =========================================================================
  // ГЛАВА 10: ЗАГРЯВКА (ТОЧНИ СЕРИИ × ПОВТОРЕНИЯ) И РАЗТОВАРВАНЕ
  // =========================================================================
  buildTextbookExercise("warmup-cooldown", "learn", {
    name: "Загрявка 1 (Raise): Леко бягане, шасе и кръстосана стъпка",
    description:
      "Повишаване на пулса и телесната температура по периметъра на кортовете: 2 мин. леко бягане + 1 мин. странично шасе и кръстосана стъпка.",
    category: "warmup",
    phase: "warmup",
    location: ["court"],
    ageGroups: ALL_AGES,
    durationMinutes: 3,
    dosageText: "2 мин. бягане + 1 мин. шасе / кръстосана стъпка",
    equipment: [],
    coachFeedRequired: false,
    isHomeFriendly: true,
    intensity: 2,
    complexityLevel: 1,
    focusTags: ["Загрявка", "RAMP Raise", "Кардио"],
  }),
  buildTextbookExercise("warmup-cooldown", "learn", {
    name: "Загрявка 2 (Мобилност горна част): Рамене, лакти и китки",
    description:
      "Динамично ставно раздвижване на горния пояс за предпазване на ротаторния маншон: кръгове с рамене напред/назад, махове с ръце, въртене в лакти и китки.",
    category: "warmup",
    phase: "warmup",
    location: ["court"],
    ageGroups: ALL_AGES,
    durationMinutes: 4,
    dosageText: "Рамене: 3 × 10 кръга напред/назад • Лакти и китки: 2 × 12",
    equipment: [],
    coachFeedRequired: false,
    isHomeFriendly: true,
    intensity: 1,
    complexityLevel: 1,
    injuryPreventionFocus: "shoulder",
    focusTags: ["Загрявка", "Рамене", "Превенция"],
  }),
  buildTextbookExercise("warmup-cooldown", "learn", {
    name: "Загрявка 3 (Мобилност долна част): Кръст, таз, колене и глезени",
    description:
      "Динамична подготовка за напади и сплит степ: завъртания на кръст, отваряне на тазобедрени стави, леки напади напред с ротация, колене и глезени.",
    category: "warmup",
    phase: "warmup",
    location: ["court"],
    ageGroups: ALL_AGES,
    durationMinutes: 4,
    dosageText: "Кръст: 2 × 10 на страна • Напади: 2 × 8 • Глезени: 2 × 10",
    equipment: [],
    coachFeedRequired: false,
    isHomeFriendly: true,
    intensity: 2,
    complexityLevel: 1,
    injuryPreventionFocus: "knee",
    focusTags: ["Загрявка", "Кръст", "Колене", "Глезени"],
  }),
  buildTextbookExercise("warmup-cooldown", "consolidate", {
    name: "Загрявка 4А (Вариант U9–U11): Игра за реакция „Опашки“ / „Светофар“",
    description:
      "Весела активационна игра за малките състезатели в края на загрявката: бързи смени на посоката, старт/стоп на сигнал и ниска стойка без ракета.",
    category: "warmup",
    phase: "warmup",
    location: ["court"],
    ageGroups: ["U9", "U11"],
    durationMinutes: 4,
    dosageText: "4 мин. (2 рунда × 90 сек. игра)",
    equipment: ["Конуси"],
    coachFeedRequired: false,
    isHomeFriendly: false,
    intensity: 3,
    complexityLevel: 1,
    focusTags: ["Загрявка", "Активация U9–U11", "Игра"],
  }),
  buildTextbookExercise("warmup-cooldown", "consolidate", {
    name: "Загрявка 4Б (Вариант U13+): Динамичен сплит степ и кратки ускорения",
    description:
      "Специална бадминтон активация за по-големи състезатели: 4 × 30 сек. експлозивен сплит степ, странични ускорения между линиите и динамични напади.",
    category: "warmup",
    phase: "warmup",
    location: ["court"],
    ageGroups: OLDER_AGES,
    durationMinutes: 4,
    dosageText: "4 × 30 сек. работа / 20 сек. пауза",
    equipment: ["Конуси"],
    coachFeedRequired: false,
    isHomeFriendly: true,
    intensity: 3,
    complexityLevel: 2,
    focusTags: ["Загрявка", "Активация U13+", "Сплит степ"],
  }),
  buildTextbookExercise("warmup-cooldown", "learn", {
    name: "Заключително разтоварване: Дишане и BWF статичен стречинг",
    description:
      "Постепенно успокояване на пулса (1 мин. бавно ходене) + статично разтягане без пружиниране за прасци, квадрицепс, задно бедро, раменен пояс и предмишница.",
    category: "cooldown",
    phase: "cooldown",
    location: ["court"],
    ageGroups: ALL_AGES,
    durationMinutes: 6,
    dosageText:
      "По 25–30 сек. задържане на всяка мускулна група (2 мин. дишане + 4 мин. стречинг)",
    equipment: [],
    coachFeedRequired: false,
    isHomeFriendly: true,
    intensity: 1,
    complexityLevel: 1,
    injuryPreventionFocus: "achilles",
    focusTags: ["Разпускане", "Стречинг", "Възстановяване"],
  }),
];

/**
 * Автоматично определя най-подходящия BWF фундамент и за по-стари/потребителски упражнения
 * без изрично зададен `fundamentalId`, за да няма „сираци“ в Учебника и Генератора.
 */
export function inferFundamentalId(
  ex: Pick<
    Exercise,
    "fundamentalId" | "name" | "category" | "focusTags" | "phase"
  >
): FundamentalId {
  if (ex.fundamentalId) return ex.fundamentalId;

  const text = `${ex.name} ${(ex.focusTags || []).join(" ")}`.toLowerCase();
  if (
    ex.category === "warmup" ||
    ex.category === "cooldown" ||
    ex.phase === "warmup" ||
    ex.phase === "cooldown"
  ) {
    return "warmup-cooldown";
  }
  if (
    text.includes("хват") ||
    text.includes("grip") ||
    text.includes("жонглир")
  ) {
    return "grips";
  }
  if (
    text.includes("сплит") ||
    text.includes("split") ||
    text.includes("стойка") ||
    text.includes("старт")
  ) {
    return "split-step";
  }
  if (
    text.includes("бекхенд") &&
    (text.includes("мреж") ||
      text.includes("напред") ||
      text.includes("изтегл"))
  ) {
    return "front-backhand";
  }
  if (
    text.includes("мреж") ||
    text.includes("напред") ||
    text.includes("изтегл") ||
    text.includes("lift") ||
    text.includes("net") ||
    text.includes("добив")
  ) {
    return "front-forehand";
  }
  if (
    text.includes("ножиц") ||
    text.includes("scissor") ||
    text.includes("назад") ||
    text.includes("6 ъгъл") ||
    text.includes("footwork")
  ) {
    return "rear-footwork";
  }
  if (
    text.includes("сервис") ||
    text.includes("serve") ||
    text.includes("посрещ")
  ) {
    return "serve-receive";
  }
  if (text.includes("клиър") || text.includes("clear")) {
    return "clear";
  }
  if (
    text.includes("смаш") ||
    text.includes("смеш") ||
    text.includes("smash") ||
    text.includes("дроп") ||
    text.includes("drop")
  ) {
    return "drop-smash";
  }
  if (
    text.includes("защит") ||
    text.includes("драйв") ||
    text.includes("drive") ||
    text.includes("блок")
  ) {
    return "defense-drive";
  }
  return "split-step";
}

/**
 * Връща пълната 5-блокова треньорска методология за всяко упражнение
 * (собствената му или тази на неговата BWF глава).
 */
export function getExerciseMethodology(ex: Exercise): CoachMethodology {
  if (ex.methodology) return ex.methodology;
  const fid = inferFundamentalId(ex);
  return getFundamentalChapter(fid)!.methodology;
}

export function getExerciseCourtDiagram(ex: Exercise): DrillCourtDiagramData {
  if (ex.courtDiagram) return ex.courtDiagram;
  const fid = inferFundamentalId(ex);
  return getFundamentalChapter(fid)!.defaultDiagram;
}
