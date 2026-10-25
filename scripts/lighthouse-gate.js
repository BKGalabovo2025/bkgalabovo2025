import { execSync, spawn } from "child_process";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const args = process.argv.slice(2);
const isLocal = args.includes("--local");
const targetUrlArg = args.find((a) => a.startsWith("--url="))?.split("=")[1];

const baseUrl =
  targetUrlArg ||
  (isLocal ? "http://localhost:3001" : "https://bkgalabovo2025.vercel.app");

// Представителни ключови цели за бърз качествен контрол
const GATE_TARGETS = [
  {
    name: "home_desktop",
    label: "Начална страница (Desktop)",
    route: "/",
    preset: "desktop",
    minPerf: 95,
    minA11y: 95,
    minBP: 90,
    minSEO: 100,
  },
  {
    name: "home_mobile",
    label: "Начална страница (Mobile)",
    route: "/",
    preset: "mobile",
    minPerf: 85,
    minA11y: 95,
    minBP: 90,
    minSEO: 100,
  },
  {
    name: "club_desktop",
    label: "Портал БК Гълъбово (Desktop)",
    route: "/club",
    preset: "desktop",
    minPerf: 95,
    minA11y: 95,
    minBP: 90,
    minSEO: 100,
  },
  {
    name: "recovery_desktop",
    label: "Recovery Zone Каталог (Desktop)",
    route: "/recovery-zone/catalog",
    preset: "desktop",
    minPerf: 95,
    minA11y: 95,
    minBP: 90,
    minSEO: 100,
  },
];

async function runGate() {
  console.log("=======================================================");
  console.log("🚦 LIGHTHOUSE QUALITY GATE (КОНТРОЛ ПРЕДИ КАЧВАНЕ)");
  console.log(`🎯 Базов адрес: ${baseUrl}`);
  console.log(
    `📋 Проверка на ${GATE_TARGETS.length} представителни маршрута...`
  );
  console.log("=======================================================\n");

  const gateReportsDir = path.join(
    process.cwd(),
    ".lighthouse-reports",
    "gate"
  );
  if (!fs.existsSync(gateReportsDir)) {
    fs.mkdirSync(gateReportsDir, { recursive: true });
  }

  let server = null;
  const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";

  if (isLocal) {
    try {
      if (process.platform === "win32") {
        const out = execSync("netstat -ano | findstr :3001", {
          encoding: "utf8",
        });
        const pids = out
          .split("\n")
          .map((l) => l.trim().split(/\s+/).pop())
          .filter(Boolean);
        for (const pid of pids) {
          if (pid && pid !== "0" && !isNaN(Number(pid))) {
            try {
              execSync(`taskkill /pid ${pid} /F /T`, { stdio: "ignore" });
            } catch {}
          }
        }
      }
    } catch {}

    console.log("Стартиране на локален производствен сървър на порт 3001...");
    server = spawn(npxCmd, ["next", "start", "-p", "3001"], {
      stdio: "ignore",
      shell: true,
    });

    let ready = false;
    for (let p = 0; p < 25; p++) {
      try {
        const res = await fetch("http://localhost:3001");
        if (res.status < 500) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 1000));
    }
    if (!ready) {
      console.warn(
        "Предупреждение: Сървърът на порт 3001 може би все още се зарежда."
      );
    }
  }

  const results = [];
  let hasFailures = false;

  for (let i = 0; i < GATE_TARGETS.length; i++) {
    const target = GATE_TARGETS[i];
    const fullUrl = `${baseUrl}${target.route}`;
    const outputBase = path.join(gateReportsDir, target.name);
    const presetFlag = target.preset === "desktop" ? "--preset=desktop" : "";

    console.log(
      `[${i + 1}/${GATE_TARGETS.length}] Тестване на ${target.label}...`
    );

    // Предварително загряване на маршрута (запълване на SSR кеша)
    try {
      await fetch(fullUrl);
    } catch {}

    const candidateFiles = [
      `${outputBase}.json`,
      `${outputBase}.report.json`,
      outputBase,
    ];

    // Изчистване на стари репорти за нов актуален одит
    for (const f of candidateFiles) {
      if (fs.existsSync(f)) {
        try {
          fs.unlinkSync(f);
        } catch {}
      }
    }

    let actualJson = null;

    for (let attempt = 1; attempt <= 2 && !actualJson; attempt++) {
      const cmd = `${npxCmd} lighthouse "${fullUrl}" --output=json --output-path="${outputBase}.json" --chrome-flags="--headless --no-sandbox --disable-gpu" ${presetFlag} --quiet`;

      try {
        execSync(cmd, { stdio: "ignore" });
      } catch {
        // Игнорира се потенциален Windows chrome-launcher cleanup lock
      }

      actualJson = candidateFiles.find((p) => fs.existsSync(p));
    }

    if (!actualJson) {
      console.error("  ❌ Не можа да се генерира репорт за %s!", target.label);
      hasFailures = true;
      continue;
    }

    try {
      const data = JSON.parse(fs.readFileSync(actualJson, "utf8"));
      const cats = data.categories || {};
      const perf = Math.round((cats.performance?.score || 0) * 100);
      const a11y = Math.round((cats.accessibility?.score || 0) * 100);
      const bp = Math.round((cats["best-practices"]?.score || 0) * 100);
      const seo = Math.round((cats.seo?.score || 0) * 100);

      const perfPass = perf >= target.minPerf;
      const a11yPass = a11y >= target.minA11y;
      const bpPass = bp >= target.minBP;
      const seoPass = seo >= target.minSEO;

      const targetPassed = perfPass && a11yPass && bpPass && seoPass;
      if (!targetPassed) {
        hasFailures = true;
      }

      results.push({
        label: target.label,
        preset: target.preset,
        perf,
        minPerf: target.minPerf,
        perfPass,
        a11y,
        minA11y: target.minA11y,
        a11yPass,
        bp,
        minBP: target.minBP,
        bpPass,
        seo,
        minSEO: target.minSEO,
        seoPass,
        passed: targetPassed,
      });

      const statusIcon = targetPassed ? "✅" : "❌";
      console.log(
        `  ${statusIcon} Perf: ${perf}/${target.minPerf} | A11y: ${a11y}/${target.minA11y} | BP: ${bp}/${target.minBP} | SEO: ${seo}/${target.minSEO}`
      );
    } catch (err) {
      console.error(
        "  ❌ Грешка при обработка на резултатите: %s",
        err.message
      );
      hasFailures = true;
    }
  }

  if (server) {
    try {
      if (process.platform === "win32") {
        execSync(`taskkill /pid ${server.pid} /T /F`, { stdio: "ignore" });
      } else {
        server.kill();
      }
    } catch {}
  }

  // Обобщена таблица
  console.log("\n=======================================================");
  console.log("📊 ОБОБЩЕНИ РЕЗУЛТАТИ ОТ LIGHTHOUSE QUALITY GATE:");
  console.log("=======================================================");

  results.forEach((r) => {
    const badge = r.passed ? "✓ PASS" : "✗ FAIL";
    console.log(`\n[${badge}] ${r.label}`);
    console.log(
      `   - Performance:    ${r.perf} / 100  (Минимум: ${r.minPerf}) ${r.perfPass ? "OK" : "⚠️ ПОД ПРАГА"}`
    );
    console.log(
      `   - Accessibility:  ${r.a11y} / 100  (Минимум: ${r.minA11y}) ${r.a11yPass ? "OK" : "⚠️ ПОД ПРАГА"}`
    );
    console.log(
      `   - Best Practices: ${r.bp} / 100  (Минимум: ${r.minBP}) ${r.bpPass ? "OK" : "⚠️ ПОД ПРАГА"}`
    );
    console.log(
      `   - SEO:            ${r.seo} / 100  (Минимум: ${r.minSEO}) ${r.seoPass ? "OK" : "⚠️ ПОД ПРАГА"}`
    );
  });

  console.log("\n=======================================================");

  if (hasFailures) {
    console.error(
      "❌ LIGHTHOUSE QUALITY GATE: НЕПРЕМИНАТ! Кодът не отговаря на изискванията за качество."
    );
    console.error(
      "Моля коригирайте посочените по-горе отклонения преди да качите в хранилището.\n"
    );
    process.exit(1);
  } else {
    console.log(
      "🎉 ВСИЧКИ МЕТРИКИ СА В НОРМА! Проектът е готов за безопасно качване в GitHub.\n"
    );
    process.exit(0);
  }
}

runGate().catch((err) => {
  console.error("Грешка при изпълнение на Quality Gate:", err);
  process.exit(1);
});
