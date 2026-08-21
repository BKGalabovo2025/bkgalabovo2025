import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import admin from "firebase-admin";

function initAdmin() {
  if (admin.apps.length > 0) return;

  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credPath) {
    const resolvedPath = path.resolve(process.cwd(), credPath);
    if (fs.existsSync(resolvedPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, "utf-8"));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("✅ Firebase Admin SDK инициализиран от файл:", resolvedPath);
      return;
    }
  }

  throw new Error(
    "❌ Не е намерен валиден service account файл. Провери GOOGLE_APPLICATION_CREDENTIALS в .env.local."
  );
}

import { DEFAULT_QUIZZES } from "../src/lib/quizzes-data";

async function forceUpdateQuizzes() {
  initAdmin();
  const db = admin.firestore();

  console.log("\n🚀 Стартиране на обновяване на тестовете в базата...\n");
  
  const quizzesRef = db.collection("quizzes");
  // We want to fetch all base templates
  const snapshot = await quizzesRef.where("isBaseTemplate", "==", true).get();
  
  if (snapshot.empty) {
    console.log("⚠️ Не са открити никакви базови тестове в базата данни.");
    return;
  }

  console.log(`Намерени ${snapshot.docs.length} съществуващи базови теста. Обновявам ги...`);

  let updatedCount = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const baseId = data.baseTemplateId || data.id;
    const template = DEFAULT_QUIZZES.find(t => t.id === baseId);
    
    if (template) {
      console.log(`🔄 Обновявам: ${template.title}...`);
      await doc.ref.update({
        title: template.title,
        description: template.description,
        questions: template.questions,
        updatedAt: new Date().toISOString()
      });
      updatedCount++;
    } else {
      console.log(`⏭️ Пропускам ${data.title || doc.id} - няма намерен шаблон с id ${baseId}.`);
    }
  }
  
  console.log(`\n✅ Готово! Успешно обновени ${updatedCount} теста.`);
  process.exit(0);
}

forceUpdateQuizzes().catch(err => {
  console.error("❌ Грешка при обновяване:", err);
  process.exit(1);
});
