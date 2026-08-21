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

const BEACH_EXERCISES = [
  {
    id: uuidv4(),
    name: "Плажна Зиг-Заг Щафета (Agility in Sand)",
    category: "physical",
    description: "Нареждат се конуси зиг-заг в пясъка. Спринт до първия, докосване, спринт до втория. На връщане - бягане назад.",
    coachingPoints: [
      "В пясъка смяната на посоката изисква огромна стабилност от глезените.",
      "Крачките трябва да са по-къси и по-чести."
    ],
    durationMinutes: 15,
    location: ["beach"],
    ageGroups: ["U13", "U15", "U17", "U19", "Мъже и Жени"],
    equipment: ["Конуси"],
    prerequisites: ["Здрави глезени"],
    intensity: 4,
    complexityLevel: 2,
    siteId: "bkgalabovo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: "Жабешки подскоци в пясък (Frog Jumps)",
    category: "physical",
    description: "Дълбоки жабешки подскоци от клек до клек. 10 подскока напред, кратка почивка, 10 назад.",
    coachingPoints: [
      "Използвай ръцете за замах.",
      "Приземяването е меко в пясъка, което щади ставите, но натоварва брутално квадрицепсите."
    ],
    durationMinutes: 10,
    location: ["beach"],
    ageGroups: ["U15", "U17", "U19", "Мъже и Жени"],
    equipment: [],
    prerequisites: ["Добра техника на клек"],
    intensity: 5,
    complexityLevel: 2,
    siteId: "bkgalabovo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: "Дърпане на въже в пясъка (Tug of War)",
    category: "games",
    description: "Класическо дърпане на въже, но в дълбок пясък. Разделяте отбора на две равни групи. Чудесно за сила на ядрото и екипен дух.",
    coachingPoints: [
      "Зарови краката дълбоко в пясъка за упора.",
      "Синхрон при дърпането (на 'Три!')."
    ],
    durationMinutes: 10,
    location: ["beach"],
    ageGroups: ["U9", "U11", "U13", "U15", "U17", "U19", "Мъже и Жени"],
    equipment: ["Дебело въже"],
    prerequisites: [],
    intensity: 5,
    complexityLevel: 1,
    siteId: "bkgalabovo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: "Плажни 'Бърпи' със спринт към водата",
    category: "physical",
    description: "Изпълнява се 1 бърпи (burpee), след което експлозивен спринт 5 метра по посока водата, спиране и връщане със заден ход.",
    coachingPoints: [
      "При ставането от пясъка ръцете не трябва да потъват прекалено.",
      "Вдигай високо коленете при спринта."
    ],
    durationMinutes: 12,
    location: ["beach"],
    ageGroups: ["U13", "U15", "U17", "U19", "Мъже и Жени"],
    equipment: [],
    prerequisites: ["Кардио издръжливост"],
    intensity: 5,
    complexityLevel: 2,
    siteId: "bkgalabovo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: "Сянка с ластик в пясъка (Resisted Shadowing)",
    category: "physical",
    description: "Партньор те държи с тренировъчен ластик през кръста, докато правиш придвижване напред и назад в пясъка, симулирайки удари (Shadow).",
    coachingPoints: [
      "Съпротивлението от ластика + пясъка изгражда изключителна експлозивна сила.",
      "Партньорът не трябва да дърпа твърде силно, само да създава съпротивление."
    ],
    durationMinutes: 15,
    location: ["beach"],
    ageGroups: ["U15", "U17", "U19", "Мъже и Жени"],
    equipment: ["Ластици за кръст", "Ракети"],
    prerequisites: ["Правилен footwork"],
    intensity: 5,
    complexityLevel: 3,
    siteId: "bkgalabovo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: "Рачешко ходене и Меча походка (Bear Crawls)",
    category: "physical",
    description: "Ходене на 4 крака (Меча походка напред, Рачешко ходене назад) за 10-15 метра в пясъка. Укрепва цялото тяло - рамене, ядро, крака.",
    coachingPoints: [
      "Дръжте бедрата ниско.",
      "Раменете работят изключително много, за да не потънат в пясъка."
    ],
    durationMinutes: 10,
    location: ["beach"],
    ageGroups: ["U9", "U11", "U13", "U15", "U17", "U19"],
    equipment: [],
    prerequisites: [],
    intensity: 4,
    complexityLevel: 2,
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
  for (const ex of BEACH_EXERCISES) {
    if (dbExercisesByName.has(ex.name)) {
      console.log(`Exercise "${ex.name}" already exists. Skipping.`);
    } else {
      console.log(`Inserting: ${ex.name}`);
      await db.collection("exercises").doc(ex.id).set(ex);
      insertedCount++;
    }
  }

  console.log(`✅ Inserted ${insertedCount} new beach camp exercises.`);
}

run().catch(console.error);
