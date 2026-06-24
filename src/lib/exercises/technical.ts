import { Exercise } from "@/types/planner.types";

export const TECHNICAL_EXERCISES: Omit<
  Exercise,
  "id" | "siteId" | "createdAt" | "updatedAt"
>[] = [
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
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+net+kill+multi+feeding",
  },
  {
    name: "Смеш защита (Smash Defense Block)",
    description:
      "Треньор забива от задна линия. Защитникът практикува стабилен, нисък стоеж и меко блокиране на перото в предната зона (от бекхенд страна).",
    category: "technical",
    source: "BWF Level 2",
    location: ["indoor"],
    ageGroups: ["U13", "U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 20,
    equipment: "Кош с пера",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+smash+defense+block",
  },
  {
    name: "Жонглиране с перо (Keep-uppy)",
    description:
      "За най-малките. Удряне на перото нагоре без да пада, развиване на координация око-ръка и усет за форхенд/бекхенд хват.",
    category: "technical",
    source: "BWF Shuttle Time",
    location: ["indoor", "outdoor"],
    ageGroups: ["U9", "U11"],
    durationMinutes: 10,
    equipment: "Ракета, перо",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+shuttle+juggling+kids",
  },
  {
    name: "Cross-court Net Shot (Диагонал на мрежата)",
    description:
      "Подаване на перо близо до мрежата. Играчът прави дълга стъпка с десния крак и с меко движение на китката насочва перото по диагонал.",
    category: "technical",
    source: "Badminton Europe",
    location: ["indoor"],
    ageGroups: ["U11", "U13", "U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 15,
    equipment: "Пера",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+cross+court+net+shot",
  },
  {
    name: "Смяна на хвата (Grip Transition Drill)",
    description:
      "Играчът стои на стена и играе форхенд, бекхенд, форхенд, бекхенд срещу стената. Тренира мигновената смяна на хвата.",
    category: "technical",
    source: "BWF Level 1",
    location: ["indoor", "outdoor"],
    ageGroups: ["U9", "U11", "U13", "U15", "U17"],
    durationMinutes: 10,
    equipment: "Стена, перо",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+grip+change+wall+drill",
  },
  {
    name: "Смеш със скок (Jump Smash Technique)",
    description:
      "Фокус изцяло върху техниката на отскока (Scissors jump). Оттласкване с два крака, изпъване на тялото като лък в посока нагоре и камшичен удар.",
    category: "technical",
    source: "Национални методики",
    location: ["indoor"],
    ageGroups: ["U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 20,
    equipment: "Пера",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+jump+smash+technique+slow+motion",
  },
  {
    name: "Drop Shot от бекхенд (Backhand Drop)",
    description:
      "Много труден удар. Учим обръщане на гърба към мрежата, висок лакът и рязко 'отсичане' на перото, така че да падне точно зад филето.",
    category: "technical",
    source: "BWF High Performance",
    location: ["indoor"],
    ageGroups: ["U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 15,
    equipment: "Кош с пера",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+backhand+drop+shot+technique",
  },
  {
    name: "Драйв (Drive) - Плосък удар",
    description:
      "Двама играчи стоят в средата на корта и удрят перото силно и плоско един към друг, така че да минава на сантиметри над мрежата.",
    category: "technical",
    source: "Badminton Asia",
    location: ["indoor"],
    ageGroups: ["U13", "U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 15,
    equipment: "Пера",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+drive+shot+technique",
  },
  {
    name: "Дълъг сервис за сингъл (High Serve)",
    description:
      "Тренировка на високия сервис отдолу, който трябва да падне вертикално точно на задната линия. Използва се мишена.",
    category: "technical",
    source: "BWF Shuttle Time",
    location: ["indoor"],
    ageGroups: ["U9", "U11", "U13", "U15", "U17", "U19"],
    durationMinutes: 10,
    equipment: "Мишени",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+high+serve+technique+singles",
  },
  {
    name: "Къс бекхенд сервис (Short Flick Serve)",
    description:
      "Късият бекхенд сервис е основата на двойките. Тренира се движение без замахване (само с палеца) и перфектна траектория над филето.",
    category: "technical",
    source: "Badminton Europe",
    location: ["indoor"],
    ageGroups: ["U13", "U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 15,
    equipment: "Лента или въже над мрежата (+5см)",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+short+backhand+serve+technique",
  },
  {
    name: "Бекхенд Клиър (Backhand Clear)",
    description:
      "Изчистване на перото от дълбок бекхенд до задната линия на противника. Ключово е ротацията на предмишницата (супинация).",
    category: "technical",
    source: "Спортна физиология",
    location: ["indoor"],
    ageGroups: ["U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 20,
    equipment: "Пера",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+backhand+clear+technique",
  },
  {
    name: "Slice Drop (Нарязан Drop)",
    description:
      "Удар, при който ракетата се движи бързо като за Smash, но в последния момент се 'отрязва' перото под ъгъл. Обърква противника.",
    category: "technical",
    source: "BWF Level 3",
    location: ["indoor"],
    ageGroups: ["U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 15,
    equipment: "Пера",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+slice+drop+shot",
  },
  {
    name: "Deceptive Net Lift (Лъжлив лифт от мрежа)",
    description:
      "Играчът показва, че ще направи мек net shot, но в последната милисекунда напряга китката и прави висок и дълъг Lift.",
    category: "technical",
    source: "Национални методики",
    location: ["indoor"],
    ageGroups: ["U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 15,
    equipment: "Кош с пера",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+deceptive+net+lift",
  },
  {
    name: "Dive Defense (Защита с плонж)",
    description:
      "Специфична техника на скачане/хвърляне по корта за изваждане на невъзможни смашове. Тренира се първо на меки дюшеци.",
    category: "technical",
    source: "Badminton Asia",
    location: ["indoor"],
    ageGroups: ["U17", "U19", "Мъже и Жени"],
    durationMinutes: 15,
    equipment: "Гимнастически дюшеци",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+diving+defense+technique",
  },
  {
    name: "China Jump (Китайски скок / Round the head)",
    description:
      "Специфичен страничен отскок към бекхенд ъгъла, при който се избягва бекхенд удара и се играе мощен форхенд (overhead).",
    category: "technical",
    source: "BWF High Performance",
    location: ["indoor"],
    ageGroups: ["U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 20,
    equipment: "Пера",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+round+the+head+china+jump",
  },
  {
    name: "Spinning Net Shot (Завъртане на перото)",
    description:
      "Удар на самата мрежа, при който струните се приплъзват под корковата глава. Перото започва да се върти хаотично и е невъзможно да се забие.",
    category: "technical",
    source: "Badminton Europe",
    location: ["indoor"],
    ageGroups: ["U13", "U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 15,
    equipment: "Пера",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+spinning+tumbling+net+shot",
  },
  {
    name: "Push Shot от сервизна линия",
    description:
      "След връщане на слаб къс сервис, играчът директно избутва (push) перото в тялото или лицето на противника.",
    category: "technical",
    source: "BWF Doubles Specific",
    location: ["indoor"],
    ageGroups: ["U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 15,
    equipment: "Пера",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+push+shot+doubles",
  },
  {
    name: "Stick Smash",
    description:
      "Смаш, който се изпълнява само с китката и предмишницата (без пълно замахване на рамото) - по-бърз за изпълнение, по-стръмен ъгъл.",
    category: "technical",
    source: "BWF Level 3",
    location: ["indoor"],
    ageGroups: ["U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 20,
    equipment: "Пера",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+stick+smash+technique",
  },
  {
    name: "Lift от защита (Defensive Lift)",
    description:
      "Блокиране на силен смаш, но с висока траектория чак до задната линия (Lift). Изисква много здрава китка.",
    category: "technical",
    source: "Спортна физиология",
    location: ["indoor"],
    ageGroups: ["U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 15,
    equipment: "Пера",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+defensive+lift+lob+from+smash",
  },
  {
    name: "Флик Сервис (Flick Serve)",
    description:
      "Лъжлив къс сервис (двойки), който в последната секунда рязко прехвърля противника. Цел - да го изненада неподготвен.",
    category: "technical",
    source: "Badminton Europe",
    location: ["indoor"],
    ageGroups: ["U15", "U17", "U19", "Мъже и Жени"],
    durationMinutes: 10,
    equipment: "Мишени",
    videoUrl:
      "https://www.youtube.com/results?search_query=badminton+flick+serve+doubles",
  },
];
