import { spawn, execSync } from "child_process";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import admin from "firebase-admin";

// Load environment variables
dotenv.config({ path: ".env.local" });

// Parse command line arguments
const args = process.argv.slice(2);
const isLocal = args.includes("--local");
const includeDynamic = args.includes("--include-dynamic");
const formFactor =
  args.find((a) => a.startsWith("--preset="))?.split("=")[1] || "desktop";
const limitArg = args.find((a) => a.startsWith("--limit="))?.split("=")[1];
const pageLimit = limitArg ? parseInt(limitArg, 10) : Infinity;
const targetUrlArg = args.find((a) => a.startsWith("--url="))?.split("=")[1];

const baseUrl =
  targetUrlArg ||
  (isLocal ? "http://localhost:3001" : "https://bkgalabovo2025.vercel.app");

/**
 * 1. Динамично откриване на всички маршрути в src/app
 */
function discoverRoutes(dir = "src/app", base = "") {
  let routes = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      routes = routes.concat(
        discoverRoutes(fullPath, path.join(base, entry.name))
      );
    } else if (/^page\.(tsx|jsx|js|ts)$/.test(entry.name)) {
      // Премахване на route groups като (protected), @slots и др.
      const segments = base
        .split(path.sep)
        .filter((s) => s && !s.startsWith("(") && !s.startsWith("@"));

      const routePath = "/" + segments.join("/");
      const route = routePath === "" ? "/" : routePath;
      const isDynamic = route.includes("[");

      // Проверка за страници, които са просто redirect към друг маршрут
      let isRedirectOnly = false;
      try {
        const fileContent = fs.readFileSync(fullPath, "utf8");
        if (
          fileContent.includes("redirect(") &&
          !fileContent.includes("<") &&
          fileContent.length < 300
        ) {
          isRedirectOnly = true;
        }
      } catch (e) {}

      // Заместване на параметри с тестови стойности за динамичните маршрути
      let testRoute = route;
      if (isDynamic) {
        testRoute = testRoute
          .replace(/\[serviceId\]/g, "default")
          .replace(/\[campaignId\]/g, "default")
          .replace(/\[sessionId\]/g, "default")
          .replace(/\[token\]/g, "demo")
          .replace(/\[id\]/g, "demo");
      }

      routes.push({
        rawRoute: route,
        urlRoute: testRoute,
        isDynamic,
        isRedirectOnly,
        filePath: fullPath,
        name: (route === "/"
          ? "home"
          : route.replace(/^\//, "").replace(/\//g, "-")
        ).toLowerCase(),
      });
    }
  }
  return routes;
}

/**
 * 2. Автентикация за достъп до защитените страници
 */
async function getSessionCookie(serverBaseUrl) {
  console.log("--- Автентикация на Lighthouse за административен достъп ---");
  const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const adminEmail = process.env.EMAIL_USER;

  if (!serviceAccountStr || !apiKey || !adminEmail) {
    console.warn(
      "⚠️ Липсват Firebase данни в .env.local. Тестът ще се изпълни като публичен потребител."
    );
    return "";
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountStr);
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }

    const userRecord = await admin.auth().getUserByEmail(adminEmail);
    const customToken = await admin.auth().createCustomToken(userRecord.uid);

    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: customToken, returnSecureToken: true }),
      }
    );

    const data = await res.json();
    if (!data.idToken) {
      console.warn(
        "⚠️ Неуспешно генериране на ID Token:",
        JSON.stringify(data)
      );
      return "";
    }

    const sessionRes = await fetch(`${serverBaseUrl}/api/auth/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: data.idToken }),
    });

    const setCookieHeader = sessionRes.headers.get("set-cookie");
    if (!setCookieHeader) {
      console.warn("⚠️ Не е получен set-cookie хедър.");
      return "";
    }

    const match = setCookieHeader.match(/(session=[^;]+)/);
    if (match) {
      console.log(
        "✅ Успешно придобита администраторска сесийна бисквитка (session cookie)!"
      );
      return match[1];
    }
  } catch (err) {
    console.warn(
      "⚠️ Автентикацията не успя. Тестът продължава без сесия:",
      err.message
    );
  }
  return "";
}

/**
 * 3. Главно изпълнение на одита
 */
async function run() {
  const reportsDir = path.join(process.cwd(), ".lighthouse-reports");
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  let server = null;
  if (isLocal) {
    console.log("--- Стъпка 1: Компилиране на чист билд локално ---");
    execSync("npm run build", { stdio: "inherit" });

    console.log("\n--- Стъпка 2: Стартиране на сървъра на порт 3001 ---");
    const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";
    server = spawn(npxCmd, ["next", "start", "-p", "3001"], {
      stdio: "inherit",
    });

    console.log("Изчакване на локалния сървър (10 сек)...");
    await new Promise((r) => setTimeout(r, 10000));
  }

  // Откриване на всички страници
  const allDiscovered = discoverRoutes();
  console.log(`\n🔍 Открити общо ${allDiscovered.length} страници в src/app.`);

  // Филтриране
  let targetPages = allDiscovered.filter((p) => !p.isRedirectOnly);
  if (!includeDynamic) {
    targetPages = targetPages.filter((p) => !p.isDynamic);
    console.log(
      `ℹ️ Избрани за одит: ${targetPages.length} статични/фиксирани страници (използвайте --include-dynamic за динамичните).`
    );
  } else {
    console.log(
      `ℹ️ Избрани за одит: ${targetPages.length} страници (включително динамичните с примерни параметри).`
    );
  }

  if (pageLimit < targetPages.length) {
    targetPages = targetPages.slice(0, pageLimit);
    console.log(
      `⚡ Ограничение до първите ${pageLimit} страници (--limit=${pageLimit}).`
    );
  }

  // Придобиване на сесийна бисквитка
  const sessionCookie = await getSessionCookie(baseUrl);
  const extraHeaders = sessionCookie
    ? `--extra-headers="{\\"Cookie\\":\\"${sessionCookie}\\"}"`
    : "";

  console.log(`\n🎯 Базов URL: ${baseUrl}`);
  console.log(`📱 Режим: ${formFactor.toUpperCase()}`);
  console.log(
    `🚀 Стартиране на сканирането на ${targetPages.length} страници...\n`
  );

  const results = [];
  const presetFlag = formFactor === "desktop" ? "--preset=desktop" : "";

  for (let i = 0; i < targetPages.length; i++) {
    const page = targetPages[i];
    const fullUrl = `${baseUrl}${page.urlRoute}`;
    const outputBase = path.join(reportsDir, page.name);
    const outputHtml = path.join(reportsDir, `${page.name}.report.html`);
    const outputJson = path.join(reportsDir, `${page.name}.report.json`);
    const fallbackHtml = path.join(reportsDir, `${page.name}.html`);
    const fallbackJson = path.join(reportsDir, `${page.name}.json`);

    console.log(
      `[${i + 1}/${targetPages.length}] Одит на: ${page.rawRoute} (${fullUrl})...`
    );

    const cmd = `npx lighthouse "${fullUrl}" --output=html,json --output-path="${outputBase}" --chrome-flags="--headless --no-sandbox --disable-gpu" ${presetFlag} ${extraHeaders} --quiet`;

    try {
      execSync(cmd, { stdio: "ignore" });
    } catch (e) {
      // Windows chrome-launcher EPERM warning се игнорира, ако репортът е генериран успешно
    }

    const actualJson = fs.existsSync(outputJson)
      ? outputJson
      : fs.existsSync(fallbackJson)
        ? fallbackJson
        : null;
    const actualHtml = fs.existsSync(outputHtml)
      ? `${page.name}.report.html`
      : fs.existsSync(fallbackHtml)
        ? `${page.name}.html`
        : "#";

    if (actualJson) {
      try {
        const data = JSON.parse(fs.readFileSync(actualJson, "utf8"));
        const cats = data.categories || {};
        const audits = data.audits || {};

        results.push({
          route: page.rawRoute,
          url: fullUrl,
          performance: Math.round((cats.performance?.score || 0) * 100),
          accessibility: Math.round((cats.accessibility?.score || 0) * 100),
          bestPractices: Math.round((cats["best-practices"]?.score || 0) * 100),
          seo: Math.round((cats.seo?.score || 0) * 100),
          fcp: audits["first-contentful-paint"]?.displayValue || "N/A",
          lcp: audits["largest-contentful-paint"]?.displayValue || "N/A",
          cls: audits["cumulative-layout-shift"]?.displayValue || "0",
          reportFile: actualHtml,
        });

        console.log(
          `  ✓ Perf: ${results[results.length - 1].performance} | A11y: ${results[results.length - 1].accessibility} | BP: ${results[results.length - 1].bestPractices} | SEO: ${results[results.length - 1].seo}`
        );
      } catch (err) {
        console.error(
          `  ✗ Грешка при четене на резултатите за ${page.rawRoute}:`,
          err.message
        );
      }
    } else {
      console.warn(`  ⚠️ Не беше генериран репорт за ${page.rawRoute}.`);
    }
  }

  // Записване на обобщен отчет
  const summaryPath = path.join(reportsDir, "summary.json");
  fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2), "utf8");

  // Генериране на интерактивен HTML Dashboard
  const htmlDashboard = `<!DOCTYPE html>
<html lang="bg">
<head>
  <meta charset="UTF-8">
  <title>Lighthouse Пълен Одит на Проекта</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 2rem; }
    h1 { margin-bottom: 0.5rem; }
    p.sub { color: #94a3b8; margin-bottom: 2rem; }
    table { width: 100%; border-collapse: collapse; background: #1e293b; border-radius: 8px; overflow: hidden; }
    th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #334155; }
    th { background: #0f172a; color: #94a3b8; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; }
    tr:hover { background: #334155; }
    .badge { padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 0.85rem; }
    .good { background: #065f46; color: #34d399; }
    .average { background: #854d0e; color: #facc15; }
    .poor { background: #991b1b; color: #f87171; }
    a { color: #38bdf8; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>⚡ Lighthouse Обобщен Доклад за Проекта</h1>
  <p class="sub">Тествани ${results.length} страници в режим <b>${formFactor.toUpperCase()}</b> на адрес: <code>${baseUrl}</code></p>
  <table>
    <thead>
      <tr>
        <th>Маршрут</th>
        <th>Performance</th>
        <th>Accessibility</th>
        <th>Best Practices</th>
        <th>SEO</th>
        <th>FCP</th>
        <th>LCP</th>
        <th>Доклад</th>
      </tr>
    </thead>
    <tbody>
      ${results
        .map(
          (r) => `<tr>
        <td><b>${r.route}</b></td>
        <td><span class="badge ${r.performance >= 90 ? "good" : r.performance >= 50 ? "average" : "poor"}">${r.performance}</span></td>
        <td><span class="badge ${r.accessibility >= 90 ? "good" : r.accessibility >= 50 ? "average" : "poor"}">${r.accessibility}</span></td>
        <td><span class="badge ${r.bestPractices >= 90 ? "good" : r.bestPractices >= 50 ? "average" : "poor"}">${r.bestPractices}</span></td>
        <td><span class="badge ${r.seo >= 90 ? "good" : r.seo >= 50 ? "average" : "poor"}">${r.seo}</span></td>
        <td>${r.fcp}</td>
        <td>${r.lcp}</td>
        <td><a href="${r.reportFile}" target="_blank">Виж HTML</a></td>
      </tr>`
        )
        .join("\n")}
    </tbody>
  </table>
</body>
</html>`;

  fs.writeFileSync(path.join(reportsDir, "index.html"), htmlDashboard, "utf8");

  console.log("\n=======================================================");
  console.log("🎉 ОДИТЪТ НА ВСИЧКИ СТРАНИЦИ ЗАВЪРШИ УСПЕШНО!");
  console.log(
    `📁 Интерактивен HTML дашборд: ${path.join(reportsDir, "index.html")}`
  );
  console.log(`📊 Обобщени JSON данни: ${summaryPath}`);
  console.log("=======================================================\n");

  // Изчисляване на средни стойности
  if (results.length > 0) {
    const avgPerf = Math.round(
      results.reduce((a, b) => a + b.performance, 0) / results.length
    );
    const avgA11y = Math.round(
      results.reduce((a, b) => a + b.accessibility, 0) / results.length
    );
    const avgBP = Math.round(
      results.reduce((a, b) => a + b.bestPractices, 0) / results.length
    );
    const avgSEO = Math.round(
      results.reduce((a, b) => a + b.seo, 0) / results.length
    );

    console.log(
      `📈 СРЕДНИ ОЦЕНКИ ЗА ЦЕЛИЯ ПРОЕКТ (${results.length} страници):`
    );
    console.log(`   - Performance:    ${avgPerf} / 100`);
    console.log(`   - Accessibility:  ${avgA11y} / 100`);
    console.log(`   - Best Practices: ${avgBP} / 100`);
    console.log(`   - SEO:            ${avgSEO} / 100\n`);
  }

  if (server) {
    console.log("Спиране на локалния сървър...");
    try {
      if (process.platform === "win32") {
        execSync(`taskkill /pid ${server.pid} /T /F`, { stdio: "ignore" });
      } else {
        server.kill();
      }
    } catch (e) {}
  }
}

run().catch((err) => {
  console.error("Грешка при изпълнение на одита:", err);
  process.exit(1);
});
