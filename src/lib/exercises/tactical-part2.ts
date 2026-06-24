import { Exercise } from "@/types/planner.types";

export const TACTICAL_EXERCISES_PART2: Omit<
  Exercise,
  "id" | "siteId" | "createdAt" | "updatedAt"
>[] = [
  {
    name: "Двойки: Атака в центъра (Smash down the middle)",
    description:
      "Тактика за объркване на защитата при двойки. Смашът се насочва точно по средната линия между двамата играчи, за да предизвика колебание кой трябва да удари.",
    category: "tactical",
    source: "BWF Doubles Specific",
    location: ["indoor"],
    ageGroups: ["U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 15,
    equipment: "Пера",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+doubles+smash+down+the+middle+tactics",
  },
  {
    name: "Смесени двойки: Изолиране на жената",
    description:
      "Противниците умишлено играят само към жената в задната част на корта (чрез високи лифтове), за да предотвратят атаката на мъжа.",
    category: "tactical",
    source: "Badminton Europe",
    location: ["indoor"],
    ageGroups: ["U17", "U19", "Мъже и Жени"],
    durationMinutes: 20,
    equipment: "Корт",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+mixed+doubles+tactics+isolate+woman",
  },
  {
    name: "Сингъл: V-образно движение (V-Front)",
    description:
      "Треньорът подава само в двата предни ъгъла (къси пера). Играчът тръгва от центъра, играе на мрежата, връща се в центъра. Много изморително.",
    category: "tactical",
    source: "BWF Level 2",
    location: ["indoor"],
    ageGroups: ["U13", "U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 15,
    equipment: "Пера",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+singles+v+front+movement",
  },
  {
    name: "Сингъл: V-образно движение (V-Back)",
    description:
      "Същото като V-Front, но треньорът подава само в двата задни ъгъла (високи клиърове). Тренира отстъплението назад.",
    category: "tactical",
    source: "BWF Level 2",
    location: ["indoor"],
    ageGroups: ["U13", "U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 15,
    equipment: "Пера",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+singles+v+back+movement",
  },
  {
    name: "Двойки: Контрол на мрежата (Net Control)",
    description:
      "Играчът на мрежата (Front) има за цел да прихване всеки възможен драйв или слаб дроп, без да оставя перото да стигне до партньора му отзад.",
    category: "tactical",
    source: "Badminton Asia",
    location: ["indoor"],
    ageGroups: ["U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 15,
    equipment: "Пера",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+doubles+net+control+interception",
  },
  {
    name: "Сингъл: Игра само на права (Straight Line Drill)",
    description:
      "И двамата играчи имат право да играят само по правата (без диагонали). Който изиграе диагонал, губи точката. Учи на търпение и дълбочина.",
    category: "tactical",
    source: "Национални методики",
    location: ["indoor"],
    ageGroups: ["U13", "U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 15,
    equipment: "Корт",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+singles+straight+line+drill",
  },
  {
    name: "Сингъл: Игра само по диагонал (Cross Court Drill)",
    description:
      "И двамата играчи имат право да играят само по диагонала. Развива специфичната работа с крака (footwork) за покриване на най-дългото разстояние на корта.",
    category: "tactical",
    source: "Национални методики",
    location: ["indoor"],
    ageGroups: ["U13", "U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 15,
    equipment: "Корт",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+singles+cross+court+drill",
  },
  {
    name: "Двойки: Скриване на сервиса",
    description:
      "Сервиращият използва тялото на партньора си (който стои точно пред него), за да скрие момента на удара при сервиса от посрещащия.",
    category: "tactical",
    source: "BWF High Performance",
    location: ["indoor"],
    ageGroups: ["U17", "U19", "Мъже и Жени"],
    durationMinutes: 10,
    equipment: "Пера",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+doubles+hiding+the+serve",
  },
  {
    name: "Смесени двойки: Атака срещу мъжа",
    description:
      "Тактика, при която двойката умишлено избягва жената на мрежата и играе бързи, плоски удари само към мъжа отзад, за да го измори.",
    category: "tactical",
    source: "Badminton Europe",
    location: ["indoor"],
    ageGroups: ["U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 20,
    equipment: "Пера",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+mixed+doubles+attack+the+man",
  },
  {
    name: "Сингъл: 3 точки бонус за смаш",
    description:
      "Тренировъчен мач. Всяка нормална точка носи 1 т., но ако точката бъде спечелена с директен Smash (Winner), тя носи 3 точки. Насърчава агресивната игра.",
    category: "tactical",
    source: "Спортна физиология",
    location: ["indoor"],
    ageGroups: ["U13", "U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 20,
    equipment: "Корт",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+smash+winner+drill+points",
  },
  {
    name: "Двойки: Защита 3 срещу 2",
    description:
      "Трима играчи от едната страна на корта атакуват непрекъснато двама защитници от другата. Двамата защитници са подложени на екстремен натиск.",
    category: "tactical",
    source: "Badminton Asia",
    location: ["indoor"],
    ageGroups: ["U17", "U19", "Мъже и Жени"],
    durationMinutes: 15,
    equipment: "Корт, пера",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+3+vs+2+defense+drill",
  },
  {
    name: "Сингъл: 1 минута оцеляване",
    description:
      "Треньорът подава пера с много високо темпо (мулти-фийд) в продължение на 1 минута. Играчът не може да спира. Тренира тактически решения под огромна умора.",
    category: "tactical",
    source: "BWF High Performance",
    location: ["indoor"],
    ageGroups: ["U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 15,
    equipment: "Кош с пера",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+1+minute+survival+multi+shuttle",
  },
  {
    name: "Отваряне на корта със Slice",
    description:
      "Използване на Slice Drop (нарязан дроп) от форхенд, за да падне перото стръмно към мрежата и да принуди противника да направи слаб Lift.",
    category: "tactical",
    source: "BWF Level 3",
    location: ["indoor"],
    ageGroups: ["U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 15,
    equipment: "Пера",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+slice+drop+tactics",
  },
  {
    name: "Сингъл: Отбранителен мач",
    description:
      "Единият играч има право САМО да се защитава (Clears, Lifts). Няма право да атакува. Целта е да спечели точка само чрез грешки на противника.",
    category: "tactical",
    source: "Национални методики",
    location: ["indoor"],
    ageGroups: ["U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 20,
    equipment: "Корт",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+singles+defensive+match+tactics",
  },
  {
    name: "Двойки: Short Lift Punishment",
    description:
      "Ако двойката в защита направи 'къс лифт' (перото не стигне до задната линия), нападателите трябва моментално да забият безкомпромисен смаш.",
    category: "tactical",
    source: "Badminton Europe",
    location: ["indoor"],
    ageGroups: ["U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 15,
    equipment: "Пера",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+doubles+punish+short+lift",
  },
  {
    name: "Смесени двойки: Четири ъгъла",
    description:
      "Мъжът и жената отработват покриването на корта: Жената играе в предните два ъгъла, мъжът - в задните два. Стриктно разпределение.",
    category: "tactical",
    source: "BWF Shuttle Time",
    location: ["indoor"],
    ageGroups: ["U13", "U15", "U17"],
    durationMinutes: 15,
    equipment: "Корт",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+mixed+doubles+4+corners",
  },
  {
    name: "Сингъл: Lift to the Forehand",
    description:
      "Тактическо решение да се вдигне перото дълбоко към форхенда на противника (вместо към бекхенда), защото някои играчи имат слаб форхенд клиър.",
    category: "tactical",
    source: "BWF Level 3",
    location: ["indoor"],
    ageGroups: ["U17", "U19", "Мъже и Жени"],
    durationMinutes: 10,
    equipment: "Пера",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+singles+tactics+lift+to+forehand",
  },
  {
    name: "Двойки: Сервис и стъпка назад",
    description:
      "След къс сервис, играчът прави половин стъпка назад, за да е готов за бърз Push от посрещащия. Предпазва от удари в лицето.",
    category: "tactical",
    source: "Спортна физиология",
    location: ["indoor"],
    ageGroups: ["U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 15,
    equipment: "Пера",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+doubles+serve+recovery+step",
  },
  {
    name: "Сингъл: Контрол на темпото (Pacing)",
    description:
      "Играчът се учи кога да забави играта (чрез високи клиърове) и кога да я ускори (чрез плоски драйвове), за да разбие ритъма на противника.",
    category: "tactical",
    source: "Badminton Asia",
    location: ["indoor"],
    ageGroups: ["U17", "U19", "Мъже и Жени"],
    durationMinutes: 20,
    equipment: "Корт",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+singles+pacing+control+tempo",
  },
  {
    name: "Смесени двойки: Защита на жената",
    description:
      "Треньорът атакува жената (която е на мрежата) с плоски драйвове. Тя трябва да се научи да отбягва перото (duck), за да го остави на мъжа зад нея.",
    category: "tactical",
    source: "BWF High Performance",
    location: ["indoor"],
    ageGroups: ["U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 15,
    equipment: "Кош с пера",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+mixed+doubles+woman+ducking+drive",
  },
];
