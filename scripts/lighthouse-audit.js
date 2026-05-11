import { spawn, execSync } from "child_process";
import fs from "fs";
import path from "path";

const pages = [
  { url: "http://localhost:3001/", name: "home" },
  { url: "http://localhost:3001/club", name: "club" },
  { url: "http://localhost:3001/recovery-zone", name: "recovery" },
  { url: "http://localhost:3001/login", name: "login" },
];

async function run() {
  const reportsDir = path.join(process.cwd(), ".lighthouse-reports");
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir);
  }

  console.log("--- Step 1: Building project ---");
  execSync("npm run build", { stdio: "inherit" });

  console.log("\n--- Step 2: Starting server on port 3001 ---");
  // Use spawn for the server so it runs in the background
  const server = spawn("npx", ["next", "start", "-p", "3001"], {
    shell: true,
    stdio: "inherit",
  });

  // Give the server time to start
  console.log("Waiting for server to initialize...");
  await new Promise((resolve) => setTimeout(resolve, 10000));

  console.log("\n--- Step 3: Running audits ---");
  for (const page of pages) {
    console.log(`\nAuditing ${page.name.toUpperCase()}...`);
    const outputPath = path.join(reportsDir, `${page.name}.html`);
    try {
      // Use npx lighthouse directly for better Windows compatibility
      execSync(
        `npx lighthouse ${page.url} --output html --output-path="${outputPath}" --chrome-flags="--headless --no-sandbox --disable-gpu"`,
        { stdio: "inherit" }
      );
      console.log(`✅ Report saved to: ${outputPath}`);
    } catch (err) {
      console.error(`❌ Failed to audit ${page.name}:`, err.message);
    }
  }

  console.log("\n--- All audits complete! ---");
  console.log(`Check the results in: ${reportsDir}`);

  // Cleanup: kill the server process tree
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
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
