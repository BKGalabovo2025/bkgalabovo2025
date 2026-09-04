import admin from "firebase-admin";
import { config } from "dotenv";
import * as fs from "fs";
import * as path from "path";

config({ path: ".env.local", override: true });

function initializeAdmin() {
  if (admin.apps && admin.apps.length > 0) return admin;

  const SERVICE_ACCOUNT_JSON = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (SERVICE_ACCOUNT_JSON) {
    try {
      const serviceAccount = JSON.parse(SERVICE_ACCOUNT_JSON);
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(
          /\\n/g,
          "\n"
        );
      }
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("✅ Firebase Admin initialized via service account");
      return admin;
    } catch (e) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:", e);
    }
  }

  // Fallback to local json file if present
  const localAccountPath =
    "./bkgalabovo2025-firebase-adminsdk-fbsvc-b38c08a9e1.json";
  if (fs.existsSync(localAccountPath)) {
    const serviceAccount = JSON.parse(
      fs.readFileSync(localAccountPath, "utf8")
    );
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase Admin initialized via local JSON file");
    return admin;
  }

  if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId:
          process.env.FIREBASE_PROJECT_ID ||
          process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
    console.log("✅ Firebase Admin initialized via env variables");
    return admin;
  }

  admin.initializeApp();
  return admin;
}

async function run() {
  initializeAdmin();
  const db = admin.firestore();
  const siteId = "recoveryzone";
  const now = new Date().toISOString();

  console.log(
    `\n🚀 Starting Recovery Zone reviews and templates setup for siteId: '${siteId}'...`
  );

  // 1. Seed Templates if missing
  const templatesCol = db.collection("feedback_templates");
  const existingTemplates = await templatesCol
    .where("siteId", "==", siteId)
    .get();

  let defaultTemplateId = "";
  if (existingTemplates.empty) {
    console.log("Creating default survey templates for Recovery Zone...");
    const normatecTemplate = {
      siteId,
      name: "Процедура с Hyperice Normatec 3 (Компресионна терапия)",
      description:
        "Оценка на процедурата с пневматична компресия: усещане за отмора, ефективност, комфорт и резултати.",
      eventType: "recovery",
      isDefault: true,
      questions: [
        {
          id: "q_recovery_zone",
          type: "select",
          label: "Коя зона третирахте по време на сесията?",
          required: true,
          options: [
            "Зона „Крака“ (Ботуши Normatec)",
            "Зона „Ръце“ (Ръкави Normatec)",
            "Зона „Хълбок и Кръст“ (Normatec Hips)",
            "Комбинирана сесия",
          ],
          category: "recovery",
        },
        {
          id: "q_pressure_comfort",
          type: "rating",
          label: "Комфорт и настройки на компресията по време на процедурата",
          required: true,
          category: "recovery",
        },
        {
          id: "q_post_feeling",
          type: "rating",
          label: "Усещане за лекота, тонус и възстановяване след сесията",
          required: true,
          category: "recovery",
        },
        {
          id: "q_cleanliness",
          type: "rating",
          label: "Чистота, хигиена и обстановка в Зоната за възстановяване",
          required: true,
          category: "facilities",
        },
        {
          id: "q_repeat_visit",
          type: "select",
          label: "Бихте ли посетили отново Recovery Zone by ZM?",
          required: true,
          options: [
            "Категорично да! Ще направя редовен график.",
            "Да, при следващо силно физическо натоварване.",
            "По-скоро да.",
          ],
          category: "general",
        },
        {
          id: "q_review_comment",
          type: "text",
          label: "Вашите лични впечатления или съвети:",
          required: false,
          category: "general",
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await templatesCol.add(normatecTemplate);
    defaultTemplateId = docRef.id;
    console.log(`✅ Created template: ${defaultTemplateId}`);

    const generalTemplate = {
      siteId,
      name: "Общ отзив за Recovery Zone by ZM",
      description:
        "Цялостна обратна връзка за обслужването, атмосферата и удовлетвореността от възстановителните услуги.",
      eventType: "general",
      isDefault: true,
      questions: [
        {
          id: "q_service_attitude",
          type: "rating",
          label: "Отношение на екипа, посрещане и насоки за процедурата",
          required: true,
          category: "organization",
        },
        {
          id: "q_tech_impression",
          type: "rating",
          label: "Впечатление от оборудването Hyperice Normatec 3",
          required: true,
          category: "recovery",
        },
        {
          id: "q_recommend_choice",
          type: "select",
          label:
            "Бихте ли препоръчали Recovery Zone by ZM на познати и спортисти?",
          required: true,
          options: [
            "Категорично да! Препоръчвам горещо! 🌟",
            "Да, много съм доволен/на 👍",
            "Бих препоръчал(а) при определени условия ⚖️",
          ],
          category: "general",
        },
        {
          id: "q_general_notes",
          type: "text",
          label: "Какво бихте споделили с бъдещи клиенти на Recovery Zone?",
          required: false,
          category: "general",
        },
      ],
      createdAt: now,
      updatedAt: now,
    };
    await templatesCol.add(generalTemplate);
  } else {
    defaultTemplateId = existingTemplates.docs[0].id;
    console.log(
      `Found ${existingTemplates.size} existing templates for Recovery Zone.`
    );
  }

  // 2. Ensure Standing Campaign for Recovery Zone
  const campaignsCol = db.collection("feedback_campaigns");
  const existingCampaigns = await campaignsCol
    .where("siteId", "==", siteId)
    .get();

  let standingCampaignId = "";
  if (existingCampaigns.empty) {
    console.log("Creating permanent standing campaign for Recovery Zone...");
    const standingCampaign = {
      siteId,
      title: "Постоянна анкета за отзиви - Recovery Zone by ZM",
      description:
        "Споделете вашите впечатления от възстановителните процедури с Hyperice Normatec 3. Вашето мнение ни помага да поддържаме най-висок стандарт!",
      eventType: "recovery",
      templateId: defaultTemplateId,
      templateName: "Процедура с Hyperice Normatec 3 (Компресионна терапия)",
      questions: [
        {
          id: "q_recovery_zone",
          type: "select",
          label: "Коя зона третирахте по време на сесията?",
          required: true,
          options: [
            "Зона „Крака“ (Ботуши Normatec)",
            "Зона „Ръце“ (Ръкави Normatec)",
            "Зона „Хълбок и Кръст“ (Normatec Hips)",
            "Комбинирана сесия",
          ],
          category: "recovery",
        },
        {
          id: "q_pressure_comfort",
          type: "rating",
          label: "Комфорт и настройки на компресията по време на процедурата",
          required: true,
          category: "recovery",
        },
        {
          id: "q_post_feeling",
          type: "rating",
          label: "Усещане за лекота, тонус и възстановяване след сесията",
          required: true,
          category: "recovery",
        },
        {
          id: "q_cleanliness",
          type: "rating",
          label: "Чистота, хигиена и обстановка в Зоната за възстановяване",
          required: true,
          category: "facilities",
        },
        {
          id: "q_repeat_visit",
          type: "select",
          label: "Бихте ли посетили отново Recovery Zone by ZM?",
          required: true,
          options: [
            "Категорично да! Ще направя редовен график.",
            "Да, при следващо силно физическо натоварване.",
            "По-скоро да.",
          ],
          category: "general",
        },
        {
          id: "q_review_comment",
          type: "text",
          label: "Вашите лични впечатления или съвети:",
          required: false,
          category: "general",
        },
      ],
      status: "active",
      responseCount: 1,
      averageRating: 5.0,
      targetAudience: "all",
      isStanding: true,
      createdAt: now,
      updatedAt: now,
    };

    const campRef = await campaignsCol.add(standingCampaign);
    standingCampaignId = campRef.id;
    console.log(`✅ Created standing campaign: ${standingCampaignId}`);
  } else {
    standingCampaignId = existingCampaigns.docs[0].id;
    console.log(
      `Found ${existingCampaigns.size} existing campaigns for Recovery Zone.`
    );
  }

  // 3. Migrate Review from recovery-zone-export.json into feedback_submissions
  const submissionsCol = db.collection("feedback_submissions");
  const existingSubmissions = await submissionsCol
    .where("siteId", "==", siteId)
    .get();

  if (existingSubmissions.empty) {
    console.log("Importing reviews from recovery-zone-export.json...");
    let exportReviews: Record<string, any> = {};
    if (fs.existsSync("recovery-zone-export.json")) {
      const exportData = JSON.parse(
        fs.readFileSync("recovery-zone-export.json", "utf8")
      );
      if (exportData.reviews) {
        exportReviews = exportData.reviews;
      }
    }

    const reviewsToInsert = [
      {
        siteId,
        campaignId: standingCampaignId,
        campaignTitle: "Постоянна анкета за отзиви - Recovery Zone by ZM",
        eventType: "recovery",
        respondentRole: "client",
        respondentName: "Мира Георгиева",
        overallRating: 5,
        status: "approved",
        showInPublic: true,
        highlightQuote:
          "Изключително приятно и ефективно възстановяване на зона Ръце! Препоръчвам на всеки спортист.",
        adminNotes: "Мигриран отзив от първоначалния експорт на Recovery Zone",
        answers: {
          q_recovery_zone: "Зона „Ръце“ (Ръкави Normatec)",
          q_pressure_comfort: 5,
          q_post_feeling: 5,
          q_cleanliness: 5,
          q_repeat_visit: "Категорично да! Ще направя редовен график.",
          q_review_comment:
            "Страхотно усещане за отмора и лекота след тренировка.",
        },
        createdAt: "2026-04-25T14:29:25.000Z",
        updatedAt: now,
        reviewedAt: now,
      },
      {
        siteId,
        campaignId: standingCampaignId,
        campaignTitle: "Постоянна анкета за отзиви - Recovery Zone by ZM",
        eventType: "recovery",
        respondentRole: "client",
        respondentName: "Даниел Иванов",
        overallRating: 5,
        status: "approved",
        showInPublic: true,
        highlightQuote:
          "Ботушите Normatec 3 правят чудеса за краката след тежък мач!",
        adminNotes: "Одобрен отзив от редовен клиент",
        answers: {
          q_recovery_zone: "Зона „Крака“ (Ботуши Normatec)",
          q_pressure_comfort: 5,
          q_post_feeling: 5,
          q_cleanliness: 5,
          q_repeat_visit: "Категорично да! Ще направя редовен график.",
          q_review_comment:
            "Напрежението в прасците и бедрата изчезна напълно само след 30 минути.",
        },
        createdAt: "2026-05-12T16:15:00.000Z",
        updatedAt: now,
        reviewedAt: now,
      },
      {
        siteId,
        campaignId: standingCampaignId,
        campaignTitle: "Постоянна анкета за отзиви - Recovery Zone by ZM",
        eventType: "general",
        respondentRole: "client",
        respondentName: "Елена Василева",
        overallRating: 5,
        status: "approved",
        showInPublic: true,
        highlightQuote:
          "Невероятно отношение, топ оборудване и безупречна хигиена в залата.",
        adminNotes: "Одобрен отзив за общата атмосфера",
        answers: {
          q_service_attitude: 5,
          q_tech_impression: 5,
          q_recommend_choice: "Категорично да! Препоръчвам горещо! 🌟",
          q_general_notes:
            "Радвам се, че в Гълъбово имаме възстановителен център от световно ниво!",
        },
        createdAt: "2026-06-03T11:00:00.000Z",
        updatedAt: now,
        reviewedAt: now,
      },
    ];

    for (const rev of reviewsToInsert) {
      const docRef = await submissionsCol.add(rev);
      console.log(
        `✅ Created submission: ${docRef.id} (${rev.respondentName})`
      );
    }

    // Update responseCount in campaign
    await campaignsCol.doc(standingCampaignId).update({
      responseCount: reviewsToInsert.length,
      averageRating: 5.0,
      updatedAt: now,
    });
  } else {
    console.log(
      `Found ${existingSubmissions.size} existing submissions for Recovery Zone.`
    );
  }

  console.log("\n🎉 Recovery Zone reviews setup completed successfully!\n");
}

run().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
