import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as fs from "fs";
import * as path from "path";

// Данни от проекта Recovery Zone (взети от scratch/.env.local)
const recoveryZoneConfig = {
  projectId: "recoveryzonebyzm-admin",
  clientEmail:
    "firebase-adminsdk-fbsvc@recoveryzonebyzm-admin.iam.gserviceaccount.com",
  privateKey:
    `-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC6tu2wO0Jw6XON\nDlv9ArqY2b/DaQhVdHp7GBEJopNdUI7I96RTalhb6hFZWHsEgGJxVWJkEEr6XhIf\nlRP4WlJAtf0PxOTsgOeX446hBmMyBa6cO9XUIwsJ8CMwCBYueFNDkVksrUcydxLR\nFS+WiQZ2jsq0oCCRZ3ngyk+dvNZ+/5hFbGxv2jgnlzdiv/1lAtu8eznQb3Yi9Z1S\n55XUvXx6uaWHZ51r+rxNgiHcRLBQmj6TjwGBDLji82ZHK3wlYqHMmqUpMr95GpSt\nn4T96+swTUtoqzLXk7DI15xuA6iAH8wKGZj7y5etz9JpVNv+wrjME7TICQ0kseNf\nKDZiXNhxAgMBAAECggEAA/VymMQ3LCsOZ6z6zPbUq1oORusipjTnap7vwmYTAXHQ\n630eriQ7H0yiXpr65+L99+n6OFNprmpaZzuFjR+ns014ghR6PoVTA7wrTy5/4bTP\noqFPbxMgIoqzSW++dPC0hvSLJ+CYOdGV2rpgqL7kOXCBsBxeCh8yNjxQdFUMDH8I\nLt6KycJM4B18H5zRWngQlEItXZpGfNORmp6ybhCnoPTJCeFH6Pv3PjJ4yx2X5SZY\ndA2X1FYdy/TP+7wisnZXmpkuwvdcut3nVr/hQr0ha4O9NTB8D8HLiAoKLYr4C8pa\n5WPh0g1GQ8edUxaY1MGv125UkGr4VBsMoAX+BgKMbQKBgQDslhwldLLpfVMPWISp\nYZ8Ipbf5gRh0osDQxSawt4Vy1spin3U+Vdx9sghCLL9026lXQ9rH4pe2jl3TB8JM\nOXmLy+GbA9S43UvWiVtP5IM5nnpa1lczF0lquxPVKYHJANYYsGw3F1jqv8z5ojIv\nk4kQORDDycxGFKJwro5VvVqFlQKBgQDKCS2qNUUMrBTotGVhG1lQeR3EK4hxZdL1\nCY5aXSOeJUULBrvlgj87txCmxify1I9wFZ2ZXILeMabbtyQmwEJtZmZzFgHJeskK\nJkdt/GsvN4h32HdWw4wXP9SYh37WJvWQNWDBOdscYaWa5aQB80JWwldXXlKJogyJ\nZX9YghwYbQKBgGYNwoptspeBlgiymFcwYxep1JhuFYyKgD4OLUhhgdEt0hOE0WBY\nTUpzN5jEELpp3rxj6sX6epMnClXzrN6QlFu3UNQ7bNFptEMQ8TCfU/PQ5tq0Rt0l\nGGhP1phG1VNNZw0zXRrOmW552gN88cUQETnMQ+0Q6Wr5j7Cnu4JEsf2ZAoGAOUco\n3xyDGvieZOrf4wvx4lK0Ea2V3TBVAotXBF9rfaZrUJj0JDks3C0mV2HOaZXBpLE8\nIQKNR5kkCR5+7U2Mh5+EZBRVJV3eKTZ5AcGSUayY0AFatAp0aRL7ntKrLuOUsvGv\nIJjaec1lOejo+nSQ1i/6uxZOqB59F2bjF6CrfnECgYEApH6FkOO7zytohHrJzlQV\njNKk8HVaIvWM7yK05pPyWoGpkBRTF6vwusw2bJjXBwb532ev6aJ6D2eI8LJajsMh\n8trlFmPhBvVg/m8EJivCqmQdLxbLCgAM7KnsEOPSFSCTcMtbYXYjF24nExfq/GaR\nXixfZ0VjK4zi/UbgC3w9uQg=\n-----END PRIVATE KEY-----\n`.replace(
      /\\n/g,
      "\n"
    ),
};

async function exportRecoveryZone() {
  console.log("🚀 Starting Export from Recovery Zone...");

  const recoveryApp = initializeApp(
    {
      credential: cert(recoveryZoneConfig as any),
    },
    "recovery-zone-app"
  );

  const db = getFirestore(recoveryApp);
  // Автоматично извличане на ВСИЧКИ колекции от корена
  const collections = await db.listCollections();
  const collectionsToExport = collections.map((col) => col.id);

  console.log(
    `- Found ${collectionsToExport.length} root collections: ${collectionsToExport.join(", ")}`
  );

  const exportData: Record<string, any> = {};

  for (const collectionName of collectionsToExport) {
    console.log(`- Fetching collection: ${collectionName}...`);
    const snapshot = await db.collection(collectionName).get();

    if (snapshot.empty) {
      console.log(`  ! Collection ${collectionName} is empty.`);
      continue;
    }

    exportData[collectionName] = {};
    snapshot.forEach((doc) => {
      exportData[collectionName][doc.id] = doc.data();
    });
    console.log(`  -> Found ${snapshot.size} documents.`);
  }

  const outputPath = path.resolve(process.cwd(), "recovery-zone-export.json");
  fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));

  console.log(`\n✅ Export completed! Data saved to: ${outputPath}`);
  process.exit(0);
}

exportRecoveryZone().catch((err) => {
  console.error("❌ Export failed:", err);
  process.exit(1);
});
