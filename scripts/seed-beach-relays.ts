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

const BEACH_RELAYS = [
  {
    id: uuidv4(),
    name: "Щафета: Перо в лъжица през пясъчните дюни",
    category: "games",
    description: "Децата се разделят на 2 отбора. Всяко дете държи ракета като тиган (хват за форхенд на мрежата) с едно перо върху кордажа. Трябва да пробягат през дълбокия пясък до конуса и обратно, без да изпуснат перото. Ако падне, спират, слагат го и продължават.",
    coachingPoints: [
      "Следи за правилен Panhandle Grip (хват тип тиган).",
      "Децата трябва да балансират ръката, докато краката работят тежко в пясъка."
    ],
    durationMinutes: 15,
    location: ["beach"],
    ageGroups: ["U9", "U11", "U13", "U15", "U17", "U19", "Мъже и Жени"],
    equipment: ["Ракети", "Пера", "Конуси"],
    prerequisites: ["Основен хват"],
    intensity: 3,
    complexityLevel: 2,
    siteId: "bkgalabovo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: "Щафета: Морски водонос (От морето към кофите)",
    category: "games",
    description: "Разделяте ги на отбори. Всеки отбор има празна кофа на сухия пясък и една малка пластмасова чашка. Първият спринтира до морето, пълни чашката, спринтира обратно и я излива в кофата. Предава чашката на следващия. Печели първият отбор, прелял кофата.",
    coachingPoints: [
      "Идеално за бягане от твърд към мек пясък (смяна на съпротивлението).",
      "Стимулира екипния дух и комуникацията под напрежение."
    ],
    durationMinutes: 15,
    location: ["beach"],
    ageGroups: ["U9", "U11", "U13", "U15", "U17", "U19", "Мъже и Жени"],
    equipment: ["Кофи", "Чашки (или срязани шишета)"],
    prerequisites: [],
    intensity: 4,
    complexityLevel: 1,
    siteId: "bkgalabovo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: "Щафета: Рачешко състезание в плитката вода",
    category: "games",
    description: "Отборите се строяват на брега, където водата е до глезените (плитчина). При сигнал, първият става на 'рак' (на четири крака, с корем към небето) и върви в плитката вода до конуса и обратно. Предава щафетата с 'дай пет'.",
    coachingPoints: [
      "Водата създава допълнително съпротивление и е много разхлаждащо.",
      "Внимавайте за камъни - избирайте гладко пясъчно дъно."
    ],
    durationMinutes: 10,
    location: ["beach"],
    ageGroups: ["U9", "U11", "U13", "U15", "U17"],
    equipment: ["Конуси"],
    prerequisites: [],
    intensity: 4,
    complexityLevel: 2,
    siteId: "bkgalabovo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: "Щафета: Събирач на съкровища (Пера във водата)",
    category: "games",
    description: "Треньорът хвърля 50 стари пера в морето (в плитката част, където няма вълни). Отборите са строени на 15 метра на пясъка. Всяко дете спринтира във водата, взима САМО ЕДНО перо и се връща. Отборът събрал най-много пера печели.",
    coachingPoints: [
      "Спринтът във вода до коленете е една от най-добрите тренировки за сила в краката.",
      "Много забавно и състезателно, децата забравят за умората."
    ],
    durationMinutes: 10,
    location: ["beach"],
    ageGroups: ["U9", "U11", "U13", "U15", "U17", "U19"],
    equipment: ["Стари пера"],
    prerequisites: [],
    intensity: 5,
    complexityLevel: 1,
    siteId: "bkgalabovo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    name: "Щафета: Войнишка гъсеница (Спринт и пълзене)",
    category: "games",
    description: "Наредени конуси на всеки 5 метра. От старта до първия конус - спринт. От първия до втория - ниско военно пълзене в пясъка. От втория до третия (до водата) - жабешки подскоци. Докосват водата и спринт обратно до старта.",
    coachingPoints: [
      "Комплексно натоварване - крака (спринт и подскоци) и ръце/ядро (пълзене).",
      "Очаквайте децата да станат целите в пясък!"
    ],
    durationMinutes: 15,
    location: ["beach"],
    ageGroups: ["U13", "U15", "U17", "U19", "Мъже и Жени"],
    equipment: ["Конуси"],
    prerequisites: ["Добра физическа подготовка"],
    intensity: 5,
    complexityLevel: 3,
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
  for (const ex of BEACH_RELAYS) {
    if (dbExercisesByName.has(ex.name)) {
      console.log(`Exercise "${ex.name}" already exists. Skipping.`);
    } else {
      console.log(`Inserting: ${ex.name}`);
      await db.collection("exercises").doc(ex.id).set(ex);
      insertedCount++;
    }
  }

  // OPTIONAL: Delete the old generic one to avoid clutter
  const genericDoc = exSnap.docs.find(d => d.data().name === "Плажни отборни и щафетни игри");
  if (genericDoc) {
    await genericDoc.ref.delete();
    console.log("Deleted the old generic 'Плажни отборни и щафетни игри'.");
  }

  console.log(`✅ Inserted ${insertedCount} new beach relays.`);
}

run().catch(console.error);
