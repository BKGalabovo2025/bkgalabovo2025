import { Exercise } from "@/types/planner.types";

export const MENTAL_EXERCISES_PART2: Omit<
  Exercise,
  "id" | "siteId" | "createdAt" | "updatedAt"
>[] = [
  {
    name: "Двойки: Тих мач (Silent Match)",
    description:
      "Партньорите играят мач, но имат абсолютна забрана да си говорят или да използват знаци с ръце. Тренира интуитивната комуникация и усета за позицията на другия.",
    category: "mental",
    source: "BWF High Performance",
    location: ["indoor"],
    ageGroups: ["U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 20,
    equipment: "Корт",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+silent+match+doubles+communication",
  },
  {
    name: "Фокус: Броене на перата",
    description:
      "Треньорът подава пера с много висока скорост. Играчът не само трябва да ги върне, но и да брои на глас колко пера е ударил. Разпределя вниманието (Multitasking).",
    category: "mental",
    source: "Спортна психология",
    location: ["indoor"],
    ageGroups: ["U13", "U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 10,
    equipment: "Кош с пера",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+multitasking+focus+drill",
  },
  {
    name: "Симулация: Шумна публика",
    description:
      "Играе се тренировъчен мач, докато от мощни колони се пуска звук на скандираща публика или вувузели. Играчите се учат да блокират външните стимули.",
    category: "mental",
    source: "Национални методики",
    location: ["indoor"],
    ageGroups: ["U17", "U19", "Мъже и Жени"],
    durationMinutes: 20,
    equipment: "Аудио система",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+crowd+noise+simulation+mental+training",
  },
  {
    name: "Рестартиране на мозъка (Mind Reset)",
    description:
      "Обучение на рутина след загубена точка: 1) Обръщане с гръб към мрежата, 2) Поемане на въздух, 3) Наместване на кордажа, 4) Връщане в позиция.",
    category: "mental",
    source: "BWF Level 3",
    location: ["indoor", "outdoor"],
    ageGroups: ["U11", "U13", "U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 5,
    equipment: "Няма",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+mental+reset+routine+between+points",
  },
  {
    name: "Сингъл: Топката не пада",
    description:
      "Ментален договор с играча: 'В следващите 5 минути нямаш право да оставиш нито едно перо да падне на земята, дори и да е аут.' Изкоренява мързела и отказването.",
    category: "mental",
    source: "Badminton Asia",
    location: ["indoor"],
    ageGroups: ["U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 10,
    equipment: "Корт",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+never+give+up+mentality+drill",
  },
  {
    name: "Мач с грешна ръка (Non-dominant Hand)",
    description:
      "Играчите играят мач с лявата ръка (ако са десничари). Помага за изграждане на нови невронни връзки, забавяне и контрол на емоциите при безсилие.",
    category: "mental",
    source: "Спортна физиология",
    location: ["indoor"],
    ageGroups: ["U9", "U11", "U13", "U15"],
    durationMinutes: 15,
    equipment: "Ракета",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+playing+with+weak+hand",
  },
  {
    name: "Сингъл: Пълен обрат (Comeback drill)",
    description:
      "Мачът започва при резултат 5:18. Играчът с 5 точки има за цел да стигне поне до 15. Тренира се мисленето 'Точка за точка', без да се гледа крайното табло.",
    category: "mental",
    source: "BWF High Performance",
    location: ["indoor"],
    ageGroups: ["U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 20,
    equipment: "Корт",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+comeback+mentality+drill",
  },
  {
    name: "Затваряне на мача (Closing the Game)",
    description:
      "Симулация от 20:16. Играчът, който води, има 'Match Point'. Целта е да се научи да не се отпуска и да не играе прекалено пасивно или прекалено агресивно.",
    category: "mental",
    source: "Badminton Europe",
    location: ["indoor"],
    ageGroups: ["U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 10,
    equipment: "Корт",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+closing+the+match+point",
  },
  {
    name: "Позитивен вътрешен монолог (Self-Talk)",
    description:
      "След всяка точка, играчът е задължен да каже на глас една позитивна фраза ('Добре се позиционирах', 'Добър опит'), дори и да е сгрешил. Стопира негативната спирала.",
    category: "mental",
    source: "Спортна психология",
    location: ["indoor", "outdoor"],
    ageGroups: ["U13", "U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 15,
    equipment: "Няма",
    videoUrl:
      "https://www.youtube.com/results?search_query=positive+self+talk+sports+psychology",
  },
  {
    name: "Симулация на умора: Тежки крака",
    description:
      "Играчът носи жилетка с тежести 20 минути преди мача. Непосредствено преди началото я сваля. Създава се илюзия за 'леки крака' и повишава увереността.",
    category: "mental",
    source: "Национални методики",
    location: ["indoor"],
    ageGroups: ["U17", "U19", "Мъже и Жени"],
    durationMinutes: 10,
    equipment: "Жилетка с тежести",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+weight+vest+training+psychology",
  },
  {
    name: "Shadow със завързани очи (Blind Shadow)",
    description:
      "Играчът слага превръзка на очите и изпълнява 6-точково движение по корта (shadow). Развива кинестетичен интелект и пространствена ориентация (proprioception).",
    category: "mental",
    source: "Спортна физиология",
    location: ["indoor"],
    ageGroups: ["U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 10,
    equipment: "Превръзка за очи",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+blindfold+shadow+footwork",
  },
  {
    name: "Анализ на грешките (Video Review)",
    description:
      "Психологическа сесия. Играчите гледат запис на техен загубен мач заедно с треньора. Целта е да анализират тактически, а не емоционално, и да премахнат егото.",
    category: "mental",
    source: "BWF High Performance",
    location: ["indoor"],
    ageGroups: ["U13", "U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 30,
    equipment: "Видео проектор/Екран",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+video+analysis+tactics",
  },
  {
    name: "Мач без прекъсвания (No Break Match)",
    description:
      "Играе се цял мач 2 от 3 гейма, но са забранени почивките на 11 точки и между геймовете. Играчът е принуден да намира решения докато е физически унищожен.",
    category: "mental",
    source: "Badminton Asia",
    location: ["indoor"],
    ageGroups: ["U17", "U19", "Мъже и Жени"],
    durationMinutes: 45,
    equipment: "Корт",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+stamina+no+break+match",
  },
  {
    name: "Игра срещу 'Стената'",
    description:
      "Играчът играе срещу треньор, който е 'Стената' - не атакува, но връща абсолютно всяко перо в игра. Тренира търпението и липсата на излишно бързане.",
    category: "mental",
    source: "BWF Level 2",
    location: ["indoor"],
    ageGroups: ["U13", "U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 15,
    equipment: "Корт",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+playing+against+the+wall+defense",
  },
  {
    name: "Фокус на една точка (Point of Focus)",
    description:
      "Преди сервис, играчът гледа точно една точка на корка на перото за 2 секунди. Тази микро-медитация помага за изчистване на мислите преди удара.",
    category: "mental",
    source: "Спортна психология",
    location: ["indoor"],
    ageGroups: ["U11", "U13", "U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 5,
    equipment: "Перо",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+focus+serve+routine",
  },
];
