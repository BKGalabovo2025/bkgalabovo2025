import {
  generatePdfFromElement,
  getPdfBlobFromElement,
} from "@/lib/html-to-pdf";
import { WorkoutProgram } from "@/services/ai-workout-context-service";

function getIntensityBadgeColor(intensity: "low" | "medium" | "high"): string {
  if (intensity === "high") return "#ef4444";
  if (intensity === "medium") return "#f59e0b";
  return "#10b981";
}

function formatDayCalendarDate(dateStr?: string) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("bg-BG", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/**
 * Builds a styled, branded multi-page HTML string representing the workout program
 * and progress tracking journal for Badminton Club Galabovo.
 * Each page is an A4 container with class `pdf-page`.
 */
export function renderWorkoutProgramHtml(
  program: Partial<WorkoutProgram>,
  athleteFallbackName?: string
): string {
  const progRecord = program as unknown as Record<string, unknown>;
  const rawAthlete = program.targetAthlete;
  const athleteName =
    rawAthlete?.name ||
    athleteFallbackName ||
    (progRecord.memberName as string) ||
    (progRecord.athleteName as string) ||
    "Състезател на БК Гълъбово";

  const athleteAge =
    rawAthlete?.age !== undefined && rawAthlete.age !== null
      ? `${rawAthlete.age} г.`
      : "БК Гълъбово";
  const athleteAgeGroup = rawAthlete?.ageGroup || "Обща";
  const athleteSkillLevel = rawAthlete?.skillLevel || "Състезател";

  const rawSafety = program.safetyAudit;
  const isDeload = Boolean(rawSafety?.fatigueDeloadActive);
  const activeRestrictions = Array.isArray(rawSafety?.activeRestrictions)
    ? rawSafety!.activeRestrictions
    : [];
  const coachSafetyNotes = rawSafety?.coachSafetyNotes || "";

  const schedule = Array.isArray(program.schedule) ? program.schedule : [];

  // Determine total pages:
  // Page 1: Overview & Cycle Progress Log
  // Pages 2..N: Daily Workout Cards (1 day per page)
  // Last Page: Recovery, Theory Assignment & Medical/Coach Signoff
  const totalPages = Math.max(1, 1 + schedule.length + 1);

  const safetyAlertBg = isDeload ? "#fef2f2" : "#f0fdf4";
  const safetyAlertBorder = isDeload ? "#fca5a5" : "#86efac";
  const safetyAlertTitleColor = isDeload ? "#991b1b" : "#166534";
  const safetyAlertTitle = isDeload
    ? "ВНИМАНИЕ: АКТИВИРАН DELOAD РЕЖИМ (ВИСОКА УМОРА)"
    : "ПРЕДПАЗНИ МЕРКИ И БЕЗОПАСНОСТ";

  const formattedGeneratedDate = (() => {
    const rawDate = program.generatedAt || (progRecord.createdAt as string);
    if (!rawDate) return new Date().toLocaleDateString("bg-BG");
    try {
      const d = new Date(rawDate);
      return isNaN(d.getTime())
        ? new Date().toLocaleDateString("bg-BG")
        : d.toLocaleDateString("bg-BG");
    } catch {
      return new Date().toLocaleDateString("bg-BG");
    }
  })();

  // --------------------------------------------------------------------------
  // PAGE 1: Overview & Cycle Progress Tracker
  // --------------------------------------------------------------------------
  const overviewRowsHtml = schedule
    .map(
      (day) => `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
        <td style="padding: 8px 10px; font-weight: bold; color: #0f172a;">${day.dayName || `Ден ${day.dayNumber || ""}`}</td>
        <td style="padding: 8px 10px; color: #2563eb; font-weight: 600;">
          ${day.calendarDate ? formatDayCalendarDate(day.calendarDate) : "-"}
          ${day.isCompetitionDay ? `<br/><span style="color: #d97706; font-size: 10px; font-weight: bold;">🏆 ${day.competitionTitle || "Състезание"}</span>` : ""}
        </td>
        <td style="padding: 8px 10px; color: #334155;">${day.focus || "Кондиционна подготовка"}</td>
        <td style="padding: 8px 10px; text-align: center;">
          <span style="background-color: ${getIntensityBadgeColor(day.intensity || "medium")}; color: white; padding: 2px 6px; border-radius: 10px; font-size: 9px; font-weight: bold; text-transform: uppercase;">
            ${day.intensity || "medium"}
          </span>
        </td>
        <td style="padding: 8px 10px; text-align: center;">
          <span style="display: inline-block; width: 16px; height: 16px; border: 1.5px solid #64748b; border-radius: 3px;"></span>
        </td>
        <td style="padding: 8px 10px; text-align: center; color: #94a3b8; font-family: monospace;">
          [ &nbsp;&nbsp;&nbsp;&nbsp; ]
        </td>
        <td style="padding: 8px 10px; text-align: center; color: #94a3b8;">
          _________________
        </td>
      </tr>
    `
    )
    .join("");

  const page1Html = `
    <div class="pdf-page" style="width: 794px; min-height: 1120px; max-height: 1120px; box-sizing: border-box; padding: 36px 40px; background-color: #ffffff; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; display: flex; flex-direction: column; justify-content: space-between; position: relative;">
      <div>
        <!-- Club Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2.5px solid #0f172a; padding-bottom: 14px; margin-bottom: 16px;">
          <div>
            <h1 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">
              БАДМИНТОН КЛУБ ГЪЛЪБОВО
            </h1>
            <p style="font-size: 12px; color: #2563eb; font-weight: 700; margin: 4px 0 0 0; letter-spacing: 0.3px;">
              СПОРТЕН ТРЕНИРОВЪЧЕН ДНЕВНИК & ИНДИВИДУАЛЕН МИКРОЦИКЪЛ
            </p>
          </div>
          <div style="text-align: right; font-size: 11px; color: #64748b;">
            <div>Дата на издаване: <strong>${formattedGeneratedDate}</strong></div>
            <div style="font-weight: 600; color: #0f172a; margin-top: 2px;">BK Galabovo Performance Lab</div>
          </div>
        </div>

        <!-- Athlete Card -->
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; font-size: 12px;">
          <div>
            <span style="color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 600;">Състезател:</span><br/>
            <strong style="color: #0f172a; font-size: 14px;">${athleteName}</strong>
          </div>
          <div>
            <span style="color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 600;">Възраст / Група:</span><br/>
            <strong style="color: #0f172a;">${athleteAge} (${athleteAgeGroup})</strong>
          </div>
          <div>
            <span style="color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 600;">Ниво / Категория:</span><br/>
            <strong style="color: #0f172a; text-transform: capitalize;">${athleteSkillLevel}</strong>
          </div>
          <div>
            <span style="color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 600;">Период на цикъла:</span><br/>
            <strong style="color: #2563eb;">${program.startDate ? `${program.startDate} до ${program.endDate || ""}` : program.programTitle || "Микроцикъл"}</strong>
          </div>
        </div>

        <!-- Safety Alert Box -->
        <div style="background-color: ${safetyAlertBg}; border: 1px solid ${safetyAlertBorder}; border-radius: 8px; padding: 10px 14px; margin-bottom: 16px;">
          <div style="font-weight: bold; font-size: 12px; color: ${safetyAlertTitleColor}; margin-bottom: 3px;">
            ${safetyAlertTitle}
          </div>
          <div style="font-size: 11px; color: #334155; line-height: 1.4;">
            ${
              activeRestrictions.length > 0
                ? activeRestrictions
                    .map((r) => `• ${r}`)
                    .join("&nbsp;&nbsp;|&nbsp;&nbsp;")
                : "• Стандартен тренировъчен режим без медицински ограничения"
            }
          </div>
          ${coachSafetyNotes ? `<div style="font-size: 10.5px; color: #64748b; margin-top: 4px; font-style: italic;">Треньорска бележка: ${coachSafetyNotes}</div>` : ""}
        </div>

        <!-- Cycle Progress Tracker -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 6px;">
          <h2 style="font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin: 0; letter-spacing: 0.5px;">
            ТАБЛИЦА ЗА ПРОСЛЕДЯВАНЕ И ВЕРИФИКАЦИЯ НА МИКРОЦИКЪЛА
          </h2>
          <span style="font-size: 10px; color: #64748b; font-weight: 600;">(Попълва се при всяка сесия)</span>
        </div>

        <table style="width: 100%; border-collapse: collapse; text-align: left; margin-bottom: 16px;">
          <thead>
            <tr style="background-color: #f1f5f9; color: #475569; font-size: 10px; text-transform: uppercase; font-weight: 700; border-bottom: 2px solid #cbd5e1;">
              <th style="padding: 6px 10px; width: 16%;">Сесия</th>
              <th style="padding: 6px 10px; width: 20%;">Календарна дата</th>
              <th style="padding: 6px 10px; width: 30%;">Основен тренировъчен фокус</th>
              <th style="padding: 6px 10px; width: 10%; text-align: center;">Интенз.</th>
              <th style="padding: 6px 10px; width: 8%; text-align: center;">Статус</th>
              <th style="padding: 6px 10px; width: 8%; text-align: center;">RPE</th>
              <th style="padding: 6px 10px; width: 16%; text-align: center;">Заверил (Подпис)</th>
            </tr>
          </thead>
          <tbody>
            ${overviewRowsHtml}
          </tbody>
        </table>

        <div style="background-color: #eff6ff; border: 1px dashed #93c5fd; border-radius: 8px; padding: 10px 14px; font-size: 11px; color: #1e40af; line-height: 1.4;">
          <strong>Указания за работа с тренировъчния дневник:</strong>
          Всяка проведена тренировка се отмята в полето „Статус“. Състезателят оценява своето субективно натоварване (RPE) по скалата от 1 до 10 веднага след края на сесията. Треньорът подписва протокола след проверка на изпълнението.
        </div>
      </div>

      <!-- Page Footer -->
      <div style="border-top: 1px solid #e2e8f0; padding-top: 10px; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8;">
        <span>БК Гълъбово • Персонализирана програма за: ${athleteName}</span>
        <span>Страница 1 от ${totalPages}</span>
      </div>
    </div>
  `;

  // --------------------------------------------------------------------------
  // PAGES 2..N: Detailed Daily Training Cards
  // --------------------------------------------------------------------------
  const dailyPagesHtml = schedule
    .map((day, dayIdx) => {
      const pageNum = 2 + dayIdx;
      const intensityBadgeColor = getIntensityBadgeColor(
        day.intensity || "medium"
      );
      const exercises = Array.isArray(day.exercises) ? day.exercises : [];
      const warmupList = Array.isArray(day.warmup) ? day.warmup : [];
      const cooldownList = Array.isArray(day.cooldown) ? day.cooldown : [];

      const exercisesHtml = exercises
        .map(
          (ex, exIdx) => `
          <tr style="background-color: ${exIdx % 2 === 0 ? "#ffffff" : "#f8fafc"}; border-bottom: 1px solid #e2e8f0; font-size: 11px;">
            <td style="padding: 8px 10px; text-align: center;">
              <span style="display: inline-block; width: 16px; height: 16px; border: 1.5px solid #64748b; border-radius: 3px;"></span>
            </td>
            <td style="padding: 8px 10px; font-weight: bold; color: #0f172a;">
              ${ex.name || "Упражнение"}
              ${ex.targetWeakness ? `<br/><span style="color: #2563eb; font-size: 10px; font-weight: normal; font-style: italic;">Цел: ${ex.targetWeakness}</span>` : ""}
            </td>
            <td style="padding: 8px 10px; text-align: center; color: #0f172a; font-weight: 600;">
              ${ex.sets ?? 3} с. x ${ex.repsOrDuration || "10-12"}
            </td>
            <td style="padding: 8px 10px; text-align: center; color: #64748b;">
              ${ex.restSec ?? 60}с
            </td>
            <td style="padding: 8px 10px; background-color: #fefce8; border-left: 1px dashed #fde047; border-right: 1px dashed #fde047; text-align: center; color: #854d0e; font-family: monospace;">
              ___ с. x ___ повт.
            </td>
            <td style="padding: 8px 10px; color: #334155; font-size: 10.5px; line-height: 1.3;">
              ${ex.techniqueTip || "Контрол на биомеханиката и дишането"}
            </td>
          </tr>
        `
        )
        .join("");

      return `
        <div class="pdf-page" style="width: 794px; min-height: 1120px; max-height: 1120px; box-sizing: border-box; padding: 36px 40px; background-color: #ffffff; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; display: flex; flex-direction: column; justify-content: space-between; position: relative;">
          <div>
            <!-- Running Header -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; margin-bottom: 14px; font-size: 10.5px; color: #64748b;">
              <span style="font-weight: bold; text-transform: uppercase; color: #0f172a;">БК Гълъбово • Дневен Тренировъчен Протокол</span>
              <span>Състезател: <strong>${athleteName}</strong></span>
            </div>

            <!-- Day Header Card -->
            <div style="background-color: #0f172a; color: #ffffff; border-radius: 8px; padding: 12px 18px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 16px; font-weight: 800;">${day.dayName || `Ден ${day.dayNumber || dayIdx + 1}`}</span>
                  ${day.calendarDate ? `<span style="font-size: 11px; background: #334155; color: #f8fafc; padding: 2px 8px; border-radius: 4px; font-weight: 600;">📅 ${formatDayCalendarDate(day.calendarDate)}</span>` : ""}
                  ${day.isCompetitionDay ? `<span style="font-size: 11px; background: #f59e0b; color: #000000; padding: 2px 8px; border-radius: 4px; font-weight: bold;">🏆 ${day.competitionTitle || "ОФИЦИАЛНО СЪСТЕЗАНИЕ"}</span>` : ""}
                </div>
                <div style="font-size: 12px; color: #cbd5e1; margin-top: 4px;">
                  Фокус: <strong>${day.focus || "Кондиционна подготовка"}</strong>
                </div>
              </div>
              <div style="text-align: right; display: flex; gap: 8px; align-items: center;">
                <span style="background-color: ${intensityBadgeColor}; color: white; padding: 3px 10px; border-radius: 12px; font-size: 10px; font-weight: bold; text-transform: uppercase;">
                  ${day.intensity || "medium"} интензивност
                </span>
                <span style="font-size: 12px; color: #cbd5e1; font-weight: 600;">⏱️ ${day.durationMinutes || 60} мин</span>
              </div>
            </div>

            <!-- Warm-up Box -->
            <div style="padding: 8px 14px; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; font-size: 11px; color: #1e40af; margin-bottom: 12px;">
              <strong>Специализирана загрявка (${warmupList.length > 0 ? "7-10 мин" : "Обща"}):</strong>
              ${warmupList.length > 0 ? warmupList.join(" • ") : "Стандартна динамична загрявка, ставна мобилност и леко тичане"}
            </div>

            <!-- Exercises Table -->
            <table style="width: 100%; border-collapse: collapse; text-align: left; margin-bottom: 12px;">
              <thead>
                <tr style="background-color: #f1f5f9; color: #334155; font-size: 10px; text-transform: uppercase; font-weight: 700; border-bottom: 2px solid #cbd5e1;">
                  <th style="padding: 6px 8px; width: 6%; text-align: center;">Статус</th>
                  <th style="padding: 6px 8px; width: 28%;">Упражнение & Фокус</th>
                  <th style="padding: 6px 8px; width: 16%; text-align: center;">Предписано</th>
                  <th style="padding: 6px 8px; width: 10%; text-align: center;">Почивка</th>
                  <th style="padding: 6px 8px; width: 18%; text-align: center; background-color: #fef08a; color: #713f12;">Фактически Резултат</th>
                  <th style="padding: 6px 8px; width: 28%;">Методически указания</th>
                </tr>
              </thead>
              <tbody>
                ${exercisesHtml}
              </tbody>
            </table>

            <!-- Cooldown Box -->
            <div style="padding: 8px 14px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; font-size: 11px; color: #166534; margin-bottom: 14px;">
              <strong>Разпускане & Стречинг:</strong>
              ${cooldownList.length > 0 ? cooldownList.join(" • ") : "Статичен стречинг за долни и горни крайници, дихателни упражнения"}
            </div>

            <!-- Daily Progress & Biofeedback Logging Box -->
            <div style="background-color: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 12px 16px;">
              <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #0f172a; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
                ДНЕВЕН ПРОТОКОЛ ЗА ОБРАТНА ВРЪЗКА И ПРОСЛЕДЯВАНЕ (BIOFEEDBACK LOG)
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 11px;">
                <div>
                  <strong>Субективна умора (RPE Скала 1 - 10):</strong><br/>
                  <span style="font-size: 9.5px; color: #64748b;">(1 = Леко раздвижване; 5 = Умерено; 8 = Тежко; 10 = Максимално изтощение)</span>
                </div>
                <div style="display: flex; gap: 4px;">
                  ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
                    .map(
                      (num) => `
                    <div style="width: 22px; height: 22px; border: 1px solid #94a3b8; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; color: #334155;">
                      ${num}
                    </div>
                  `
                    )
                    .join("")}
                </div>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 11px;">
                <span><strong>Мускулен статус / Дискомфорт:</strong></span>
                <div style="display: flex; gap: 16px; font-size: 10.5px; color: #334155;">
                  <span>[ &nbsp; ] Отличен</span>
                  <span>[ &nbsp; ] Обичайна умора</span>
                  <span>[ &nbsp; ] Напрежение</span>
                  <span>[ &nbsp; ] Болка / Травма</span>
                </div>
              </div>

              <div style="font-size: 11px; margin-bottom: 6px;">
                <strong>Бележки от състезателя / треньора:</strong>
                <div style="border-bottom: 1px dashed #cbd5e1; height: 18px; margin-top: 2px;"></div>
              </div>

              <div style="display: flex; justify-content: space-between; font-size: 10.5px; color: #475569; margin-top: 8px;">
                <span>Дата на провеждане: ______________</span>
                <span>Продължителност: _____ мин</span>
                <span>Заверил (Треньор): ____________________</span>
              </div>
            </div>
          </div>

          <!-- Page Footer -->
          <div style="border-top: 1px solid #e2e8f0; padding-top: 10px; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8;">
            <span>БК Гълъбово • ${day.dayName || `Сесия ${dayIdx + 1}`} (${day.calendarDate || ""})</span>
            <span>Страница ${pageNum} от ${totalPages}</span>
          </div>
        </div>
      `;
    })
    .join("");

  // --------------------------------------------------------------------------
  // LAST PAGE: Recovery Zone, Theory & Certification
  // --------------------------------------------------------------------------
  const rawRecovery =
    Array.isArray(program.recoveryRecommendations) &&
    program.recoveryRecommendations.length > 0
      ? program.recoveryRecommendations
      : [
          "Задължително 8+ часа качествен нощен сън за неврологично възстановяване.",
          "Хидратация: минимум 2.5 литра вода с електролити при интензивни натоварвания.",
          "Миофасциален релийз с фоумролер и динамичен стречинг след всяка тренировъчна сесия.",
          "Контрастни душове или пресотерапия (Recovery Boots) при натрупване на мускулна умора.",
        ];

  const recoveryItemsHtml = rawRecovery
    .map(
      (rec) =>
        `<li style="margin-bottom: 6px; font-size: 11.5px; color: #334155; line-height: 1.4;">${rec}</li>`
    )
    .join("");

  const lastPageHtml = `
    <div class="pdf-page" style="width: 794px; min-height: 1120px; max-height: 1120px; box-sizing: border-box; padding: 36px 40px; background-color: #ffffff; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; display: flex; flex-direction: column; justify-content: space-between; position: relative;">
      <div>
        <!-- Running Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; margin-bottom: 20px; font-size: 10.5px; color: #64748b;">
          <span style="font-weight: bold; text-transform: uppercase; color: #0f172a;">БК Гълъбово • Методически Указания & Възстановяване</span>
          <span>Състезател: <strong>${athleteName}</strong></span>
        </div>

        <!-- Recovery Recommendations Card -->
        <div style="background-color: #f0fdf4; border: 1.5px solid #86efac; border-radius: 8px; padding: 16px 20px; margin-bottom: 20px;">
          <h3 style="font-size: 13px; font-weight: 800; color: #166534; margin: 0 0 10px 0; text-transform: uppercase; display: flex; align-items: center; gap: 6px;">
            🌿 ПРОТОКОЛ ЗА ВЪЗСТАНОВЯВАНЕ & RECOVERY ZONE
          </h3>
          <ul style="margin: 0; padding-left: 20px;">
            ${recoveryItemsHtml}
          </ul>
        </div>

        <!-- Theory Assignment Card (if any) -->
        ${
          program.theoryAssignment
            ? `
          <div style="background-color: #fefce8; border: 1.5px solid #fde047; border-radius: 8px; padding: 16px 20px; margin-bottom: 20px;">
            <h3 style="font-size: 13px; font-weight: 800; color: #854d0e; margin: 0 0 8px 0; text-transform: uppercase;">
              📖 ТАКТИЧЕСКА & ТЕОРЕТИЧНА ЗАДАЧА
            </h3>
            <p style="margin: 0; font-size: 12px; color: #713f12; line-height: 1.5;">
              ${program.theoryAssignment}
            </p>
          </div>
        `
            : ""
        }

        <!-- Medical & Health Reminder -->
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px 18px; margin-bottom: 24px; font-size: 11px; color: #475569; line-height: 1.5;">
          <strong>Спортно-медицински контрол:</strong><br/>
          При поява на остра болка, ставни възпаления или признаци на претренираност (RPE > 8 в поредни дни без планиран пик), състезателят е длъжен незабавно да преустанови натоварването и да уведоми треньорския щаб. Програмата подлежи на корекция в реално време според динамиката на възстановяването.
        </div>

        <!-- Final Cycle Evaluation -->
        <div style="border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 16px 20px; background-color: #ffffff;">
          <h3 style="font-size: 12px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0; text-transform: uppercase;">
            ЗАКЛЮЧИТЕЛНА ТРЕНЬОРСКА ОЦЕНКА НА МИКРОЦИКЪЛА
          </h3>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; font-size: 11px; margin-bottom: 12px;">
            <div>Изпълнени тренировки: <strong>____ / ${schedule.length}</strong></div>
            <div>Средно RPE на цикъла: <strong>____ / 10</strong></div>
            <div>Оценка на адаптацията: <strong>[ &nbsp; ] Отлична &nbsp; [ &nbsp; ] Задоволителна</strong></div>
          </div>
          <div style="font-size: 11px; margin-bottom: 16px;">
            Треньорски препоръки за следващия цикъл:<br/>
            <div style="border-bottom: 1px dashed #cbd5e1; height: 20px; margin-top: 4px;"></div>
            <div style="border-bottom: 1px dashed #cbd5e1; height: 20px; margin-top: 4px;"></div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: flex-end; font-size: 11px; color: #475569;">
            <div>Дата на финализиране: _______________</div>
            <div style="text-align: center; border-top: 1px solid #94a3b8; width: 220px; padding-top: 4px;">
              Главен Треньор / Подпис & Печат
            </div>
          </div>
        </div>
      </div>

      <!-- Page Footer -->
      <div style="border-top: 1px solid #e2e8f0; padding-top: 10px; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8;">
        <span>БК Гълъбово • Персонализирана програма за: ${athleteName}</span>
        <span>Страница ${totalPages} от ${totalPages}</span>
      </div>
    </div>
  `;

  return `
    <div style="background-color: #ffffff;">
      ${page1Html}
      ${dailyPagesHtml}
      ${lastPageHtml}
    </div>
  `;
}

/**
 * Client-side utility to export a WorkoutProgram as a high-resolution, multi-page PDF document.
 */
export async function exportWorkoutProgramPdf(
  program: Partial<WorkoutProgram>,
  filename?: string,
  athleteFallbackName?: string
): Promise<void> {
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.innerHTML = renderWorkoutProgramHtml(program, athleteFallbackName);
  document.body.appendChild(container);

  try {
    const progRecord = program as unknown as Record<string, unknown>;
    const targetElement = container.firstElementChild as HTMLElement;
    const nameForFile =
      program.targetAthlete?.name ||
      athleteFallbackName ||
      (progRecord.memberName as string) ||
      (progRecord.athleteName as string) ||
      "athlete";

    const safeName = nameForFile
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_\u0400-\u04FF-]/g, "");

    const exportName =
      filename ||
      `workout-plan-${safeName || "athlete"}-${new Date().toISOString().split("T")[0]}.pdf`;

    await generatePdfFromElement(targetElement, exportName, "portrait");
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Client-side utility to get a WorkoutProgram PDF as a Blob (e.g. for sharing or uploading).
 */
export async function getWorkoutProgramPdfBlob(
  program: Partial<WorkoutProgram>,
  athleteFallbackName?: string
): Promise<Blob> {
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.innerHTML = renderWorkoutProgramHtml(program, athleteFallbackName);
  document.body.appendChild(container);

  try {
    const targetElement = container.firstElementChild as HTMLElement;
    return await getPdfBlobFromElement(targetElement, "portrait");
  } finally {
    document.body.removeChild(container);
  }
}
