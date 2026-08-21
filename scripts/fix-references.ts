import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as fs from "fs";
import * as path from "path";

const serviceAccountPath = path.join(
  process.cwd(),
  "bkgalabovo2025-firebase-adminsdk-fbsvc-b38c08a9e1.json"
);
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));

if (getApps().length === 0) {
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

const MISSING_EXERCISES = [
  {
    id: "4aa2a11b-fe6e-4a40-ab90-87b5d2639b7b",
    name: "Сянка с ракета (Shadow Badminton) с треньор",
    category: "technique",
    description:
      "Симулация на игра без перо (Shadow Badminton) по посочване от треньора (6 ъгъла). Треньорът показва накъде да се движи състезателят.",
    coachingPoints: [
      "Използвай правилен сплит степ (split step).",
      "Движението трябва да е експлозивно.",
    ],
    durationMinutes: 10,
    location: ["court"],
    ageGroups: ["U13", "U15", "U17", "U19", "Мъже и Жени"],
    equipment: ["Ракети"],
    prerequisites: ["Сплит степ", "Правилно придвижване"],
    intensity: 4,
    complexityLevel: 3,
    siteId: "bkgalabovo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "90154edd-3f35-42b3-b83e-f9ad9321f88c",
    name: "Схема: Драйв отбрана на мрежата",
    category: "tactics",
    description:
      "Двама играчи изпълняват бързи драйв удари един срещу друг в близост до мрежата, като се стремят да държат перото ниско и да преминават от защита в атака.",
    coachingPoints: [
      "Дръж ракетата пред себе си.",
      "Кратък замах.",
      "Фокус върху скоростта и реакцията.",
    ],
    durationMinutes: 10,
    location: ["court"],
    ageGroups: ["U15", "U17", "U19", "Мъже и Жени"],
    equipment: ["Ракети", "Пера"],
    prerequisites: ["Драйв"],
    intensity: 4,
    complexityLevel: 3,
    siteId: "bkgalabovo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "1578898a-dc1d-42e2-b1e3-82efb7102982",
    name: "Схема: Клеър -> Напад -> Възстановяване",
    category: "tactics",
    description:
      "Изиграване на фиксирана комбинация: изчистване (Клеър) дълбоко назад, следвано от спринт напред, напад на мрежата и бързо възстановяване в центъра.",
    coachingPoints: [
      "Високо посрещане на перото при клеър.",
      "Бързо възстановяване в центъра (Base position).",
    ],
    durationMinutes: 15,
    location: ["court"],
    ageGroups: ["U13", "U15", "U17"],
    equipment: ["Ракети", "Пера"],
    prerequisites: ["Клеър", "Напад на мрежата"],
    intensity: 4,
    complexityLevel: 3,
    siteId: "bkgalabovo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "5f5b3f80-2c6c-407f-a4db-ae8f1ec25058",
    name: "Фундамент: Скъсяване (Drop Shot) - Основи",
    category: "technique",
    description:
      "Трениране на основната техника за Drop Shot (скъсяване) от задната част на корта. Перото трябва да падне максимално близо до мрежата.",
    coachingPoints: [
      "Прикрий удара - нека изглежда като Клеър.",
      "Не забавяй ръката прекалено рано.",
      "Контактът с перото е леко пред тялото.",
    ],
    durationMinutes: 15,
    location: ["court"],
    ageGroups: ["U11", "U13", "U15"],
    equipment: ["Ракети", "Пера"],
    prerequisites: ["Основен хват", "Движение назад"],
    intensity: 2,
    complexityLevel: 2,
    siteId: "bkgalabovo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "8d40ed62-4ee5-46fc-b2c5-baef3528bb87",
    name: "Игра с условия: Half-court Singles (Половин корт)",
    category: "games",
    description:
      "Игра на единично, но се използва само лявата или дясната половина на корта (Half-court). Това принуждава играчите да използват по-прецизни удари и дълбочина.",
    coachingPoints: [
      "Фокус върху контрола, а не върху силата.",
      "Стремеж към изкарване на противника от баланс.",
    ],
    durationMinutes: 15,
    location: ["court"],
    ageGroups: ["U13", "U15", "U17", "U19", "Мъже и Жени"],
    equipment: ["Ракети", "Пера"],
    prerequisites: ["Основни удари"],
    intensity: 3,
    complexityLevel: 3,
    siteId: "bkgalabovo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "e0123c56-f8a1-432d-b1c4-1a987d6e5a4b", // Replacing 'NOT_FOUND' with a valid UUID
    name: "ОФП - Статично разтягане (Cooldown)",
    category: "cooldown",
    description:
      "Статично разтягане на основните мускулни групи (прасци, бедра, рамене, гръб) за успокояване на организма след натоварване.",
    coachingPoints: [
      "Задръж всяко разтягане по 20-30 секунди.",
      "Дишай дълбоко и бавно.",
    ],
    durationMinutes: 10,
    location: ["court", "stadium"],
    ageGroups: ["U9", "U11", "U13", "U15", "U17", "U19", "Мъже и Жени"],
    equipment: ["Постелки"],
    prerequisites: [],
    intensity: 1,
    complexityLevel: 1,
    siteId: "bkgalabovo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "52f9b349-65f5-4c36-8cb0-87d5876e238d",
    name: "Стълбичка за бързина: Интервали",
    category: "physical",
    description:
      "Интервална работа на координационна стълбичка. Смяна на 3 различни модела стъпки, с максимална скорост, последвана от почивка.",
    coachingPoints: [
      "Качеството на движението е по-важно от скоростта в началото.",
      "Гледай напред, не в краката си след като усвоиш ритъма.",
    ],
    durationMinutes: 10,
    location: ["court", "stadium"],
    ageGroups: ["U9", "U11", "U13", "U15", "U17", "U19"],
    equipment: ["Стълбичка"],
    prerequisites: ["Базова координация"],
    intensity: 4,
    complexityLevel: 2,
    siteId: "bkgalabovo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "f4b9ced6-ca86-49f0-8d21-c7d3f3e869b5",
    name: "Спринтове с ластици за експлозивност",
    category: "physical",
    description:
      "Експлозивни стартове, при които партньор държи ластик, създавайки съпротивление. Развива стартовата скорост и мощността на краката.",
    coachingPoints: [
      "Тялото да е леко приведено напред.",
      "Силно изтласкване с предната част на стъпалото.",
    ],
    durationMinutes: 10,
    location: ["court", "stadium"],
    ageGroups: ["U15", "U17", "U19", "Мъже и Жени"],
    equipment: ["Ластици за съпротивление"],
    prerequisites: ["Добра физическа подготовка"],
    intensity: 5,
    complexityLevel: 2,
    siteId: "bkgalabovo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "c6a9980e-ae25-458c-977e-cecba9a2ce89",
    name: "Тактика Двойки/Смесени: Първите 3 удара",
    category: "tactics",
    description:
      "Отработване на началните фази на разиграването в двойки: Сервис -> Посрещане -> Трети удар (Атака или натиск на мрежата).",
    coachingPoints: [
      "Посрещачът трябва да наложи натиск.",
      "Сервиращият или партньорът му трябва да са готови за бърз 3-ти удар.",
    ],
    durationMinutes: 15,
    location: ["court"],
    ageGroups: ["U15", "U17", "U19", "Мъже и Жени"],
    equipment: ["Ракети", "Пера"],
    prerequisites: ["Къс сервис", "Атакуващо посрещане"],
    intensity: 4,
    complexityLevel: 4,
    siteId: "bkgalabovo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "d8d39788-74db-4a6e-83c4-466ff03797f5",
    name: "Тактика Двойки: Атакуваща ротация (Пред-Зад)",
    category: "tactics",
    description:
      "Комуникация и позициониране при атака (един на мрежата, един отзад). Задният играч атакува със смач/дроп, предният е готов за пресичане.",
    coachingPoints: [
      "Предният играч да държи ракетата високо.",
      "Задният играч да се придвижва спрямо позицията на предния.",
    ],
    durationMinutes: 20,
    location: ["court"],
    ageGroups: ["U15", "U17", "U19", "Мъже и Жени"],
    equipment: ["Ракети", "Пера"],
    prerequisites: ["Смач", "Мрежови удари", "Позициониране по двойки"],
    intensity: 4,
    complexityLevel: 4,
    siteId: "bkgalabovo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "6928d463-518b-4916-8516-0c2bba740d34",
    name: "Схема: Смач и последващ мрежов кил",
    category: "tactics",
    description:
      "Задният играч изпълнява мощен смач, а предният партньор пресича слабия отговор на противника с бърз кил (забиване на мрежата).",
    coachingPoints: [
      "Смачът трябва да е насочен стръмно надолу.",
      "Предният играч не трябва да чака, а активно да търси перото.",
    ],
    durationMinutes: 15,
    location: ["court"],
    ageGroups: ["U15", "U17", "U19", "Мъже и Жени"],
    equipment: ["Ракети", "Пера"],
    prerequisites: ["Смач", "Кил на мрежата"],
    intensity: 5,
    complexityLevel: 4,
    siteId: "bkgalabovo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "b8b1a107-c493-4966-9c5b-110b87126a96",
    name: "Решения: Атака срещу защита 2v1",
    category: "games",
    description:
      "Двама играчи (Атака) срещу един (Защита). Двамата се стремят да завършат разиграването, докато единичният играч тренира дефанзивни умения и разпределение.",
    coachingPoints: [
      "Защитникът да използва повече повдигания (Lifts) и блокове.",
      "Атакуващите да търсят пролуки и да комбинират ударите.",
    ],
    durationMinutes: 15,
    location: ["court"],
    ageGroups: ["U15", "U17", "U19", "Мъже и Жени"],
    equipment: ["Ракети", "Пера"],
    prerequisites: ["Защита на смач", "Работа в екип"],
    intensity: 4,
    complexityLevel: 4,
    siteId: "bkgalabovo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "f25c09b7-c81e-4884-8421-0bd62b6f7ee6",
    name: "Фундамент: Основен V-образен хват (Forehand Grip)",
    category: "technique",
    description:
      "Въвеждащо упражнение за правилно хващане на ракетата (V-образен хват). Играчите се научават как да държат ракетата отпуснато.",
    coachingPoints: [
      "V-образен хват с палеца и показалеца.",
      "Ракетата се държи с пръстите, не с дланта.",
    ],
    durationMinutes: 5,
    location: ["court"],
    ageGroups: ["U9", "U11"],
    equipment: ["Ракети"],
    prerequisites: [],
    intensity: 1,
    complexityLevel: 1,
    siteId: "bkgalabovo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "e745b1e5-cf4b-41cd-9bf1-4020a95e392f",
    name: "Топка на тигана (BWF Racket Control)",
    category: "technique",
    description:
      "Дръжте ракетата като тиган (хват за форхенд на мрежата) и тупкайте перото леко нагоре към тавана. Тренира контрола на ракетата и координацията око-ръка.",
    coachingPoints: [
      'Следи за "Panhandle Grip" (хват тип тиган).',
      "Не стягай китката, дръж ракетата леко.",
    ],
    durationMinutes: 5,
    location: ["court"],
    ageGroups: ["U9", "U11"],
    equipment: ["Ракети", "Пера"],
    prerequisites: [],
    intensity: 1,
    complexityLevel: 1,
    siteId: "bkgalabovo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

async function run() {
  console.log("Analyzing Firestore DB exercises...");
  const exSnap = await db.collection("exercises").get();
  const dbExercisesByName = new Map<string, any>();
  const dbExercisesById = new Map<string, any>();

  exSnap.forEach((doc) => {
    const data = doc.data();
    dbExercisesById.set(doc.id, data);
    dbExercisesByName.set(data.name, { ...data, _id: doc.id });
  });

  console.log(`Loaded ${dbExercisesById.size} exercises from DB.`);

  const templatesSnap = await db.collection("training_templates").get();

  let templatesUpdatedCount = 0;

  // Create missing exercises
  for (const ex of MISSING_EXERCISES) {
    // Check if an exercise with this EXACT name exists in DB
    const existing = dbExercisesByName.get(ex.name);

    if (existing) {
      console.log(
        `Exercise "${ex.name}" already exists with ID: ${existing._id}. Will update template references...`
      );
      // We don't insert, we just map it. The template fix step will catch this.
    } else {
      console.log(`Creating missing exercise in DB: ${ex.name} (${ex.id})`);
      await db.collection("exercises").doc(ex.id).set(ex);
      dbExercisesById.set(ex.id, ex);
      dbExercisesByName.set(ex.name, { ...ex, _id: ex.id });
    }
  }

  // Fix templates
  for (const doc of templatesSnap.docs) {
    const tmpl = doc.data();
    let updated = false;

    if (tmpl.blocks) {
      for (const block of tmpl.blocks) {
        if (block.exercises) {
          for (const ex of block.exercises) {
            // Fix NOT_FOUND ID explicitly
            if (ex.exerciseId === "NOT_FOUND") {
              ex.exerciseId = "e0123c56-f8a1-432d-b1c4-1a987d6e5a4b";
              updated = true;
            }

            // Check if ID doesn't exist but name exists (mismatched ID)
            if (!dbExercisesById.has(ex.exerciseId)) {
              const byName = dbExercisesByName.get(ex.exerciseName);
              if (byName) {
                console.log(
                  `Fixing mismatched ID for "${ex.exerciseName}" in Template "${tmpl.name}": ${ex.exerciseId} -> ${byName._id}`
                );
                ex.exerciseId = byName._id;
                updated = true;
              } else {
                console.log(
                  `WARNING: Still cannot find exercise for ${ex.exerciseName} in template ${tmpl.name}`
                );
              }
            }
          }
        }
      }
    }

    if (updated) {
      console.log(`Saving template updates for "${tmpl.name}"...`);
      await db
        .collection("training_templates")
        .doc(doc.id)
        .update({ blocks: tmpl.blocks });
      templatesUpdatedCount++;
    }
  }

  console.log(
    `\n✅ Done! Inserted missing exercises and updated ${templatesUpdatedCount} templates to correct IDs.`
  );
}

run().catch(console.error);
