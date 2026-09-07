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

/**
 * Builds a styled, branded HTML string representing the workout program
 * for Badminton Club Galabovo. Uses standard RGB/HEX colors compatible with html2canvas.
 */
export function renderWorkoutProgramHtml(program: WorkoutProgram): string {
  const athlete = program.targetAthlete;
  const safety = program.safetyAudit;

  const daysHtml = program.schedule
    .map((day) => {
      const intensityBadgeColor = getIntensityBadgeColor(day.intensity);

      const exercisesHtml = day.exercises
        .map(
          (ex, idx) => `
          <tr style="background-color: ${idx % 2 === 0 ? "#ffffff" : "#f8fafc"}; border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 10px; font-weight: bold; color: #1e293b; font-size: 13px;">${ex.name}</td>
            <td style="padding: 8px 10px; text-align: center; color: #0f172a; font-size: 13px;">${ex.sets}</td>
            <td style="padding: 8px 10px; text-align: center; color: #0f172a; font-size: 13px;">${ex.repsOrDuration}</td>
            <td style="padding: 8px 10px; text-align: center; color: #64748b; font-size: 13px;">${ex.restSec}с</td>
            <td style="padding: 8px 10px; color: #334155; font-size: 12px;">
              ${ex.techniqueTip}
              ${ex.targetWeakness ? `<br/><span style="color: #2563eb; font-size: 11px; font-style: italic;">Фокус: ${ex.targetWeakness}</span>` : ""}
            </td>
          </tr>
        `
        )
        .join("");

      return `
        <div style="margin-bottom: 24px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; page-break-inside: avoid;">
          <div style="background-color: #0f172a; color: #ffffff; padding: 10px 16px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <span style="font-size: 16px; font-weight: bold;">${day.dayName}</span>
              ${day.calendarDate ? `<span style="font-size: 11px; background: #334155; color: #f8fafc; padding: 2px 6px; border-radius: 4px; margin-left: 8px;">📅 ${day.calendarDate}</span>` : ""}
              ${day.isCompetitionDay ? `<span style="font-size: 11px; background: #f59e0b; color: #000000; padding: 2px 6px; border-radius: 4px; margin-left: 6px; font-weight: bold;">🏆 ${day.competitionTitle || "Състезание"}</span>` : ""}
              <span style="font-size: 13px; color: #94a3b8; margin-left: 12px;">${day.focus}</span>
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <span style="background-color: ${intensityBadgeColor}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; text-transform: uppercase;">
                ${day.intensity}
              </span>
              <span style="font-size: 12px; color: #cbd5e1;">${day.durationMinutes} мин</span>
            </div>
          </div>

          <div style="padding: 12px 16px; background-color: #f1f5f9; font-size: 12px; color: #475569; border-bottom: 1px solid #e2e8f0;">
            <strong>Загрявка:</strong> ${day.warmup.join(" • ")}
          </div>

          <table style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead>
              <tr style="background-color: #e2e8f0; color: #334155; font-size: 12px; text-transform: uppercase;">
                <th style="padding: 8px 10px; width: 30%;">Упражнение</th>
                <th style="padding: 8px 10px; width: 10%; text-align: center;">Серии</th>
                <th style="padding: 8px 10px; width: 15%; text-align: center;">Повторения/Време</th>
                <th style="padding: 8px 10px; width: 10%; text-align: center;">Почивка</th>
                <th style="padding: 8px 10px; width: 35%;">Указания & Фокус</th>
              </tr>
            </thead>
            <tbody>
              ${exercisesHtml}
            </tbody>
          </table>

          <div style="padding: 10px 16px; background-color: #f8fafc; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
            <strong>Разпускане:</strong> ${day.cooldown.join(" • ")}
          </div>
        </div>
      `;
    })
    .join("");

  const safetyAlertBg = safety.fatigueDeloadActive ? "#fef2f2" : "#f0fdf4";
  const safetyAlertBorder = safety.fatigueDeloadActive ? "#fca5a5" : "#86efac";
  const safetyAlertTitleColor = safety.fatigueDeloadActive
    ? "#991b1b"
    : "#166534";
  const safetyAlertTitle = safety.fatigueDeloadActive
    ? "ВНИМАНИЕ: АКТИВИРАН DELOAD РЕЖИМ (ВИСОКА УМОРА)"
    : "ПРЕДПАЗНИ МЕРКИ И ОГРАНИЧЕНИЯ";

  const safetyAlertHtml = `
    <div style="background-color: ${safetyAlertBg}; border: 1px solid ${safetyAlertBorder}; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px;">
      <div style="font-weight: bold; font-size: 13px; color: ${safetyAlertTitleColor}; margin-bottom: 4px;">
        ${safetyAlertTitle}
      </div>
      <div style="font-size: 12px; color: #334155; line-height: 1.5;">
        ${safety.activeRestrictions.map((r) => `• ${r}`).join("<br/>")}
      </div>
      <div style="font-size: 11px; color: #64748b; margin-top: 6px; font-style: italic;">
        Бележка: ${safety.coachSafetyNotes}
      </div>
    </div>
  `;

  const recoveryHtml = program.recoveryRecommendations
    .map(
      (rec) =>
        `<li style="margin-bottom: 4px; font-size: 12px; color: #334155;">${rec}</li>`
    )
    .join("");

  return `
    <div style="width: 800px; padding: 32px; background-color: #ffffff; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <!-- Club Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px;">
        <div>
          <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">
            БАДМИНТОН КЛУБ ГЪЛЪБОВО
          </h1>
          <p style="font-size: 13px; color: #2563eb; font-weight: 600; margin: 4px 0 0 0;">
            AI ПЕРСОНАЛИЗИРАН ТРЕНИРОВЪЧЕН ПЛАН • GEMINI FLASH
          </p>
        </div>
        <div style="text-align: right; font-size: 11px; color: #64748b;">
          <div>Дата: ${new Date(program.generatedAt).toLocaleDateString("bg-BG")}</div>
          <div style="font-weight: 600; color: #0f172a;">BK Galabovo Performance Lab</div>
        </div>
      </div>

      <!-- Athlete Card -->
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; font-size: 12px;">
        <div>
          <span style="color: #64748b; font-size: 11px;">Състезател:</span><br/>
          <strong style="color: #0f172a; font-size: 14px;">${athlete.name}</strong>
        </div>
        <div>
          <span style="color: #64748b; font-size: 11px;">Възраст / Група:</span><br/>
          <strong style="color: #0f172a;">${athlete.age} г. (${athlete.ageGroup})</strong>
        </div>
        <div>
          <span style="color: #64748b; font-size: 11px;">Ниво на подготовка:</span><br/>
          <strong style="color: #0f172a; text-transform: capitalize;">${athlete.skillLevel}</strong>
        </div>
        <div>
          <span style="color: #64748b; font-size: 11px;">Период на цикъла:</span><br/>
          <strong style="color: #2563eb;">${program.startDate ? `${program.startDate} до ${program.endDate || ""}` : program.programTitle}</strong>
        </div>
      </div>

      <!-- Safety Alert Box -->
      ${safetyAlertHtml}

      <!-- Daily Schedule -->
      <h2 style="font-size: 15px; font-weight: 700; color: #0f172a; text-transform: uppercase; margin: 20px 0 12px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
        Седмичен Тренировъчен График
      </h2>
      ${daysHtml}

      <!-- Recovery Section -->
      <div style="margin-top: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; page-break-inside: avoid;">
        <h3 style="font-size: 13px; font-weight: bold; color: #0f172a; margin: 0 0 8px 0; text-transform: uppercase;">
          Препоръки за Възстановяване & Recovery Zone
        </h3>
        <ul style="margin: 0; padding-left: 20px;">
          ${recoveryHtml}
        </ul>
      </div>

      <!-- Footer & Signature -->
      <div style="margin-top: 32px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 16px; page-break-inside: avoid;">
        <div>
          Документът е генериран автоматично от системата на БК Гълъбово.<br/>
          Спортно-медицински контрол: задължителен преди изпълнение.
        </div>
        <div style="text-align: center; border-top: 1px solid #94a3b8; width: 200px; padding-top: 4px;">
          Треньор / Подпис
        </div>
      </div>
    </div>
  `;
}

/**
 * Client-side utility to export a WorkoutProgram as a high-resolution PDF document.
 */
export async function exportWorkoutProgramPdf(
  program: WorkoutProgram,
  filename?: string
): Promise<void> {
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.innerHTML = renderWorkoutProgramHtml(program);
  document.body.appendChild(container);

  try {
    const targetElement = container.firstElementChild as HTMLElement;
    const exportName =
      filename ||
      `workout-plan-${program.targetAthlete.name.replace(/\s+/g, "_")}-${new Date().toISOString().split("T")[0]}.pdf`;

    await generatePdfFromElement(targetElement, exportName, "portrait");
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Client-side utility to get a WorkoutProgram PDF as a Blob (e.g. for sharing or uploading).
 */
export async function getWorkoutProgramPdfBlob(
  program: WorkoutProgram
): Promise<Blob> {
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.innerHTML = renderWorkoutProgramHtml(program);
  document.body.appendChild(container);

  try {
    const targetElement = container.firstElementChild as HTMLElement;
    return await getPdfBlobFromElement(targetElement, "portrait");
  } finally {
    document.body.removeChild(container);
  }
}
