import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";

const serviceAccountPath = path.join(
  process.cwd(),
  "bkgalabovo2025-firebase-adminsdk-fbsvc-b38c08a9e1.json"
);
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));

if (getApps().length === 0) {
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

const CAMP_EXERCISES = [
  {
    id: uuidv4(),
    name: "Ставна загрявка (Глава, рамена, колена, глезени)",
    category: "warmup",
    description:
      "Внимателна ротация и раздвижване на всички основни стави. Подготвя тялото за натоварването през деня и намалява риска от травми.",
    coachingPoints: [
      "Движенията са плавни, без резки тласъци.",
      "Спазвай посоката Отгоре-Надолу или Отдолу-Нагоре.",
    ],
    durationMinutes: 10,
    location: ["beach", "stadium"],
    ageGroups: ["U9", "U11", "U13", "U15", "U17", "U19", "Мъже и Жени"],
    equipment: [],
    prerequisites: [],
    intensity: 1,
    complexityLevel: 1,
    siteId: "bkgalabovo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: "Прогресивен аеробен крос (25+ мин)",
    category: "physical",
    description:
      "Равномерен крос с постепенно увеличаване на времето с всеки изминал ден от лагера. Изгражда базова аеробна издръжливост.",
    coachingPoints: [
      "Темпото трябва да позволява свободен разговор.",
      "Следи за правилно дишане.",
    ],
    durationMinutes: 25,
    location: ["beach", "stadium"],
    ageGroups: ["U13", "U15", "U17", "U19", "Мъже и Жени"],
    equipment: [],
    prerequisites: ["Базова издръжливост"],
    intensity: 3,
    complexityLevel: 1,
    siteId: "bkgalabovo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: "Регенерация и разпускане на краката във вода/море",
    category: "cooldown",
    description:
      "Влизане във водата (поне до кръста) веднага след крос/тренировка. Студената вода намалява възпалението и ускорява възстановяването (Криотерапия).",
    coachingPoints: [
      "Движението във водата трябва да е леко, без плуване на скорост.",
      "Останете във водата поне 5-10 минути.",
    ],
    durationMinutes: 10,
    location: ["beach"],
    ageGroups: ["U9", "U11", "U13", "U15", "U17", "U19", "Мъже и Жени"],
    equipment: [],
    prerequisites: [],
    intensity: 1,
    complexityLevel: 1,
    siteId: "bkgalabovo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: "Плажна ОФП серия (Катерачи, Планк, Коремни преси)",
    category: "physical",
    description:
      "Комплекс от упражнения със собствено тегло върху пясъка. Фокус върху мускулатурата на ядрото (Core).",
    coachingPoints: [
      "При планк, тялото трябва да е права линия.",
      "Пясъкът затруднява стабилността - контролирай баланса.",
    ],
    durationMinutes: 15,
    location: ["beach"],
    ageGroups: ["U11", "U13", "U15", "U17", "U19", "Мъже и Жени"],
    equipment: ["Постелки"],
    prerequisites: [],
    intensity: 4,
    complexityLevel: 2,
    siteId: "bkgalabovo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: "Плажни отборни и щафетни игри",
    category: "games",
    description:
      "Забавни щафети на пясък - бягане с препятствия, пренос на предмети. Изгражда екипен дух и експлозивна бързина.",
    coachingPoints: [
      "Стимулирай комуникацията между децата.",
      "Следи за правилно стъпване в дълбокия пясък.",
    ],
    durationMinutes: 20,
    location: ["beach"],
    ageGroups: ["U9", "U11", "U13", "U15", "U17", "U19"],
    equipment: ["Конуси"],
    prerequisites: [],
    intensity: 4,
    complexityLevel: 1,
    siteId: "bkgalabovo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: "Спринтове в дълбок пясък",
    category: "physical",
    description:
      "Експлозивни спринтове от 10-15 метра в мек пясък. Огромно съпротивление, което изгражда стартова скорост и сила в краката.",
    coachingPoints: [
      "Работи с ръцете активно.",
      "Високо повдигане на коленете.",
    ],
    durationMinutes: 10,
    location: ["beach"],
    ageGroups: ["U13", "U15", "U17", "U19", "Мъже и Жени"],
    equipment: ["Конуси"],
    prerequisites: ["Базова координация"],
    intensity: 5,
    complexityLevel: 2,
    siteId: "bkgalabovo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: "Бадминтон игри с балони/пера на открито",
    category: "games",
    description:
      "Модифицирани игри за контрол на ракетата при външни условия. Тупкане на балон или контрол на перо срещу вятъра.",
    coachingPoints: [
      "Използвай правилен хват.",
      "Адаптация към условията (вятър, слънце).",
    ],
    durationMinutes: 15,
    location: ["beach", "stadium"],
    ageGroups: ["U9", "U11", "U13"],
    equipment: ["Ракети", "Балони", "Пера"],
    prerequisites: [],
    intensity: 2,
    complexityLevel: 1,
    siteId: "bkgalabovo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: "Станция: Преносими мрежи (Мрежов контрол)",
    category: "technique",
    description:
      "Работа за фин контрол в предната част на корта. Мрежови удари, подрязване и скъсяване върху преносима мрежа.",
    coachingPoints: [
      "Ракетата е пред тялото.",
      "Леко движение само от пръстите.",
    ],
    durationMinutes: 10,
    location: ["court", "stadium"],
    ageGroups: ["U9", "U11", "U13", "U15", "U17", "U19", "Мъже и Жени"],
    equipment: ["Преносими мрежи", "Ракети", "Пера"],
    prerequisites: ["Мрежов удар"],
    intensity: 2,
    complexityLevel: 3,
    siteId: "bkgalabovo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: "Станция: Скоростна стълбичка (Footwork)",
    category: "physical",
    description:
      "Различни модели за бързина на краката и смяна на посоката върху координационна стълбичка.",
    coachingPoints: ["Стъпвай само на пръсти.", "Гледай напред, не надолу."],
    durationMinutes: 10,
    location: ["court", "stadium"],
    ageGroups: ["U9", "U11", "U13", "U15", "U17", "U19", "Мъже и Жени"],
    equipment: ["Стълбичка"],
    prerequisites: [],
    intensity: 4,
    complexityLevel: 2,
    siteId: "bkgalabovo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: "Станция: Въже за скачане (Плиометрия & Експлозивност)",
    category: "physical",
    description:
      "Скачане на въже (единични, двойни превъртания, на един крак). Основен фундамент за експлозивен отскок в бадминтона.",
    coachingPoints: [
      "Отскачай леко, без да сгъваш коленете прекалено много.",
      "Върти въжето с китките, не с целите ръце.",
    ],
    durationMinutes: 10,
    location: ["court", "stadium"],
    ageGroups: ["U11", "U13", "U15", "U17", "U19", "Мъже и Жени"],
    equipment: ["Въжета"],
    prerequisites: [],
    intensity: 4,
    complexityLevel: 2,
    siteId: "bkgalabovo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: "Станция: Сянка (Shadow Badminton)",
    category: "technique",
    description:
      "Работа без перо. Изпълняване на правилни придвижвания по корта към 6-те ъгъла по визуален сигнал на треньора.",
    coachingPoints: [
      "Винаги започвай със Сплит Степ.",
      "Фокус върху плавния баланс при възстановяване.",
    ],
    durationMinutes: 10,
    location: ["court", "stadium"],
    ageGroups: ["U11", "U13", "U15", "U17", "U19", "Мъже и Жени"],
    equipment: ["Ракети"],
    prerequisites: ["Основни движения (Footwork)"],
    intensity: 4,
    complexityLevel: 3,
    siteId: "bkgalabovo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: "Станция: Спринтове с конуси",
    category: "physical",
    description:
      "Линейни спринтове и совалки между маркирани с конуси зони. Подобрява експлозивността и спирането (деселерация).",
    coachingPoints: [
      "Ускорявай бързо, спирай плавно с нисък център на тежестта.",
    ],
    durationMinutes: 10,
    location: ["court", "stadium", "beach"],
    ageGroups: ["U13", "U15", "U17", "U19", "Мъже и Жени"],
    equipment: ["Конуси"],
    prerequisites: [],
    intensity: 5,
    complexityLevel: 2,
    siteId: "bkgalabovo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

async function run() {
  console.log("Analyzing Firestore DB exercises for duplicates...");
  const exSnap = await db.collection("exercises").get();
  const dbExercisesByName = new Set<string>();

  exSnap.forEach((doc) => {
    dbExercisesByName.add(doc.data().name);
  });

  let insertedCount = 0;
  for (const ex of CAMP_EXERCISES) {
    if (dbExercisesByName.has(ex.name)) {
      console.log(`Exercise "${ex.name}" already exists. Skipping.`);
    } else {
      console.log(`Inserting: ${ex.name}`);
      await db.collection("exercises").doc(ex.id).set(ex);
      insertedCount++;
    }
  }

  console.log(`✅ Inserted ${insertedCount} new camp exercises.`);
}

run().catch(console.error);
