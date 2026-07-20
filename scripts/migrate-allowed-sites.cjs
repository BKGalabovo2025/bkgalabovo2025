const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Прочитаме .env.local ако съществува
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

function initAdmin() {
  if (admin.apps.length > 0) return;

  // Първо търсим GOOGLE_APPLICATION_CREDENTIALS
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credPath) {
    const resolvedPath = path.resolve(process.cwd(), credPath);
    if (fs.existsSync(resolvedPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf-8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('✅ Firebase Admin SDK инициализиран от GOOGLE_APPLICATION_CREDENTIALS');
      return;
    }
  }

  // Fallback към твърдо кодирания път от set-admin.cjs
  const fallbackPath = path.join(__dirname, '..', 'bkgalabovo2025-firebase-adminsdk-fbsvc-69c199a4b2.json');
  if (fs.existsSync(fallbackPath)) {
    admin.initializeApp({
      credential: admin.credential.cert(fallbackPath)
    });
    console.log('✅ Firebase Admin SDK инициализиран от fallback JSON');
    return;
  }

  throw new Error("❌ Не е намерен валиден service account файл.");
}

async function migrateAllowedSites() {
  initAdmin();
  
  console.log("🚀 Стартиране на миграция: Добавяне на allowedSites към всички съществуващи потребители...\n");

  try {
    let pageToken;
    let count = 0;
    
    do {
      const listUsersResult = await admin.auth().listUsers(1000, pageToken);
      
      for (const userRecord of listUsersResult.users) {
        const currentClaims = userRecord.customClaims || {};
        
        // Ако вече има allowedSites, пропускаме
        if (currentClaims.allowedSites && Array.isArray(currentClaims.allowedSites) && currentClaims.allowedSites.length > 0) {
          console.log(`  ⏭ Пропускане на ${userRecord.email} (вече има allowedSites: ${currentClaims.allowedSites})`);
          continue;
        }

        // За всички съществуващи потребители в момента (тъй като са предимно админи), 
        // даваме достъп и до двата сайта, за да не счупим съществуваща логика.
        // В бъдеще, новите потребители могат да се ограничават само до един сайт.
        const defaultSites = ['bkgalabovo', 'recoveryzone'];
        
        await admin.auth().setCustomUserClaims(userRecord.uid, {
          ...currentClaims,
          allowedSites: defaultSites
        });
        
        console.log(`  ✅ Обновен ${userRecord.email} -> allowedSites: ['bkgalabovo', 'recoveryzone']`);
        count++;
      }
      
      pageToken = listUsersResult.pageToken;
    } while (pageToken);

    console.log(`\n🎉 Миграцията приключи! Обновени са ${count} потребители.`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Грешка при миграцията:", error);
    process.exit(1);
  }
}

migrateAllowedSites();
