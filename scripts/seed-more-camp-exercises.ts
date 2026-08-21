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

const MORE_CAMP_EXERCISES = [
  // --- BEACH BLOCKS ---
  {
    id: uuidv4(),
    name: "Плажна Пирамида (Спринт-Лицеви-Клекове)",
    category: "physical",
    description: "Спринт 10м в пясъка, 1 лицева опора, 1 клек. Връщане назад. Спринт 10м, 2 лицеви, 2 клека. Продължава до 5 и обратно до 1.",
    coachingPoints: [
      "Работи за взривна сила и бързо възстановяване.",
      "В пясъка лицевите опори са по-трудни заради нестабилността."
    ],
    durationMinutes: 15,
    location: ["beach"],
    ageGroups: ["U13", "U15", "U17", "U19", "Мъже и Жени"],
    equipment: ["Конуси"],
    prerequisites: ["Добра физическа подготовка"],
    intensity: 5,
    complexityLevel: 2,
    siteId: "bkgalabovo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: "Защитно придвижване в пясък (Shadow Badminton)",
    category: "physical",
    description: "Имитация на защитно придвижване на корта (сплит степ и странични крачки), но изпълнявано в дълбок пясък.",
    coachingPoints: [
      "Сплит степът в пясъка изисква много по-голямо усилие от прасците.",
      "Дръж центъра на тежестта ниско."
    ],
    durationMinutes: 10,
    location: ["beach"],
    ageGroups: ["U11", "U13", "U15", "U17", "U19", "Мъже и Жени"],
    equipment: ["Ракети"],
    prerequisites: ["Правилна стойка за защита"],
    intensity: 4,
    complexityLevel: 3,
    siteId: "bkgalabovo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: "Плажен Волейбол за координация",
    category: "games",
    description: "Игра на плажен волейбол, но с фокус върху движението и предвиждането на топката. Отличен крос-тренинг за бадминтон.",
    coachingPoints: [
      "Следи полета на топката и позиционирането на тялото.",
      "Комуникация с партньора."
    ],
    durationMinutes: 20,
    location: ["beach"],
    ageGroups: ["U9", "U11", "U13", "U15", "U17", "U19", "Мъже и Жени"],
    equipment: ["Волейболна топка", "Мрежа"],
    prerequisites: [],
    intensity: 3,
    complexityLevel: 1,
    siteId: "bkgalabovo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  
  // --- CIRCUIT (СТАНЦИОННИ РОТАЦИИ) ---
  {
    id: uuidv4(),
    name: "Станция: Медицинска топка (Усуквания)",
    category: "physical",
    description: "Хвърляне на медицинска топка в стена с усукване на торса (Russian Twists). Симулира ротацията при смач и клиър.",
    coachingPoints: [
      "Използвай коремните мускули, не само ръцете.",
      "Завъртането идва от бедрата и кръста."
    ],
    durationMinutes: 10,
    location: ["stadium", "court"],
    ageGroups: ["U13", "U15", "U17", "U19", "Мъже и Жени"],
    equipment: ["Медицинска топка"],
    prerequisites: ["Здрав кръст"],
    intensity: 4,
    complexityLevel: 2,
    siteId: "bkgalabovo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: "Станция: Бързи крачета върху кутия (Box Taps)",
    category: "physical",
    description: "Бързо докосване на ръба на плиометрична кутия или стъпало с пръстите на краката, редувайки ляв-десен крак.",
    coachingPoints: [
      "Ръцете работят синхронно с краката.",
      "Гърбът е изправен."
    ],
    durationMinutes: 10,
    location: ["stadium", "court"],
    ageGroups: ["U9", "U11", "U13", "U15", "U17", "U19", "Мъже и Жени"],
    equipment: ["Плио кутия / Стъпало"],
    prerequisites: [],
    intensity: 5,
    complexityLevel: 1,
    siteId: "bkgalabovo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: "Станция: Ластици за раменен пояс (Rotator Cuff)",
    category: "physical",
    description: "Упражнения с тренировъчни ластици за вътрешна и външна ротация на рамото. Превенция на контузии.",
    coachingPoints: [
      "Лакътят е прилепен до тялото.",
      "Движението е бавно и контролирано."
    ],
    durationMinutes: 10,
    location: ["stadium", "court", "beach"],
    ageGroups: ["U13", "U15", "U17", "U19", "Мъже и Жени"],
    equipment: ["Ластици"],
    prerequisites: [],
    intensity: 2,
    complexityLevel: 2,
    siteId: "bkgalabovo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // --- TACTICAL / MULTI-SHUTTLE ---
  {
    id: uuidv4(),
    name: "Мулти-Шатъл: Защита срещу смач (30 пера)",
    category: "tactics",
    description: "Треньорът подава 30 пера бързо надолу към играча. Играчът трябва да ги върне с блокращ или драйв удар от защита.",
    coachingPoints: [
      "Стойката е ниска, ракетата е пред тялото.",
      "Не прави голям замах."
    ],
    durationMinutes: 15,
    location: ["court"],
    ageGroups: ["U11", "U13", "U15", "U17", "U19", "Мъже и Жени"],
    equipment: ["Много пера", "Ракети"],
    prerequisites: ["Сплит степ", "Бекхенд защита"],
    intensity: 4,
    complexityLevel: 3,
    siteId: "bkgalabovo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: "Тактическа игра: 2 срещу 1 (Защита срещу Атака)",
    category: "tactics",
    description: "Двама състезатели атакуват постоянно един състезател, който трябва да се защитава и да търси пролуки за контра-атака.",
    coachingPoints: [
      "Защитаващият се трябва да връща перото дълбоко или остро на мрежата.",
      "Атакуващите тренират комуникация и покритие на корта."
    ],
    durationMinutes: 20,
    location: ["court"],
    ageGroups: ["U13", "U15", "U17", "U19", "Мъже и Жени"],
    equipment: ["Пера", "Ракети"],
    prerequisites: ["Стабилна защита", "Смач"],
    intensity: 5,
    complexityLevel: 4,
    siteId: "bkgalabovo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: "Мулти-Шатъл: Бърза смяна на посоката (4 ъгъла)",
    category: "technique",
    description: "Треньорът подава пера произволно в 4-те ъгъла на корта. Играчът трябва да се придвижи, удари и бързо да се върне в центъра.",
    coachingPoints: [
      "Фокус върху скоростта на връщане в центъра след удара.",
      "Правилна работа с краката (footwork)."
    ],
    durationMinutes: 15,
    location: ["court"],
    ageGroups: ["U11", "U13", "U15", "U17", "U19", "Мъже и Жени"],
    equipment: ["Много пера", "Ракети"],
    prerequisites: ["Основни стъпки на корта"],
    intensity: 5,
    complexityLevel: 3,
    siteId: "bkgalabovo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: "Мулти-Шатъл: Атака от задна линия (Смач и продължение)",
    category: "tactics",
    description: "Подаване на високо перо за смач, веднага последвано от късо подаване на мрежата за убиване/завършване.",
    coachingPoints: [
      "След смача тялото трябва да тръгне напред, а не да остава назад.",
      "Ракетата трябва да е вдигната за следващия удар."
    ],
    durationMinutes: 15,
    location: ["court"],
    ageGroups: ["U13", "U15", "U17", "U19", "Мъже и Жени"],
    equipment: ["Много пера", "Ракети"],
    prerequisites: ["Смач", "Мрежов удар"],
    intensity: 5,
    complexityLevel: 4,
    siteId: "bkgalabovo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

async function run() {
  console.log("Analyzing Firestore DB exercises for duplicates...");
  const exSnap = await db.collection("exercises").get();
  const dbExercisesByName = new Set<string>();

  exSnap.forEach((doc) => {
    dbExercisesByName.add(doc.data().name);
  });

  let insertedCount = 0;
  for (const ex of MORE_CAMP_EXERCISES) {
    if (dbExercisesByName.has(ex.name)) {
      console.log(`Exercise "${ex.name}" already exists. Skipping.`);
    } else {
      console.log(`Inserting: ${ex.name}`);
      await db.collection("exercises").doc(ex.id).set(ex);
      insertedCount++;
    }
  }

  console.log(`✅ Inserted ${insertedCount} new MORE camp exercises.`);
}

run().catch(console.error);
