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
const staticOnly = args.includes("--static-only");
const includeDynamic = !staticOnly; // По подразбиране: включва абсолютно всички открити страници
const modeArg = args.find((a) => a.startsWith("--mode="))?.split("=")[1];
const presetArg = args.find((a) => a.startsWith("--preset="))?.split("=")[1];

// По подразбиране сканираме и ДВАТА режима: DESKTOP и MOBILE за всяка една страница
let modes = ["desktop", "mobile"];
if (modeArg === "desktop" || presetArg === "desktop") {
  modes = ["desktop"];
} else if (modeArg === "mobile" || presetArg === "mobile") {
  modes = ["mobile"];
}

const limitArg = args.find((a) => a.startsWith("--limit="))?.split("=")[1];
const pageLimit = limitArg ? parseInt(limitArg, 10) : Infinity;
const targetUrlArg = args.find((a) => a.startsWith("--url="))?.split("=")[1];
const routeArg = args.find((a) => a.startsWith("--route="))?.split("=")[1];

const baseUrl =
  targetUrlArg ||
  (isLocal ? "http://localhost:3001" : "https://bkgalabovo2025.vercel.app");

/**
 * 1. Извличане на примерни ID-та от Firestore за реалистичен одит на динамичните маршрути
 */
async function getSampleRouteParams(adminApp) {
  const params = {
    id: "demo",
    certId: "demo",
    campId: "demo",
    tournamentId: "BOnOr5KWLoyU7xs3z4z8",
    serviceId: "default",
    sessionId: "default",
    campaignId: "default",
    token: "demo",
  };

  if (!adminApp) return params;

  try {
    const db = adminApp.firestore();
    const [
      membersSnap,
      servicesSnap,
      eventsSnap,
      campaignsSnap,
      tournamentsSnap,
      campsSnap,
      certsSnap,
      docsSnap,
    ] = await Promise.all([
      db
        .collection("members")
        .limit(1)
        .get()
        .catch(() => null),
      db
        .collection("services")
        .limit(1)
        .get()
        .catch(() => null),
      db
        .collection("events")
        .where("type", "==", "training")
        .limit(1)
        .get()
        .catch(() => null),
      db
        .collection("feedback_campaigns")
        .limit(1)
        .get()
        .catch(() => null),
      db
        .collection("tournaments")
        .limit(1)
        .get()
        .catch(() => null),
      db
        .collection("events")
        .where("type", "==", "camp")
        .limit(1)
        .get()
        .catch(() => null),
      db
        .collection("certificates")
        .limit(1)
        .get()
        .catch(() => null),
      db
        .collection("document_requests")
        .limit(1)
        .get()
        .catch(() => null),
    ]);

    if (membersSnap && !membersSnap.empty) {
      params.id = membersSnap.docs[0].id;
    }
    if (servicesSnap && !servicesSnap.empty) {
      params.serviceId = servicesSnap.docs[0].id;
    }
    if (eventsSnap && !eventsSnap.empty) {
      params.sessionId = eventsSnap.docs[0].id;
    }
    if (campaignsSnap && !campaignsSnap.empty) {
      params.campaignId = campaignsSnap.docs[0].id;
    }
    if (tournamentsSnap && !tournamentsSnap.empty) {
      params.tournamentId = tournamentsSnap.docs[0].id;
    }
    if (campsSnap && !campsSnap.empty) {
      params.campId = campsSnap.docs[0].id;
    }
    if (certsSnap && !certsSnap.empty) {
      params.certId = certsSnap.docs[0].id;
    }
    if (docsSnap && !docsSnap.empty) {
      const docData = docsSnap.docs[0].data();
      if (docData && docData.token) {
        params.token = docData.token;
      }
    }
  } catch {
    // fallback
  }

  return params;
}

/**
 * 2. Динамично откриване на всички маршрути в src/app (без ограничение)
 */
function discoverRoutes(sampleParams = {}) {
  const rootDir = path.resolve(process.cwd(), "src", "app");
  const routes = [];

  function crawl(currentDir, currentBase = "") {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const safeName = path.basename(entry.name);
      if (
        !safeName ||
        safeName === "." ||
        safeName === ".." ||
        safeName.includes("..")
      ) {
        continue;
      }

      // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
      const fullPath = path.resolve(currentDir, safeName);
      if (!fullPath.startsWith(rootDir)) {
        continue;
      }

      if (entry.isDirectory()) {
        const nextBase = currentBase ? `${currentBase}/${safeName}` : safeName;
        crawl(fullPath, nextBase);
      } else if (/^page\.(tsx|jsx|js|ts)$/.test(safeName)) {
        // Премахване на route groups като (protected), @slots и др.
        const segments = currentBase
          .split("/")
          .filter((s) => s && !s.startsWith("(") && !s.startsWith("@"));

        const routePath = "/" + segments.join("/");
        const route = routePath === "" ? "/" : routePath;
        const isDynamic = route.includes("[");

        // Заместване на параметри с валидни/тестови стойности за динамичните маршрути
        let testRoute = route;
        if (isDynamic) {
          testRoute = testRoute
            .replace(/\[serviceId\]/g, sampleParams.serviceId || "default")
            .replace(/\[campaignId\]/g, sampleParams.campaignId || "default")
            .replace(/\[sessionId\]/g, sampleParams.sessionId || "default")
            .replace(/\[token\]/g, sampleParams.token || "demo");

          if (route.startsWith("/cert/")) {
            testRoute = testRoute.replace(
              /\[id\]/g,
              sampleParams.certId || sampleParams.id || "demo"
            );
          } else if (
            route.startsWith("/club/camps/") ||
            route.startsWith("/training/camps/")
          ) {
            testRoute = testRoute.replace(
              /\[id\]/g,
              sampleParams.campId || "demo"
            );
          } else if (route.startsWith("/tournaments/")) {
            testRoute = testRoute.replace(
              /\[id\]/g,
              sampleParams.tournamentId || "demo"
            );
          } else {
            testRoute = testRoute.replace(/\[id\]/g, sampleParams.id || "demo");
          }
        }

        routes.push({
          rawRoute: route,
          urlRoute: testRoute,
          isDynamic,
          filePath: fullPath,
          name: (route === "/"
            ? "home"
            : route.replace(/^\//, "").replace(/\//g, "-").replace(/\[|\]/g, "")
          ).toLowerCase(),
        });
      }
    }
  }

  crawl(rootDir);
  return routes;
}

/**
 * 3. Автентикация за достъп до защитените страници
 */
async function getSessionCookieAndApp(serverBaseUrl) {
  console.log("--- Автентикация на Lighthouse за административен достъп ---");
  const serviceAccountStr =
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
    process.env.FIREBASE_BACKUP_SERVICE_ACCOUNT_JSON;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const adminEmail = process.env.EMAIL_USER;

  let adminApp = null;
  let sessionCookie = "";

  if (!serviceAccountStr || !apiKey || !adminEmail) {
    console.warn(
      "⚠️ Липсват Firebase данни в .env.local. Тестът ще се изпълни като публичен потребител."
    );
    return { sessionCookie, adminApp };
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountStr);
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(
        /\\n/g,
        "\n"
      );
    }
    if (!admin.apps.length) {
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      adminApp = admin.app();
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
      return { sessionCookie, adminApp };
    }

    const sessionRes = await fetch(`${serverBaseUrl}/api/auth/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: data.idToken }),
    });

    const setCookieHeader = sessionRes.headers.get("set-cookie");
    if (!setCookieHeader) {
      console.warn("⚠️ Не е получен set-cookie хедър.");
      return { sessionCookie, adminApp };
    }

    const match = setCookieHeader.match(/(session=[^;]+)/);
    if (match) {
      console.log(
        "✅ Успешно придобита администраторска сесийна бисквитка (session cookie)!"
      );
      sessionCookie = match[1];
    }
  } catch (err) {
    console.warn(
      "⚠️ Автентикацията не успя. Тестът продължава без сесия:",
      err.message
    );
  }
  return { sessionCookie, adminApp };
}

/**
 * 4. Главно изпълнение на одита
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

  // Придобиване на сесийна бисквитка и Firebase Admin за параметрите
  const { sessionCookie, adminApp } = await getSessionCookieAndApp(baseUrl);
  let extraHeaders = "";
  if (sessionCookie) {
    const headersFilePath = path.join(reportsDir, ".lighthouse-headers.json");
    fs.writeFileSync(
      headersFilePath,
      JSON.stringify({
        Cookie: sessionCookie,
      }),
      "utf8"
    );
    extraHeaders = `--extra-headers="${headersFilePath}"`;
  }

  const sampleParams = await getSampleRouteParams(adminApp);

  // Откриване на ВСИЧКИ страници
  const allDiscovered = discoverRoutes(sampleParams);
  console.log(`\n🔍 Открити общо ${allDiscovered.length} страници в src/app.`);

  // Избор на страници за одит (сканира се всяка открита страница)
  let targetPages = allDiscovered;
  if (staticOnly) {
    targetPages = targetPages.filter((p) => !p.isDynamic);
    console.log(
      `ℹ️ Избрани за одит: ${targetPages.length} статични страници (--static-only).`
    );
  } else {
    console.log(
      `ℹ️ Избрани за одит: ${targetPages.length} страници (всички открити страници в проекта).`
    );
  }

  if (routeArg) {
    const normalized = routeArg.startsWith("/") ? routeArg : `/${routeArg}`;
    targetPages = targetPages.filter(
      (p) => p.rawRoute === normalized || p.urlRoute === normalized
    );
    console.log(
      `🎯 Филтриране за конкретен маршрут: ${normalized} (${targetPages.length} намерена страница).`
    );
  }

  if (pageLimit < targetPages.length) {
    targetPages = targetPages.slice(0, pageLimit);
    console.log(
      `⚡ Ограничение до първите ${pageLimit} страници (--limit=${pageLimit}).`
    );
  }

  const modesDisplay = modes.map((m) => m.toUpperCase()).join(" + ");
  console.log(`\n🎯 Базов URL: ${baseUrl}`);
  console.log(`📱 Режим: ${modesDisplay} (за всяка отделна страница)`);
  console.log(
    `🚀 Стартиране на сканирането на ${targetPages.length} страници в ${modes.length} режим/а (общо ${targetPages.length * modes.length} одита)...\n`
  );

  const results = [];

  for (let i = 0; i < targetPages.length; i++) {
    const page = targetPages[i];
    const fullUrl = `${baseUrl}${page.urlRoute}`;

    for (const mode of modes) {
      const isDesktop = mode === "desktop";
      const modeLabel = isDesktop ? "DESKTOP 🖥️" : "MOBILE 📱";
      const presetFlag = isDesktop ? "--preset=desktop" : "";
      const fileSuffix = `-${mode}`;
      const outputBase = path.join(reportsDir, `${page.name}${fileSuffix}`);
      const outputHtml = path.join(
        reportsDir,
        `${page.name}${fileSuffix}.report.html`
      );
      const outputJson = path.join(
        reportsDir,
        `${page.name}${fileSuffix}.report.json`
      );
      const fallbackHtml = path.join(
        reportsDir,
        `${page.name}${fileSuffix}.html`
      );
      const fallbackJson = path.join(
        reportsDir,
        `${page.name}${fileSuffix}.json`
      );

      console.log(
        `[${i + 1}/${targetPages.length}] Одит на: ${page.rawRoute} (${fullUrl}) [${modeLabel}]...`
      );

      const cmd = `npx lighthouse "${fullUrl}" --output=html,json --output-path="${outputBase}" --chrome-flags="--headless --no-sandbox --disable-gpu" ${presetFlag} ${extraHeaders} --quiet`;

      try {
        execSync(cmd, { stdio: "ignore" });
      } catch {
        // Windows chrome-launcher EPERM warning се игнорира, ако репортът е генериран успешно
      }

      const actualJson = fs.existsSync(outputJson)
        ? outputJson
        : fs.existsSync(fallbackJson)
          ? fallbackJson
          : null;
      const actualHtml = fs.existsSync(outputHtml)
        ? `${page.name}${fileSuffix}.report.html`
        : fs.existsSync(fallbackHtml)
          ? `${page.name}${fileSuffix}.html`
          : "#";

      if (actualJson) {
        try {
          const data = JSON.parse(fs.readFileSync(actualJson, "utf8"));
          const cats = data.categories || {};
          const audits = data.audits || {};

          const resItem = {
            route: page.rawRoute,
            url: fullUrl,
            mode,
            performance: Math.round((cats.performance?.score || 0) * 100),
            accessibility: Math.round((cats.accessibility?.score || 0) * 100),
            bestPractices: Math.round(
              (cats["best-practices"]?.score || 0) * 100
            ),
            seo: Math.round((cats.seo?.score || 0) * 100),
            fcp: audits["first-contentful-paint"]?.displayValue || "N/A",
            lcp: audits["largest-contentful-paint"]?.displayValue || "N/A",
            cls: audits["cumulative-layout-shift"]?.displayValue || "0",
            reportFile: actualHtml,
          };

          const failures = [];
          if (resItem.performance < 100)
            failures.push(`Perf: ${resItem.performance}`);
          if (resItem.accessibility < 100)
            failures.push(`A11y: ${resItem.accessibility}`);
          if (resItem.bestPractices < 100)
            failures.push(`BP: ${resItem.bestPractices}`);
          if (resItem.seo < 100) failures.push(`SEO: ${resItem.seo}`);

          const failedAudits = [];
          for (const [auditKey, auditVal] of Object.entries(audits)) {
            if (
              auditVal &&
              auditVal.score !== null &&
              auditVal.score < 1 &&
              auditVal.title
            ) {
              failedAudits.push({
                id: auditKey,
                title: auditVal.title,
                score: Math.round(auditVal.score * 100),
              });
            }
          }

          resItem.failedAudits = failedAudits;
          resItem.isFailed = failures.length > 0;
          results.push(resItem);

          if (failures.length === 0) {
            console.log(
              `  ✅ [${mode.toUpperCase()}] 100/100/100/100 (Perf: 100 | A11y: 100 | BP: 100 | SEO: 100)`
            );
          } else {
            console.log(
              `  ❌ [${mode.toUpperCase()}] ПОД 100 -> ${failures.join(" | ")}`
            );
            if (failedAudits.length > 0) {
              console.log(
                `     🔍 Причини за намалена оценка (${failedAudits.length}):`
              );
              failedAudits.slice(0, 5).forEach((fa) => {
                console.log(`        - [${fa.id}] ${fa.title}`);
              });
            }
          }
        } catch (err) {
          console.error(
            "  ✗ Грешка при четене на резултатите за %s (%s): %s",
            page.rawRoute,
            mode,
            err.message
          );
        }
      } else {
        console.warn(
          "  ⚠️ Не беше генериран репорт за %s (%s).",
          page.rawRoute,
          mode
        );
      }
    }
  }

  // Записване на обобщен отчет
  const summaryPath = path.join(reportsDir, "summary.json");
  fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2), "utf8");

  // Изчисляване на статистики
  const desktopResults = results.filter((r) => r.mode === "desktop");
  const mobileResults = results.filter((r) => r.mode === "mobile");

  const calcAverages = (list) => {
    if (!list.length) return { perf: 0, a11y: 0, bp: 0, seo: 0 };
    return {
      perf: Math.round(
        list.reduce((a, b) => a + b.performance, 0) / list.length
      ),
      a11y: Math.round(
        list.reduce((a, b) => a + b.accessibility, 0) / list.length
      ),
      bp: Math.round(
        list.reduce((a, b) => a + b.bestPractices, 0) / list.length
      ),
      seo: Math.round(list.reduce((a, b) => a + b.seo, 0) / list.length),
    };
  };

  const desktopAvg = calcAverages(desktopResults);
  const mobileAvg = calcAverages(mobileResults);

  // Генериране на интерактивен HTML Dashboard
  const htmlDashboard = `<!DOCTYPE html>
<html lang="bg">
<head>
  <meta charset="UTF-8">
  <title>Lighthouse Пълен Одит на Проекта (Desktop & Mobile)</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 2rem; }
    h1 { margin-bottom: 0.25rem; font-size: 1.8rem; }
    p.sub { color: #94a3b8; margin-bottom: 1.5rem; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .stat-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 1.25rem; }
    .stat-card h3 { margin-top: 0; margin-bottom: 0.75rem; font-size: 1.1rem; display: flex; items-center; gap: 0.5rem; }
    .stat-metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; text-align: center; }
    .metric-box { background: #0f172a; padding: 0.5rem; border-radius: 8px; }
    .metric-val { font-size: 1.25rem; font-weight: bold; color: #38bdf8; }
    .metric-label { font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; }
    .filter-bar { margin-bottom: 1rem; display: flex; gap: 0.5rem; }
    .filter-btn { background: #1e293b; border: 1px solid #334155; color: #f8fafc; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 500; }
    .filter-btn.active { background: #2563eb; border-color: #3b82f6; }
    table { width: 100%; border-collapse: collapse; background: #1e293b; border-radius: 8px; overflow: hidden; }
    th, td { padding: 10px 14px; text-align: left; border-bottom: 1px solid #334155; font-size: 0.9rem; }
    th { background: #0f172a; color: #94a3b8; text-transform: uppercase; font-size: 0.72rem; letter-spacing: 0.05em; }
    tr:hover { background: #334155; }
    .badge { padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 0.85rem; display: inline-block; min-width: 28px; text-align: center; }
    .good { background: #065f46; color: #34d399; }
    .average { background: #854d0e; color: #facc15; }
    .poor { background: #991b1b; color: #f87171; }
    .mode-tag { padding: 3px 6px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
    .mode-desktop { background: #1e3a8a; color: #93c5fd; }
    .mode-mobile { background: #701a75; color: #f0abfc; }
    a { color: #38bdf8; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .failed-btn { border-color: #ef4444; color: #f87171; }
    .failed-btn.active { background: #ef4444; color: #ffffff; }
  </style>
</head>
<body>
  <h1>⚡ Lighthouse Обобщен Доклад за Проекта</h1>
  <p class="sub">Тествани общо <b>${results.length} одита</b> на адрес: <code>${baseUrl}</code></p>

  <div class="stats-grid">
    <div class="stat-card">
      <h3>🖥️ Desktop Режим (${desktopResults.length} страници)</h3>
      <div class="stat-metrics">
        <div class="metric-box"><div class="metric-val">${desktopAvg.perf}</div><div class="metric-label">Perf</div></div>
        <div class="metric-box"><div class="metric-val">${desktopAvg.a11y}</div><div class="metric-label">A11y</div></div>
        <div class="metric-box"><div class="metric-val">${desktopAvg.bp}</div><div class="metric-label">BP</div></div>
        <div class="metric-box"><div class="metric-val">${desktopAvg.seo}</div><div class="metric-label">SEO</div></div>
      </div>
    </div>
    <div class="stat-card">
      <h3>📱 Mobile Режим (${mobileResults.length} страници)</h3>
      <div class="stat-metrics">
        <div class="metric-box"><div class="metric-val">${mobileAvg.perf}</div><div class="metric-label">Perf</div></div>
        <div class="metric-box"><div class="metric-val">${mobileAvg.a11y}</div><div class="metric-label">A11y</div></div>
        <div class="metric-box"><div class="metric-val">${mobileAvg.bp}</div><div class="metric-label">BP</div></div>
        <div class="metric-box"><div class="metric-val">${mobileAvg.seo}</div><div class="metric-label">SEO</div></div>
      </div>
    </div>
  </div>

  <div class="filter-bar">
    <button class="filter-btn active" onclick="filterMode('all', this)">Всички (${results.length})</button>
    <button class="filter-btn" onclick="filterMode('desktop', this)">🖥️ Само Desktop (${desktopResults.length})</button>
    <button class="filter-btn" onclick="filterMode('mobile', this)">📱 Само Mobile (${mobileResults.length})</button>
    <button class="filter-btn failed-btn" onclick="filterMode('failed', this)">🚨 Само под 100 (${results.filter((r) => r.isFailed).length})</button>
  </div>

  <table id="auditTable">
    <thead>
      <tr>
        <th>Маршрут</th>
        <th>Режим</th>
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
          (
            r
          ) => `<tr data-mode="${r.mode}" data-failed="${r.isFailed ? "true" : "false"}">
        <td><b>${r.route}</b></td>
        <td><span class="mode-tag ${r.mode === "desktop" ? "mode-desktop" : "mode-mobile"}">${r.mode === "desktop" ? "🖥️ Desktop" : "📱 Mobile"}</span></td>
        <td><span class="badge ${r.performance === 100 ? "good" : r.performance >= 90 ? "average" : "poor"}">${r.performance}</span></td>
        <td><span class="badge ${r.accessibility === 100 ? "good" : r.accessibility >= 90 ? "average" : "poor"}">${r.accessibility}</span></td>
        <td><span class="badge ${r.bestPractices === 100 ? "good" : r.bestPractices >= 90 ? "average" : "poor"}">${r.bestPractices}</span></td>
        <td><span class="badge ${r.seo === 100 ? "good" : r.seo >= 90 ? "average" : "poor"}">${r.seo}</span></td>
        <td>${r.fcp}</td>
        <td>${r.lcp}</td>
        <td><a href="${r.reportFile}" target="_blank">Виж HTML</a></td>
      </tr>`
        )
        .join("\n")}
    </tbody>
  </table>

  <script>
    function filterMode(mode, btn) {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const rows = document.querySelectorAll('#auditTable tbody tr');
      rows.forEach(r => {
        if (mode === 'all') {
          r.style.display = '';
        } else if (mode === 'failed') {
          r.style.display = r.getAttribute('data-failed') === 'true' ? '' : 'none';
        } else {
          r.style.display = r.getAttribute('data-mode') === mode ? '' : 'none';
        }
      });
    }
  </script>
</body>
</html>`;

  fs.writeFileSync(path.join(reportsDir, "index.html"), htmlDashboard, "utf8");

  console.log("\n=======================================================");
  console.log("🎉 ОДИТЪТ ПРИКЛЮЧИ!");
  console.log(
    `📁 Интерактивен HTML дашборд: ${path.join(reportsDir, "index.html")}`
  );
  console.log(`📊 Обобщени JSON данни: ${summaryPath}`);
  console.log("=======================================================\n");

  if (desktopResults.length > 0) {
    console.log(
      `📈 СРЕДНИ ОЦЕНКИ - DESKTOP 🖥️ (${desktopResults.length} страници):`
    );
    console.log(`   - Performance:    ${desktopAvg.perf} / 100`);
    console.log(`   - Accessibility:  ${desktopAvg.a11y} / 100`);
    console.log(`   - Best Practices: ${desktopAvg.bp} / 100`);
    console.log(`   - SEO:            ${desktopAvg.seo} / 100\n`);
  }

  if (mobileResults.length > 0) {
    console.log(
      `📈 СРЕДНИ ОЦЕНКИ - MOBILE 📱 (${mobileResults.length} страници):`
    );
    console.log(`   - Performance:    ${mobileAvg.perf} / 100`);
    console.log(`   - Accessibility:  ${mobileAvg.a11y} / 100`);
    console.log(`   - Best Practices: ${mobileAvg.bp} / 100`);
    console.log(`   - SEO:            ${mobileAvg.seo} / 100\n`);
  }

  const under100 = results.filter((r) => r.isFailed);

  if (server) {
    console.log("Спиране на локалния сървър...");
    try {
      if (process.platform === "win32") {
        execSync(`taskkill /pid ${server.pid} /T /F`, { stdio: "ignore" });
      } else {
        server.kill();
      }
    } catch {}
  }

  if (under100.length > 0) {
    console.log("=======================================================");
    console.log(`🚨 ВНИМАНИЕ: ${under100.length} ОДИТА СА С ОЦЕНКА ПОД 100:`);
    console.log("=======================================================");
    under100.forEach((r) => {
      console.log(`❌ [${r.mode.toUpperCase()}] ${r.route} (${r.url})`);
      console.log(
        `   Perf: ${r.performance} | A11y: ${r.accessibility} | BP: ${r.bestPractices} | SEO: ${r.seo}`
      );
      if (r.failedAudits && r.failedAudits.length > 0) {
        r.failedAudits.slice(0, 3).forEach((fa) => {
          console.log(`   • ${fa.title}`);
        });
      }
    });
    console.log("=======================================================\n");

    const noFail = args.includes("--no-fail");
    if (!noFail) {
      console.error(
        "❌ Одитът приключи с ГРЕШКА, защото има страници с резултат под 100!"
      );
      process.exit(1);
    }
  }
}

run().catch((err) => {
  console.error("Грешка при изпълнение на одита:", err);
  process.exit(1);
});
