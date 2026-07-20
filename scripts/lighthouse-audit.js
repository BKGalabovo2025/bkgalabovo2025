import { spawn, execSync } from "child_process";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import admin from "firebase-admin";

// Load environment variables
dotenv.config({ path: ".env.local" });

const pages = [
  { url: "http://localhost:3001/club", name: "club" },
  { url: "http://localhost:3001/schedule", name: "schedule" }
];

async function getSessionCookie() {
  console.log("--- Authenticating Lighthouse ---");
  const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const adminEmail = process.env.EMAIL_USER;

  if (!serviceAccountStr || !apiKey || !adminEmail) {
    throw new Error("Missing required Firebase credentials in .env.local");
  }

  const serviceAccount = JSON.parse(serviceAccountStr);
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }

  console.log(`Getting UID for ${adminEmail}...`);
  const userRecord = await admin.auth().getUserByEmail(adminEmail);
  
  console.log("Generating custom token...");
  const customToken = await admin.auth().createCustomToken(userRecord.uid);

  console.log("Exchanging for ID token...");
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: customToken, returnSecureToken: true })
  });
  
  const data = await res.json();
  if (!data.idToken) {
    throw new Error("Failed to get ID token: " + JSON.stringify(data));
  }

  console.log("Generating session cookie on local server...");
  const sessionRes = await fetch("http://localhost:3001/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: data.idToken })
  });
  
  const setCookieHeader = sessionRes.headers.get("set-cookie");
  if (!setCookieHeader) {
    throw new Error("No set-cookie header received from local server");
  }

  // Extract just the session=... part
  const match = setCookieHeader.match(/(session=[^;]+)/);
  if (!match) {
    throw new Error("Could not parse session cookie from: " + setCookieHeader);
  }

  console.log("✅ Session cookie acquired!");
  return match[1];
}

async function run() {
  const reportsDir = path.join(process.cwd(), ".lighthouse-reports");
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir);
  }

  console.log("--- Step 1: Building project ---");
  execSync("npm run build", { stdio: "inherit" });

  console.log("\n--- Step 2: Starting server on port 3001 ---");
  const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";
  const server = spawn(npxCmd, ["next", "start", "-p", "3001"], {
    stdio: "inherit",
  });

  console.log("Waiting for server to initialize...");
  await new Promise((resolve) => setTimeout(resolve, 15000));

  let sessionCookie = "";
  try {
    sessionCookie = await getSessionCookie();
  } catch (err) {
    console.error("Failed to authenticate. Running without auth.", err.message);
  }

  console.log("\n--- Step 3: Running audits ---");
  const extraHeaders = sessionCookie ? `--extra-headers="{\\"Cookie\\":\\"${sessionCookie}\\"}"` : "";

  for (const page of pages) {
    console.log(`\nAuditing ${page.name.toUpperCase()}...`);
    const outputPath = path.join(reportsDir, `${page.name}.html`);
    try {
      execSync(
        `npx lighthouse ${page.url} --output html --output-path="${outputPath}" --chrome-flags="--headless --no-sandbox --disable-gpu" ${extraHeaders}`,
        { stdio: "inherit" }
      );
      console.log(`✅ Report saved to: ${outputPath}`);
    } catch (err) {
      console.error("❌ Failed to audit %s:", page.name, err.message);
    }
  }

  console.log("\n--- All audits complete! ---");
  console.log(`Check the results in: ${reportsDir}`);

  console.log("Shutting down server...");
  try {
    if (process.platform === "win32") {
      execSync(`taskkill /pid ${server.pid} /T /F`, { stdio: "ignore" });
    } else {
      server.kill();
    }
  } catch (e) {
    // Ignore cleanup errors
  }
  process.exit(0);
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
