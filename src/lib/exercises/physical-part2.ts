import { Exercise } from "@/types/planner.types";

export const PHYSICAL_EXERCISES_PART2: Omit<
  Exercise,
  "id" | "siteId" | "createdAt" | "updatedAt"
>[] = [
  {
    name: "Педя по педя (Inchworm)",
    description:
      "Навеждане от стоеж към пода, ходене на ръце до лицева опора и събиране на краката към ръцете. Разтяга задното бедро и натоварва ядрото.",
    category: "physical",
    source: "Спортна физиология",
    location: ["indoor", "outdoor"],
    ageGroups: ["U11", "U13", "U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 10,
    equipment: "Няма",
    videoUrl:
      "https://www.youtube.com/results?search_query=inchworm+exercise+badminton",
  },
  {
    name: "Дълги скокове на един крак (Single Leg Broad Jumps)",
    description:
      "Скок напред от един крак и приземяване на същия крак. Страхотно за развитие на мощ в глезена за нападателни удари.",
    category: "physical",
    source: "BWF High Performance",
    location: ["indoor", "outdoor"],
    ageGroups: ["U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 15,
    equipment: "Няма",
    videoUrl:
      "https://www.youtube.com/results?search_query=single+leg+broad+jump+badminton",
  },
  {
    name: "Спринт с теглене на шейна (Sled Pushes/Pulls)",
    description:
      "Бутане или теглене на тежка шейна (prowler) на късо разстояние. Развива брутална сила в долната част на тялото.",
    category: "physical",
    source: "Национални методики",
    location: ["indoor", "outdoor"],
    ageGroups: ["U19", "Мъже и Жени"],
    durationMinutes: 20,
    equipment: "Тренировъчна шейна, тежести",
    videoUrl:
      "https://www.youtube.com/results?search_query=sled+push+badminton+strength",
  },
  {
    name: "Клек със скок (Squat Jumps)",
    description:
      "Експлозивно скачане от позиция на дълбок клек. Приземяването е меко. Изгражда вертикален отскок за Jump Smash.",
    category: "physical",
    source: "BWF Level 2 Physical",
    location: ["indoor", "outdoor"],
    ageGroups: ["U13", "U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 10,
    equipment: "Няма",
    videoUrl:
      "https://www.youtube.com/results?search_query=squat+jumps+badminton",
  },
  {
    name: "Разтягане на рамене с ластик (Shoulder Dislocates)",
    description:
      "Преминаване на дълг ластик или тояжка над главата назад и напред с изпънати ръце. Предпазва рамото от травми.",
    category: "physical",
    source: "Badminton Europe",
    location: ["indoor", "outdoor"],
    ageGroups: ["U11", "U13", "U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 5,
    equipment: "Ластик или тояжка",
    videoUrl:
      "https://www.youtube.com/results?search_query=shoulder+dislocates+badminton+mobility",
  },
  {
    name: "Medicine Ball Slams",
    description:
      "Медицинската топка се вдига високо над главата и експлозивно се забива в земята. Симулира механиката на Smash.",
    category: "physical",
    source: "BWF High Performance",
    location: ["indoor", "outdoor"],
    ageGroups: ["U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 15,
    equipment: "Медицинска топка (тежка, не отскачаща)",
    videoUrl:
      "https://www.youtube.com/results?search_query=medicine+ball+slams+badminton",
  },
  {
    name: "Кръгове с пудовка около кръста (Kettlebell Slingshots)",
    description:
      "Подаване на пудовка от ръка в ръка около кръста възможно най-бързо. Заздравява коремния пояс.",
    category: "physical",
    source: "Спортна физиология",
    location: ["indoor"],
    ageGroups: ["U17", "U19", "Мъже и Жени"],
    durationMinutes: 10,
    equipment: "Пудовка",
    videoUrl:
      "https://www.youtube.com/results?search_query=kettlebell+slingshot+core",
  },
  {
    name: "Скачане на въже (Ali Shuffle)",
    description:
      "Скачане на въже с редуване на краката напред-назад (като Мохамед Али). Идеално за баланс при split step.",
    category: "physical",
    source: "Badminton Asia",
    location: ["indoor", "outdoor"],
    ageGroups: ["U13", "U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 15,
    equipment: "Въже за скачане",
    videoUrl:
      "https://www.youtube.com/results?search_query=jump+rope+ali+shuffle+badminton",
  },
  {
    name: "Динамичен планк (Plank Jacks)",
    description:
      "В позиция на планк краката отскачат встрани и се събират. Комбинира кардио и коремна стабилност.",
    category: "physical",
    source: "Национални методики",
    location: ["indoor", "outdoor"],
    ageGroups: ["U13", "U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 10,
    equipment: "Постелка",
    videoUrl:
      "https://www.youtube.com/results?search_query=plank+jacks+badminton+core",
  },
  {
    name: "Skater Jumps (Кънкьорски скокове)",
    description:
      "Страничен скок от единия на другия крак с приклякване. Развива страничната експлозивност, критична за бадминтона.",
    category: "physical",
    source: "BWF Level 3",
    location: ["indoor", "outdoor"],
    ageGroups: ["U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 15,
    equipment: "Няма",
    videoUrl:
      "https://www.youtube.com/results?search_query=skater+jumps+badminton+agility",
  },
  {
    name: "Shadow 30 секунди ON / 30 OFF",
    description:
      "Интервална тренировка за специфична издръжливост. 30 секунди максимално бърз shadow badminton, следвано от 30 секунди почивка. 10 серии.",
    category: "physical",
    source: "Badminton Europe",
    location: ["indoor"],
    ageGroups: ["U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 20,
    equipment: "Корт",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+shadow+intervals+30+30",
  },
  {
    name: "Упражнение 'Глутеус Мост' на един крак (Single Leg Glute Bridge)",
    description:
      "Лег по гръб, повдигане на таза нагоре само с един крак. Предпазва коленете чрез засилване на задните мускули.",
    category: "physical",
    source: "Спортна физиология",
    location: ["indoor", "outdoor"],
    ageGroups: ["U13", "U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 10,
    equipment: "Постелка",
    videoUrl:
      "https://www.youtube.com/results?search_query=single+leg+glute+bridge+badminton",
  },
  {
    name: "Стълбичка - Два крака напред (Two Foot Run)",
    description:
      "И двата крака стъпват във всяко квадратче на стълбичката възможно най-бързо. Учи на висока честота на стъпките.",
    category: "physical",
    source: "BWF Shuttle Time",
    location: ["indoor", "outdoor"],
    ageGroups: ["U9", "U11", "U13", "U15", "U17", "U19"],
    durationMinutes: 10,
    equipment: "Координационна стълбичка",
    videoUrl:
      "https://www.youtube.com/results?search_query=agility+ladder+two+foot+run",
  },
  {
    name: "Обиколки около корт с патешко ходене",
    description:
      "Тежко натоварване за краката. Играчите приклякат дълбоко и се придвижват напред около корта. Развива сила в квадрицепса.",
    category: "physical",
    source: "Национални методики",
    location: ["indoor"],
    ageGroups: ["U15", "U17", "U19"],
    durationMinutes: 10,
    equipment: "Корт",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+duck+walk+leg+strength",
  },
  {
    name: "Вдигане на крака от вис (Hanging Leg Raises)",
    description:
      "Хват на лост, повдигане на изпънатите крака до лоста. Най-доброто упражнение за долен корем.",
    category: "physical",
    source: "BWF High Performance",
    location: ["indoor", "outdoor"],
    ageGroups: ["U17", "U19", "Мъже и Жени"],
    durationMinutes: 15,
    equipment: "Лост за набиране",
    videoUrl:
      "https://www.youtube.com/results?search_query=hanging+leg+raises+core",
  },
  {
    name: "Хвърляне на медицинска топка над глава назад",
    description:
      "Хваща се топката, прави се лек клек и се хвърля експлозивно назад през главата. Развива задната верига.",
    category: "physical",
    source: "Спортна физиология",
    location: ["indoor", "outdoor"],
    ageGroups: ["U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 10,
    equipment: "Медицинска топка",
    videoUrl:
      "https://www.youtube.com/results?search_query=medicine+ball+overhead+backward+throw",
  },
  {
    name: "Смяна на хвата с тежест (Wrist Supination/Pronation)",
    description:
      "Задържане на лека тежест или бухалка, ротация на китката наляво-надясно. Укрепва предмишницата и предпазва от тенис лакът.",
    category: "physical",
    source: "Badminton Europe",
    location: ["indoor"],
    ageGroups: ["U13", "U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 10,
    equipment: "Лека тежест / Ракета с тежест",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+wrist+supination+pronation+exercises",
  },
  {
    name: "Hexagon Agility Test",
    description:
      "Скачане с два крака от центъра на хексагон към всяка страна и връщане обратно възможно най-бързо.",
    category: "physical",
    source: "BWF Level 2 Physical",
    location: ["indoor", "outdoor"],
    ageGroups: ["U13", "U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 15,
    equipment: "Лента или тебешир за чертане на хексагон",
    videoUrl:
      "https://www.youtube.com/results?search_query=hexagon+agility+test+badminton",
  },
  {
    name: "Wall Taps",
    description:
      "Бързо докосване на две точки на стената, раздалечени на 1.5 метра. Играчът прави странични стъпки. Тренира скорост на краката и ръцете.",
    category: "physical",
    source: "Badminton Asia",
    location: ["indoor"],
    ageGroups: ["U11", "U13", "U15", "U17", "U19"],
    durationMinutes: 10,
    equipment: "Стена, хронометър",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+wall+tap+agility",
  },
  {
    name: "Bear Crawls (Меча походка)",
    description:
      "Ходене на четири крака, без коленете да допират земята. Отлично за мобилност и сила в раменния пояс.",
    category: "physical",
    source: "Национални методики",
    location: ["indoor", "outdoor"],
    ageGroups: ["U11", "U13", "U15", "U17", "U19"],
    durationMinutes: 10,
    equipment: "Няма",
    videoUrl:
      "https://www.youtube.com/results?search_query=bear+crawls+badminton+conditioning",
  },
  {
    name: "Jump Rope - One Leg (Скачане на въже на един крак)",
    description:
      "Скачане на въже само на десния, после само на левия крак. Заздравява ахилеса и глезените индивидуално.",
    category: "physical",
    source: "Спортна физиология",
    location: ["indoor", "outdoor"],
    ageGroups: ["U13", "U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 15,
    equipment: "Въже за скачане",
    videoUrl:
      "https://www.youtube.com/results?search_query=jump+rope+one+leg+badminton",
  },
  {
    name: "Набирания (Pull Ups)",
    description:
      "Класически набирания на лост с широк хват. Засилва гърба (Latissimus dorsi), което е двигателната сила при мощни удари.",
    category: "physical",
    source: "BWF High Performance",
    location: ["indoor", "outdoor"],
    ageGroups: ["U17", "U19", "Мъже и Жени"],
    durationMinutes: 20,
    equipment: "Лост",
    videoUrl:
      "https://www.youtube.com/results?search_query=pull+ups+badminton+strength",
  },
  {
    name: "Sprint 5-10-5 (Pro Agility Drill)",
    description:
      "Спринт 5 метра надясно, 10 метра наляво, 5 метра надясно до старта. Измерва скоростта на смяна на посоката.",
    category: "physical",
    source: "BWF Level 3",
    location: ["indoor", "outdoor"],
    ageGroups: ["U13", "U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 15,
    equipment: "Конуси",
    videoUrl:
      "https://www.youtube.com/results?search_query=pro+agility+drill+5-10-5+badminton",
  },
  {
    name: "Лежанка с дъмбели (Dumbbell Bench Press)",
    description:
      "Изтласкване на дъмбели от лег. По-добро от щангата, защото изравнява силата между лява и дясна ръка.",
    category: "physical",
    source: "Спортна физиология",
    location: ["indoor"],
    ageGroups: ["U17", "U19", "Мъже и Жени"],
    durationMinutes: 20,
    equipment: "Лежанка, дъмбели",
    videoUrl:
      "https://www.youtube.com/results?search_query=dumbbell+bench+press+badminton",
  },
  {
    name: "High Knee Sprints (Високо повдигане на коленете)",
    description:
      "Спринтиране на 20 метра с много бързо и високо повдигане на коленете. Увеличава честотата на стъпките.",
    category: "physical",
    source: "Национални методики",
    location: ["indoor", "outdoor"],
    ageGroups: ["U11", "U13", "U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 10,
    equipment: "Няма",
    videoUrl:
      "https://www.youtube.com/results?search_query=high+knee+sprints+badminton",
  },
  {
    name: "Разтягане на предмишницата (Forearm Stretching)",
    description:
      "Изпъване на ръката напред и дърпане на пръстите назад. Задължително след всяка тренировка за избягване на възпаления.",
    category: "physical",
    source: "BWF Level 1",
    location: ["indoor", "outdoor"],
    ageGroups: ["U9", "U11", "U13", "U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 5,
    equipment: "Няма",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+forearm+stretches",
  },
  {
    name: "Lateral Band Walks (Странични стъпки с ластик)",
    description:
      "Малък ластик се слага над коленете, правят се странични стъпки. Активира глутеус медиус за по-стабилен напад.",
    category: "physical",
    source: "Badminton Europe",
    location: ["indoor"],
    ageGroups: ["U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 10,
    equipment: "Mini band (ластик)",
    videoUrl:
      "https://www.youtube.com/results?search_query=lateral+band+walks+badminton",
  },
  {
    name: "Copenhagen Planks",
    description:
      "Страничен планк, при който горният крак е на пейка. Най-доброто упражнение за аддукторите (вътрешна част на бедрото), предпазващо от разкъсвания.",
    category: "physical",
    source: "Спортна физиология",
    location: ["indoor"],
    ageGroups: ["U17", "U19", "Мъже и Жени"],
    durationMinutes: 10,
    equipment: "Пейка",
    videoUrl:
      "https://www.youtube.com/results?search_query=copenhagen+plank+badminton",
  },
  {
    name: "Pogo Jumps",
    description:
      "Бързи, плитки отскоци с изправени колене, използващи само еластичността на ахилеса. Подготвя краката за split-step.",
    category: "physical",
    source: "BWF Level 2 Physical",
    location: ["indoor", "outdoor"],
    ageGroups: ["U13", "U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 10,
    equipment: "Няма",
    videoUrl:
      "https://www.youtube.com/results?search_query=pogo+jumps+badminton",
  },
  {
    name: "Фоумролер за гръб (Thoracic Mobility)",
    description:
      "Поставяне на фоумролер в средата на гърба и разгъване назад. Подобрява мобилността за по-силен Smash без болки в кръста.",
    category: "physical",
    source: "BWF High Performance",
    location: ["indoor"],
    ageGroups: ["U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 5,
    equipment: "Foam Roller",
    videoUrl:
      "https://www.youtube.com/results?search_query=thoracic+mobility+foam+roller+badminton",
  },
];
