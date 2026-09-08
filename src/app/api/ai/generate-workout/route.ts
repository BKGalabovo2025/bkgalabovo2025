/* eslint-disable sonarjs/no-nested-conditional, sonarjs/cognitive-complexity */
import fs from "node:fs";
import path from "node:path";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAuthUser, getAuthUserFromSessionCookie } from "@/lib/auth-utils";
import {
  AthleteGeminiContext,
  getAthleteGeminiContext,
  WorkoutProgram,
  WorkoutTargetGoal,
} from "@/services/ai-workout-context-service";

const RequestSchema = z.object({
  memberId: z.string().min(1, "memberId is required"),
  targetGoal: z
    .enum([
      "explosive_power",
      "aerobic_endurance",
      "agility_footwork",
      "injury_rehab",
      "pre_tournament_taper",
      "general_conditioning",
    ])
    .optional()
    .default("general_conditioning"),
  cycleDurationDays: z.number().int().min(3).max(30).optional().default(7),
  sessionsPerWeek: z.number().int().min(1).max(7).optional().default(4),
  courtAccess: z.boolean().optional().default(true),
  notes: z.string().optional(),
  startDate: z.string().optional(),
});

export function addDaysToIsoDate(isoDateStr: string, days: number): string {
  const d = new Date(isoDateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatGender(gender: "male" | "female" | "unspecified"): string {
  if (gender === "male") return "Мъж";
  if (gender === "female") return "Жена";
  return "Неуточнен";
}

function formatHand(dominantHand?: "left" | "right" | null): string {
  if (dominantHand === "left") return "Лява";
  if (dominantHand === "right") return "Дясна";
  return "Неуточнена";
}

function formatBeepTest(
  beep: AthleteGeminiContext["conditioning"]["beepTest"]
) {
  if (!beep) return "Няма скорошен тест";
  return `Ниво ${beep.level}.${beep.shuttle}, VO2max: ${beep.lastVo2max} ml/kg/min (${beep.qualitativeScore})`;
}

function formatShadowStats(
  shadow: AthleteGeminiContext["conditioning"]["shadowFootwork"]
) {
  if (!shadow) return "Няма данни";
  const reaction = shadow.averageReactionSec
    ? `${shadow.averageReactionSec} сек`
    : "N/A";
  const corners =
    shadow.weakestCorners.length > 0
      ? shadow.weakestCorners.join(", ")
      : "Балансирано";
  return `Средна реакция: ${reaction}. Дефицитни/слаби ъгли: ${corners}`;
}

function formatTournamentInfo(
  tourn?: AthleteGeminiContext["tournamentContext"]
) {
  if (!tourn || tourn.daysUntilNextTournament === null) {
    return "Няма предстоящо състезание, отбелязано в графика";
  }
  const title = tourn.nextTournamentTitle || "Състезание";
  const dateStr = tourn.nextTournamentDate
    ? ` на ${tourn.nextTournamentDate}`
    : "";
  const days = tourn.daysUntilNextTournament;
  const timing =
    days <= 7
      ? `след ${days} дни (следващата седмица!)`
      : days <= 14
        ? `след ${days} дни (до 2 седмици)`
        : `след ${days} дни (в края на месеца)`;

  const taperNotice = tourn.isTaperingActive
    ? ` ⚠️ АКТИВЕН PRE-TOURNAMENT TAPER (остават ${days} дни до състезанието! Намален обем за свежест!)`
    : ` (остават ${days} дни - ${timing})`;

  const rank = tourn.rankingPosition
    ? ` Ранг: #${tourn.rankingPosition} (${tourn.rankingPoints || 0} т.)`
    : "";
  return `${title}${dateStr} - ${taperNotice}.${rank}`;
}

function formatCatalogSample(
  sample?: AthleteGeminiContext["catalogExercisesSample"]
) {
  if (!sample || sample.length === 0) return "Няма зареден списък";
  return sample
    .map(
      (e) =>
        `- "${e.name}" [${e.category}] (Оборудване: ${e.equipment.join(", ") || "собствено тегло"})${
          e.coachingPoints && e.coachingPoints.length > 0
            ? ` -> Насока: ${e.coachingPoints[0]}`
            : ""
        }`
    )
    .join("\n");
}

function formatMacrocycleText(
  macrocycle?: AthleteGeminiContext["macrocycle"]
): string {
  if (!macrocycle) return "Стандартен годишен ритъм";
  let text = `Текуща фаза: ${macrocycle.currentPhase}.`;
  if (macrocycle.upcomingCamp) {
    text += ` Предстоящ лагер: ${macrocycle.upcomingCamp.title} (след ${macrocycle.upcomingCamp.daysUntil} дни).`;
  }
  return text;
}

function buildGeminiPrompt(context: AthleteGeminiContext): string {
  const injuriesList =
    context.safetyAndMedical.activeInjuries.length > 0
      ? context.safetyAndMedical.activeInjuries.join(", ")
      : "Няма регистрирани контузии";

  const isOverreaching =
    context.workloadAndFatigue.recentFatigueTrend === "overreaching" ||
    context.workloadAndFatigue.averageRpeLast7Days > 7.5;

  const isTaper =
    context.targetOptions.targetGoal === "pre_tournament_taper" ||
    !!context.tournamentContext?.isTaperingActive;

  const cycleDays = context.targetOptions.cycleDurationDays || 7;
  const sessionsPerWeek = context.targetOptions.sessionsPerWeek || 3;
  const totalWeeks = Math.max(1, Math.round(cycleDays / 7));
  const targetSessionsCount = totalWeeks * sessionsPerWeek;

  const macrocycleText = formatMacrocycleText(context.macrocycle);

  const startDateStr =
    context.targetOptions.startDate || new Date().toISOString().slice(0, 10);
  const endDateStr = addDaysToIsoDate(startDateStr, cycleDays - 1);

  const schedulePeriodEventsText =
    context.scheduleEventsInPeriod && context.scheduleEventsInPeriod.length > 0
      ? context.scheduleEventsInPeriod
          .map(
            (e) =>
              `- Дата: ${e.date} | "${e.title}" [тип: ${e.type}] ${
                e.isCompetition
                  ? "🏆 ВАЖНО ОФИЦИАЛНО СЪСТЕЗАНИЕ / ТУРНИР"
                  : "Тренировъчно събитие"
              } -> Състезателят ${e.isMemberAttending ? "Е ЗАПИСАН / ПРИСЪСТВА" : "няма изричен запис"}`
          )
          .join("\n")
      : "Няма специални турнири или събития в клубния график за този период.";

  const quizDeficitsText =
    context.quizDeficits && context.quizDeficits.length > 0
      ? context.quizDeficits
          .map(
            (q) => `${q.quizTitle} (${q.scorePercent}%): ${q.deficitSummary}`
          )
          .join("; ")
      : "Няма констатирани теоретични дефицити";

  return `
Вие сте Елитен Главен Треньор по Бадминтон и Кондиционна Подготовка към "Бадминтон Клуб Гълъбово".
Генерирайте максимално точна, научно обоснована и безопасна тренировъчна програма на български език:

### ДАННИ ЗА СЪСТЕЗАТЕЛЯ:
- Име: ${context.profile.fullName}
- Възраст: ${context.profile.age} г. (${context.profile.ageGroup})
- Пол: ${formatGender(context.profile.gender)}
- Ниво: ${context.profile.skillLevel}
- Доминираща ръка: ${formatHand(context.profile.dominantHand)}
- Ръст: ${context.profile.heightCm ? context.profile.heightCm + " см" : "N/A"}
- Тегло: ${context.profile.weightKg ? context.profile.weightKg + " кг" : "N/A"}

### БЕЗОПАСНОСТ И МЕДИЦИНСКИ СТАТУС:
- Активни контузии: ${injuriesList}
- Здравни бележки: ${context.safetyAndMedical.healthConditionNotes || "Няма"}
- Медицинско: ${context.safetyAndMedical.hasValidMedicalCertificate ? "Валидно" : "Липсва/Изтекло"}

### ПЕРИОДИЗАЦИЯ, ТУРНИРИ & МАКРОЦИКЪЛ:
- Годишен план: ${macrocycleText}
- Турнирен статус: ${formatTournamentInfo(context.tournamentContext)}
- Теоретични пропуски: ${quizDeficitsText}
- Психологически статус/анкети: ${context.wellnessSurvey?.recentFeedbackText || "Нормален тонус и мотивация"}
- Налично оборудване: ${context.availableEquipment.join(", ")}

### КЛУБЕН ГРАФИК И СЪБИТИЯ ЗА ПЕРИОДА (${startDateStr} до ${endDateStr}):
${schedulePeriodEventsText}

### ТЕКУЩА ФИЗИЧЕСКА ФОРМА & ДЕФИЦИТИ:
- Beep тест: ${formatBeepTest(context.conditioning.beepTest)}
- BWF тестове: ${
    context.conditioning.recentAssessments.length > 0
      ? context.conditioning.recentAssessments
          .map((a) => `${a.testName}: ${a.scoreDisplay}`)
          .join("; ")
      : "Няма скорошни оценки"
  }
- Shadow симулатор: ${formatShadowStats(context.conditioning.shadowFootwork)}
- Тренировъчен обем (14 дни): ${context.workloadAndFatigue.sessionsCountLast14Days} сесии (${context.workloadAndFatigue.totalTrainingMinutesLast14Days} мин)
- Средно RPE (7 дни): ${context.workloadAndFatigue.averageRpeLast7Days} / 10 (Индекс: ${context.workloadAndFatigue.recentFatigueTrend})

### РЕФЕРЕНТНИ УПРАЖНЕНИЯ ОТ НАШАТА BWF БАЗА:
(Използвайте тези реални упражнения с техните оригинални наименования):
${formatCatalogSample(context.catalogExercisesSample)}

### ПАРАМЕТРИ НА ТРЕНИРОВЪЧНИЯ ЦИКЪЛ:
- Цел: ${context.targetOptions.targetGoal}
- Период на провеждане: от ${startDateStr} до ${endDateStr} (${cycleDays} дни)
- Седмична честота: ${sessionsPerWeek} тренировки/седмица -> ОБЩО ${targetSessionsCount} ТРЕНИРОВЪЧНИ СЕСИИ в цялата програма
- Корт: ${context.targetOptions.courtAccess ? "Да (включва специфични бадминтон дрилове с ракета)" : "Не (само сухо ОФП)"}

### КРИТИЧНИ ИЗИСКВАНИЯ ЗА СЪДЪРЖАНИЕТО И БРОЯ ДНИ:
1. **ТОЧЕН БРОЙ СЕСИИ В МАСИВА 'schedule'**:
   - Масивът 'schedule' ТРЯБВА ДА СЪДЪРЖА ТОЧНО ${targetSessionsCount} ЕЛЕМЕНТА (тренировъчни сесии)!
   - За ${cycleDays}-дневен цикъл с ${sessionsPerWeek} тренировки на седмица (${totalWeeks} седмици x ${sessionsPerWeek} тренировки = ${targetSessionsCount} сесии).
   ${
     totalWeeks > 1
       ? `- Разпределете ги като: Седмица 1 (сесии 1 до ${sessionsPerWeek}) и Седмица 2 (сесии ${sessionsPerWeek + 1} до ${targetSessionsCount}). В полето "dayName" изписвайте ясно: "Седмица 1, Ден 1: ...", ..., "Седмица 2, Тренировка 1 (Ден ${sessionsPerWeek + 1}): ...".`
       : `- Именувайте ги "Ден 1", "Ден 2", ... до "Ден ${targetSessionsCount}".`
   }
   - ЗАБРАНЕНО Е ДА ВРЪЩАТЕ САМО 3 ДНИ за 14-дневен цикъл! Върнете пълните ${targetSessionsCount} тренировки!

2. **СЪСТЕЗАТЕЛНО НИВО И ЗАБРАНА ЗА ДЕТСКИ ИГРИ**:
   - Състезателят ${context.profile.fullName} е на ниво "${context.profile.skillLevel}" и отлична кондиция (Beep test ${context.conditioning.beepTest?.level || 8.6}).
   - КАТЕГОРИЧНО СЕ ЗАБРАНЯВАТ детски забавни игрички от типа "топка на тигана", "палачинка", "рисуване на осмици", "балони с ракета"!
   ${
     context.targetOptions.courtAccess
       ? `- Тъй като е избран достъп до корт, ЗАДЪЛЖИТЕЛНО включете състезателни бадминтон елементи:
     * Футуърк и придвижване на корт: V-front и V-back footwork, Shadow Footwork по 4 и 6 точки, Split-step реакция, Scissor kick (ножичен отскок), ниска защитна стойка, шасе стъпки.
     * Технически разигравания и удари: клиър (clear), дроп-шот (drop shot), смаш и защита от смаш, драйв дуели, мрежови пресичания и спин/нет шотове (net kill / tumble), сервиз по зони.
     * Корт интервали: Multi-shuttle подаване с кош перца, скоростни совалки.`
       : `- При липса на корт включете плиометрия, скоростно-силова подготовка, ластици за рамене и кор.`
   }

3. **ПРЕДСЪСТЕЗАТЕЛЕН ТЕЙПЪР (TAPERING) & ОФИЦИАЛНИ СЪСТЕЗАНИЯ**:
   ${
     isTaper
       ? `- ТЕЙПЪРЪТ Е АКТИВЕН (${context.targetOptions.targetGoal === "pre_tournament_taper" ? "изрично избран от треньора" : "поради предстоящо състезание от графика"})!
   ${
     context.tournamentContext?.nextTournamentTitle
       ? `- ВАЖНО: Треньорът подготвя състезателя за състезание от клубния график: "${context.tournamentContext.nextTournamentTitle}" (${context.tournamentContext.daysUntilNextTournament} дни до старта, дата: ${context.tournamentContext.nextTournamentDate || "края на месеца"}).`
       : ""
   }
   - В полето "safetyAudit.coachSafetyNotes" ЗАДЪЛЖИТЕЛНО отбележете: "Програмата е във фаза на предсъстезателен тейпър за предстоящото състезание с намален обем на сериите (30-40%) и акцент върху взривна реакция, точност и съхранение на нервната система."
   - КАТЕГОРИЧНО Е ЗАБРАНЕНО в бележките да твърдите, че "няма турнир", тъй като състезанието е планирано в клубния график!`
       : `- Стандартен тренировъчен микроцикъл.`
   }

4. **КОНТУЗИИ И ОГРАНИЧЕНИЯ**:
   - Ако има контузии (${injuriesList}), изключете рисковите движения.

5. **ОБВЪРЗВАНЕ С РЕАЛНИ ДАТИ ОТ ГРАФИКА**:
   - Начална дата на програмата: ${startDateStr}. Крайна дата: ${endDateStr}.
   - За всяка тренировъчна сесия в "schedule", определете точното поле "calendarDate" (във формат "YYYY-MM-DD").
   - Ако на съответната дата състезателят има официално състезание от клубния график ("isCompetition": true), маркирайте:
     "isCompetitionDay": true,
     "competitionTitle": "<Заглавие на състезанието>"
     и направете сесията специфична предсъстезателна активация или мобилност за деня на състезанието!
   - За обикновени тренировъчни дни сложете "isCompetitionDay": false и "competitionTitle": null.

### ФОРМАТ НА ОТГОВОРА (САМО JSON):
{
  "programTitle": "Заглавие на програмата на български",
  "startDate": "${startDateStr}",
  "endDate": "${endDateStr}",
  "targetAthlete": {
    "id": "${context.profile.id}",
    "name": "${context.profile.fullName}",
    "age": ${context.profile.age},
    "ageGroup": "${context.profile.ageGroup}",
    "skillLevel": "${context.profile.skillLevel}"
  },
  "safetyAudit": {
    "activeRestrictions": ["приложени ограничения"],
    "fatigueDeloadActive": ${isOverreaching},
    "taperingActive": ${isTaper},
    "coachSafetyNotes": "Треньорски бележки"
  },
  "schedule": [
    {
      "dayNumber": 1,
      "dayName": "Седмица 1, Ден 1: Понеделник",
      "calendarDate": "${startDateStr}",
      "isCompetitionDay": false,
      "competitionTitle": null,
      "focus": "Тематичен фокус",
      "intensity": "low" | "medium" | "high",
      "durationMinutes": 60,
      "warmup": ["загрявка 1"],
      "exercises": [
        {
          "name": "Реално име на упражнението от каталога",
          "sets": 3,
          "repsOrDuration": "10-12 повторения",
          "restSec": 60,
          "techniqueTip": "Треньорско указание",
          "targetWeakness": "Целева зона"
        }
      ],
      "cooldown": ["разпускане"]
    }
  ],
  "recoveryRecommendations": ["Препоръка 1"],
  "theoryAssignment": "Кратка тактическа задача за почивен ден (ако е приложимо)",
  "generatedAt": "${new Date().toISOString()}"
}
`;
}

function determineSafetyRestrictions(
  injuries: AthleteGeminiContext["safetyAndMedical"]["activeInjuries"],
  isDeload: boolean,
  isTaper: boolean
): string[] {
  const restrictions: string[] = [];
  if (
    injuries.includes("knee") ||
    injuries.includes("achilles") ||
    injuries.includes("ankle")
  ) {
    restrictions.push(
      "Изключена плиометрия и резки спирания (щадящ режим за коляно/глезен)"
    );
  }
  if (injuries.includes("shoulder") || injuries.includes("wrist")) {
    restrictions.push(
      "Изключени овърхед смашове с тежест (щадящ режим за рамо)"
    );
  }
  if (injuries.includes("lower-back")) {
    restrictions.push(
      "Изключена тежка тяга и агресивна ротация (щадящ режим за кръст)"
    );
  }
  if (isDeload) {
    restrictions.push(
      "Активиран Deload протокол поради RPE > 7.5 (намален обем с 40%)"
    );
  }
  if (isTaper) {
    restrictions.push(
      "Активиран Pre-Tournament Taper (намален обем за пикова свежест преди състезание)"
    );
  }
  return restrictions.length > 0 ? restrictions : ["Няма активни ограничения"];
}

type IntensityLevel = "low" | "medium" | "high";

interface DayTemplateConfig {
  dayName: string;
  focus: string;
  intensity: IntensityLevel;
  durationMinutes: number;
  warmup: string[];
  exercises: Array<{
    name: string;
    sets: number;
    repsOrDuration: string;
    restSec: number;
    techniqueTip: string;
    targetWeakness: string;
  }>;
  cooldown: string[];
}

function chooseExerciseName(
  hasInjury: boolean,
  injuryAlternative: string,
  court: boolean,
  courtExercise: string,
  dryLandExercise: string
): string {
  if (hasInjury) return injuryAlternative;
  if (court) return courtExercise;
  return dryLandExercise;
}

function computeExerciseIntensity(
  baseIntensity: IntensityLevel,
  isDeload: boolean,
  isTaper: boolean
): IntensityLevel {
  if (isDeload) return "low";
  if (isTaper && baseIntensity === "high") return "medium";
  return baseIntensity;
}

function computeExerciseSets(
  baseSets: number,
  isDeload: boolean,
  isTaper: boolean
): number {
  if (isDeload) return Math.max(1, baseSets - 1);
  if (isTaper) return Math.max(2, baseSets - 1);
  return baseSets;
}

function getExplosivePowerDays(
  context: AthleteGeminiContext,
  isDeload: boolean,
  isTaper: boolean
): DayTemplateConfig[] {
  const court = context.targetOptions.courtAccess;
  const injuries = context.safetyAndMedical.activeInjuries;
  const weakestCorners =
    context.conditioning.shadowFootwork?.weakestCorners.join(" и ") ||
    "всички ъгли";

  const hasLowerBodyInjury =
    injuries.includes("knee") ||
    injuries.includes("ankle") ||
    injuries.includes("achilles");
  const hasShoulderInjury =
    injuries.includes("shoulder") || injuries.includes("wrist");
  const hasBackInjury = injuries.includes("lower-back");

  const catalogSample = context.catalogExercisesSample || [];
  const getCatalogExercise = (cat: string, fallback: string) => {
    const found = catalogSample.find((e) =>
      e.category.toLowerCase().includes(cat.toLowerCase())
    );
    return found ? found.name : fallback;
  };

  const isReducedLoad = isDeload || isTaper;
  const highOrMedIntensity: IntensityLevel = isReducedLoad ? "medium" : "high";
  const primaryDuration = isReducedLoad ? 45 : 60;
  const secondaryDuration = isReducedLoad ? 45 : 55;
  const lowerBodyReps = hasLowerBodyInjury
    ? "4 x 30 сек задържане"
    : "6-8 повторения";
  const calfReps = hasLowerBodyInjury
    ? "15 бавни повдигания на пръсти"
    : "20 секунди подскоци";
  const shoulderReps = hasShoulderInjury
    ? "3 x 15 сек на страна"
    : "8 повторения на страна";
  const primarySets = isDeload ? 2 : 4;

  const day1Exercise1 = chooseExerciseName(
    hasLowerBodyInjury,
    "Изометричен Wall Sit с ластик над коленете",
    court,
    getCatalogExercise(
      "footwork",
      "Shadow Footwork: Експлозивен Lunge & Бърз Push-back"
    ),
    "Контрастни скокове върху кутия (Box Jumps)"
  );
  const day1Exercise2 = hasBackInjury
    ? "Bird-Dog изометрия срещу ластик"
    : "Trap Bar / Клек с ластик за експлозивна фаза";

  const day2Exercise1 = hasShoulderInjury
    ? "Изометрично задържане на рамо в 90/90 позиция с ластик"
    : "Медицинска топка: Ротационно хвърляне в стена (Rotational Slam)";

  const day2Exercise2 = chooseExerciseName(
    hasShoulderInjury,
    "Face Pulls с фокус върху задно рамо",
    court,
    "Multi-shuttle Jump Smash симулация с олекотена/тежка ракета",
    "Плиометрични лицеви опори с отлепяне на дланите"
  );

  return [
    {
      dayName: "Ден 1: Долна част & Експлозивен старт",
      focus: `Вертикален отскок, сплит-степ и оттласкване към ${weakestCorners}`,
      intensity: highOrMedIntensity,
      durationMinutes: primaryDuration,
      warmup: [
        "5 мин динамичен стречинг",
        "Мобилност в глезени и тазобедрени стави",
        "Активация на глутеуси с ластик",
      ],
      exercises: [
        {
          name: day1Exercise1,
          sets: primarySets,
          repsOrDuration: lowerBodyReps,
          restSec: 75,
          techniqueTip: hasLowerBodyInjury
            ? "Поддържайте 90 градуса в коленете без болка."
            : "Акцент върху минимално време за контакт със земята и меко омекотяване.",
          targetWeakness: `Експлозивен старт към ${weakestCorners}`,
        },
        {
          name: day1Exercise2,
          sets: 3,
          repsOrDuration: "5-6 повторения",
          restSec: 90,
          techniqueTip: "Експлозивно изправяне, контролирано спускане (3 сек).",
          targetWeakness: "Максимална мощност на квадрицепси и глутеуси",
        },
        {
          name: "Спринтове с ластично съпротивление (Banded Sprints 5м)",
          sets: 4,
          repsOrDuration: "5 метра спринт",
          restSec: 60,
          techniqueTip:
            "Нисък наклон на торса и агресивно избутване с предната част на стъпалото.",
          targetWeakness: "Скорост на първите 2 крачки",
        },
        {
          name: "Прасци & Ахилес еластичност (Calf Pogo Hops)",
          sets: 3,
          repsOrDuration: calfReps,
          restSec: 45,
          techniqueTip: "Стегнати колене, движението идва само от глезена.",
          targetWeakness: "Реактивност на ахилесовото сухожилие",
        },
      ],
      cooldown: [
        "5 мин бавно ходене и дишане",
        "Статичен стречинг за прасци, бедра и таз",
      ],
    },
    {
      dayName: "Ден 2: Горна част, Ротация & Смаш Мощност",
      focus: "Пренос на кинетична енергия през ядрото към рамото и китката",
      intensity: highOrMedIntensity,
      durationMinutes: secondaryDuration,
      warmup: [
        "Загрявка на раменния пояс с ластик",
        "Торакална ротация на 4 крака",
        "Динамични кръгове с ръце",
      ],
      exercises: [
        {
          name: day2Exercise1,
          sets: primarySets,
          repsOrDuration: shoulderReps,
          restSec: 60,
          techniqueTip:
            "Движението започва от завъртането на таза, преминава през пояса към ръката.",
          targetWeakness: "Сила при завъртане за смаш",
        },
        {
          name: day2Exercise2,
          sets: 3,
          repsOrDuration: court ? "10 совалки" : "6-8 повторения",
          restSec: 75,
          techniqueTip:
            "Стремете се към максимална точка на контакт във въздуха.",
          targetWeakness: "Височина на удара и експлозивност в рамото",
        },
        {
          name: "Pallof Press с експлозивно избутване и пауза",
          sets: 3,
          repsOrDuration: "8 задържания по 2 сек на страна",
          restSec: 45,
          techniqueTip: "Пълна стабилност в таза, никакво усукване на кръста.",
          targetWeakness: "Анти-ротационна устойчивост на ядрото",
        },
        {
          name: "Външна ротация за рамо с ластик (Rotator Cuff Power)",
          sets: 3,
          repsOrDuration: "12 контролирани повторения",
          restSec: 45,
          techniqueTip: "Лакътят плътно до тялото, плавно движение.",
          targetWeakness: "Превенция на ротаторния маншон",
        },
      ],
      cooldown: [
        "Миофасциален релийз с топка за латисимус и гръдни мускули",
        "Стречинг за трицепс и предмишница",
      ],
    },
    {
      dayName: "Ден 3: Скокова издръжливост & Скоростна реакция",
      focus: "Многократни експлозивни цикли без спад в кинематиката",
      intensity: "medium",
      durationMinutes: 50,
      warmup: ["Динамична стълбичка", "Активация на таза", "Подскоци на въже"],
      exercises: [
        {
          name: court
            ? "2-Corner Smash and Net Kill Footwork"
            : "Странични експлозивни прескоци (Lateral Bounds)",
          sets: 4,
          repsOrDuration: court ? "30 сек работа" : "8 скока на крак",
          restSec: 60,
          techniqueTip: "Бързо възстановяване на позицията след всеки отскок.",
          targetWeakness: "Скокова издръжливост в 3-ти гейм",
        },
        {
          name: "Kettlebell Swing за задна кинетична верига",
          sets: 4,
          repsOrDuration: "10 експлозивни повторения",
          restSec: 60,
          techniqueTip:
            "Сгъване от таза (Hip hinge), мощно стягане на глутеусите.",
          targetWeakness: "Експлозивно разгъване в таза",
        },
        {
          name: "Agility Ladder Fast In-and-Outs",
          sets: 4,
          repsOrDuration: "15 сек максимална честота",
          restSec: 45,
          techniqueTip:
            "Висока честота на стъпалата, нисък център на тежестта.",
          targetWeakness: "Нервно-мускулна проводимост на краката",
        },
      ],
      cooldown: ["Стречинг за задна верига и прасци", "Дихателна пауза"],
    },
    {
      dayName: "Ден 4: Силов контраст & Анти-ротационно ядро",
      focus: "Нервно-мускулна координация и стабилност на пояса",
      intensity: "medium",
      durationMinutes: 45,
      warmup: ["Мобилност на гръбнака", "Леки подскоци"],
      exercises: [
        {
          name: "Български клек с динамично повдигане",
          sets: 3,
          repsOrDuration: "6 повторения на крак",
          restSec: 60,
          techniqueTip:
            "Коляното на водещия крак сочи напред, плавно опускане.",
          targetWeakness: "Едностранен баланс и сила",
        },
        {
          name: "Планк с редуване на повдигане на крайници",
          sets: 3,
          repsOrDuration: "40 секунди",
          restSec: 30,
          techniqueTip: "Тазът не се върти, ядрото е стегнато.",
          targetWeakness: "Дълбока коремна стабилност",
        },
        {
          name: "Страничен планк с повдигане на горен крак",
          sets: 3,
          repsOrDuration: "25 сек на страна",
          restSec: 30,
          techniqueTip: "Тялото образува права линия от рамото до глезена.",
          targetWeakness: "Странични стабилизатори на таза",
        },
      ],
      cooldown: ["Дълбок стречинг за бедра и глутеуси"],
    },
    {
      dayName: "Ден 5: Скоростна издръжливост & Корт преливане",
      focus: "Адаптиране на развитата експлозивност към състезателно темпо",
      intensity: "high",
      durationMinutes: 50,
      warmup: ["Специфичен футуърк за бадминтон", "Спринтове 5 метра"],
      exercises: [
        {
          name: court
            ? "Shadow Footwork с акцент върху слабото предвижване"
            : "Совалкови спринтове 5-10 метра със спиране",
          sets: 4,
          repsOrDuration: "25 сек работа",
          restSec: 60,
          techniqueTip: "Максимална експлозивност при всяка смяна на посока.",
          targetWeakness: `Слаб ъгъл (${weakestCorners})`,
        },
        {
          name: "Scissor Jump Footwork на корт/линия",
          sets: 4,
          repsOrDuration: "20 секунди",
          restSec: 45,
          techniqueTip:
            "Бърза ножица във въздуха и мигновено приземяване на два крака.",
          targetWeakness: "Реакция в задно поле",
        },
      ],
      cooldown: ["10 мин лек стречинг и разпускане"],
    },
    {
      dayName: "Ден 6: Активно разтоварване & Кондиционен баланс",
      focus: "Освобождаване на напрежението и регенерация",
      intensity: "low",
      durationMinutes: 40,
      warmup: ["Леко колоездене", "Мобилност на ставите"],
      exercises: [
        {
          name: "Пресотерапия (Recovery Boots) или Леко въртене на велоергометър",
          sets: 1,
          repsOrDuration: "25 минути",
          restSec: 0,
          techniqueTip: "Пулс под 120 уд/мин, плавно дишане.",
          targetWeakness: "Ускоряване на възстановяването",
        },
        {
          name: "Йога и стречинг за тазобедрен пояс (90/90 stretch)",
          sets: 2,
          repsOrDuration: "60 сек на страна",
          restSec: 30,
          techniqueTip: "Плавни преходи без форсиране.",
          targetWeakness: "Мобилност при ниски топки",
        },
      ],
      cooldown: ["Хидратация и дихателен релакс"],
    },
    {
      dayName: "Ден 7: Пълна регенерация и тактически анализ",
      focus: "Психологическо презареждане и видео анализ",
      intensity: "low",
      durationMinutes: 30,
      warmup: ["Дихателни упражнения"],
      exercises: [
        {
          name: "Пасивен стречинг и миофасциален релийз с ролер",
          sets: 1,
          repsOrDuration: "20 минути",
          restSec: 0,
          techniqueTip: "Бавно търкаляне върху стегнатите зони.",
          targetWeakness: "Мускулна пластичност",
        },
      ],
      cooldown: ["Хидратация с електролити"],
    },
  ];
}

function getAerobicEnduranceDays(
  context: AthleteGeminiContext,
  isDeload: boolean
): DayTemplateConfig[] {
  const court = context.targetOptions.courtAccess;
  const weakestCorners =
    context.conditioning.shadowFootwork?.weakestCorners.join(" и ") ||
    "всички ъгли";

  return [
    {
      dayName: "Ден 1: Аеробна база и многосовалков ритъм",
      focus:
        "Поддържане на стабилна дихателна честота при продължително натоварване",
      intensity: isDeload ? "low" : "medium",
      durationMinutes: isDeload ? 45 : 65,
      warmup: [
        "10 мин леко бягане",
        "Динамичен стречинг",
        "Мобилност в глезени",
      ],
      exercises: [
        {
          name: court
            ? "Multi-shuttle 30 совалки непрекъснато темпо"
            : "Темпово интервално бягане (1 мин бързо / 1 мин бавно)",
          sets: isDeload ? 3 : 5,
          repsOrDuration: court ? "30 совалки на серия" : "8 интервала",
          restSec: 45,
          techniqueTip:
            "Поддържайте ритмично дишане (2 вдишвания / 2 издишвания).",
          targetWeakness: "Аеробен капацитет и VO2max",
        },
        {
          name: "Farmer's Walk с умерени тежести",
          sets: 4,
          repsOrDuration: "40 метра ходене",
          restSec: 45,
          techniqueTip: "Изправен гръбнак, стегнато ядро, стабилни рамене.",
          targetWeakness: "Издръжливост на пояса и захвата",
        },
        {
          name: "Планк с редуване на лакти и длани",
          sets: 3,
          repsOrDuration: "45 секунди",
          restSec: 30,
          techniqueTip: "Минимално клатене на таза при прехода.",
          targetWeakness: "Функционална коремна издръжливост",
        },
      ],
      cooldown: ["5 мин разпускащо ходене", "Пълен стречинг за долна част"],
    },
    {
      dayName: "Ден 2: Лактатен праг и продължителни разигравания",
      focus:
        "Ефективно понасяне и изчистване на лактата в края на тежки геймове",
      intensity: "high",
      durationMinutes: 60,
      warmup: ["Подскоци на въже", "Мобилност на тазобедрени стави"],
      exercises: [
        {
          name: court
            ? "6-Corner Shadow Footwork с прогресивно темпо"
            : "HIIT: Mountain Climbers + Squat Thrusts без подскок",
          sets: 5,
          repsOrDuration: court
            ? "45 сек работа"
            : "40 сек работа / 20 сек почивка",
          restSec: 30,
          techniqueTip:
            "Движете се с постоянна скорост дори при силно парене в бедрата.",
          targetWeakness: `Лактатна толерантност и дефицитен ъгъл (${weakestCorners})`,
        },
        {
          name: "Гоблет клек с умерена тежест и високи повторения",
          sets: 4,
          repsOrDuration: "15 повторения",
          restSec: 45,
          techniqueTip: "Пълен обем на движение, контрол в долна фаза.",
          targetWeakness: "Силова издръжливост на бедрените мускули",
        },
        {
          name: "Велоергометър / Кростренажор темпово каране",
          sets: 1,
          repsOrDuration: "15 минути (пулс 145-160)",
          restSec: 0,
          techniqueTip: "Равномерно въртене, плавно темпо.",
          targetWeakness: "Кардио-респираторна издръжливост",
        },
      ],
      cooldown: ["Миофасциален релийз с фоумролер", "Статичен стречинг"],
    },
    {
      dayName: "Ден 3: Скоростна издръжливост & Совалково бягане",
      focus: "Спринтове със смяна на посоката при натрупване на умора",
      intensity: "high",
      durationMinutes: 55,
      warmup: ["Динамична стълбичка", "Спринтове 5м"],
      exercises: [
        {
          name: "Shuttle Runs (Совалки 6-9-12 метра)",
          sets: 6,
          repsOrDuration: "пълен цикъл совалки",
          restSec: 45,
          techniqueTip:
            "Докосване на линията с нисък център на тежестта и бързо обръщане.",
          targetWeakness: "Специфична бадминтон скоростна издръжливост",
        },
        {
          name: "Side-to-side Footwork със замахване",
          sets: 4,
          repsOrDuration: "40 секунди",
          restSec: 40,
          techniqueTip: "Стена от латерални стъпки без пресичане на краката.",
          targetWeakness: "Латерална координация под напрежение",
        },
        {
          name: "Руски усуквания с лека медицинска топка",
          sets: 3,
          repsOrDuration: "20 повторения",
          restSec: 30,
          techniqueTip: "Контролирано докосване на пода встрани.",
          targetWeakness: "Ротационна издръжливост на косите коремни мускули",
        },
      ],
      cooldown: ["Разтягане на гръбначния стълб и прасците"],
    },
    {
      dayName: "Ден 4: Кардио възстановяване в Зона 2",
      focus: "Капиляризация и венозен отток без умора на нервната система",
      intensity: "low",
      durationMinutes: 45,
      warmup: ["Лека загрявка на ставите"],
      exercises: [
        {
          name: "Леко бягане или кростренажор в Зона 2 (пулс 125-140)",
          sets: 1,
          repsOrDuration: "30 минути непрекъснато",
          restSec: 0,
          techniqueTip: "Темпо, при което можете да говорите без задъхване.",
          targetWeakness: "Базова аеробна икономичност",
        },
        {
          name: "Динамична мобилност на торакален дял и таз",
          sets: 3,
          repsOrDuration: "10 бавни повторения",
          restSec: 30,
          techniqueTip: "Дълбоко диафрагмено дишане.",
          targetWeakness: "Гръдна мобилност и дихателен обем",
        },
      ],
      cooldown: ["Стречинг и хидратация"],
    },
    {
      dayName: "Ден 5: Аеробна мощност на корт",
      focus: "Продължителни дрилове с висока тактическа прецизност",
      intensity: "medium",
      durationMinutes: 50,
      warmup: ["Специфичен футуърк"],
      exercises: [
        {
          name: court
            ? "Multi-shuttle 4-ъгъла с висока парабола"
            : "Интервални спринтове 10x20м",
          sets: 4,
          repsOrDuration: court ? "20 совалки" : "20 метра спринт",
          restSec: 45,
          techniqueTip: "Точност на пласиране дори при умора.",
          targetWeakness: "Прецизност в края на мача",
        },
      ],
      cooldown: ["Стречинг"],
    },
    {
      dayName: "Ден 6: Пресотерапия и лимфен дренаж",
      focus: "Елиминиране на метаболитните отпадъци",
      intensity: "low",
      durationMinutes: 40,
      warmup: ["Леко раздвижване"],
      exercises: [
        {
          name: "Пресотерапия (Recovery Boots)",
          sets: 1,
          repsOrDuration: "30 минути",
          restSec: 0,
          techniqueTip: "Режим регенерация.",
          targetWeakness: "Мускулна умора в краката",
        },
      ],
      cooldown: ["Хидратация"],
    },
    {
      dayName: "Ден 7: Почивка и релаксация",
      focus: "Пълен покой",
      intensity: "low",
      durationMinutes: 20,
      warmup: [],
      exercises: [
        {
          name: "Пасивен стречинг и разходка",
          sets: 1,
          repsOrDuration: "20 мин",
          restSec: 0,
          techniqueTip: "Пълен релакс.",
          targetWeakness: "Нервна система",
        },
      ],
      cooldown: [],
    },
  ];
}

function getAgilityFootworkDays(
  context: AthleteGeminiContext
): DayTemplateConfig[] {
  const court = context.targetOptions.courtAccess;
  const weakestCorners =
    context.conditioning.shadowFootwork?.weakestCorners.join(" и ") ||
    "всички ъгли";

  return [
    {
      dayName: `Ден 1: Предна зона & Мрежа (Фокус дефицитен ъгъл: ${weakestCorners})`,
      focus: `Бърз Lunge, възстановяване на центъра и Split-step към ${weakestCorners}`,
      intensity: "medium",
      durationMinutes: 55,
      warmup: [
        "Динамична стълбичка (Icky Shuffle)",
        "Мобилност в глезените",
        "Активация на квадрицепси",
      ],
      exercises: [
        {
          name: court
            ? "Net Kill & Tumble Footwork с фокус към дефицитен ъгъл"
            : "Agility Ladder: Icky Shuffle & Ali Shuffle",
          sets: 4,
          repsOrDuration: court ? "30 сек работа" : "5 серии през стълбичката",
          restSec: 45,
          techniqueTip:
            "Дръжте ракетата високо пред тялото при пристъпването към мрежата.",
          targetWeakness: `Реакция и спиране към ${weakestCorners}`,
        },
        {
          name: "Split-step реакция при визуален сигнал",
          sets: 4,
          repsOrDuration: "10 повторения",
          restSec: 45,
          techniqueTip:
            "Мигновен отскок при подаване на знака без забавяне в стъпалата.",
          targetWeakness: "Време за реакция на първата крачка",
        },
        {
          name: "Еднокрачен баланс върху възглавница / Босу",
          sets: 3,
          repsOrDuration: "40 сек на крак",
          restSec: 30,
          techniqueTip: "Поглед напред, стабилен глезен, леко свито коляно.",
          targetWeakness:
            "Проприоцепция и предпазване от изкълчване на глезена",
        },
      ],
      cooldown: ["Стречинг за прасци и флексори на таза", "Бавно ходене"],
    },
    {
      dayName: "Ден 2: Задно поле: Scissor Jump, China Jump & Бързо изнасяне",
      focus: "Бързо изтегляне в задно поле и стабилно приземяване",
      intensity: "medium",
      durationMinutes: 50,
      warmup: ["Подскоци за задно поле", "Мобилност на рамо"],
      exercises: [
        {
          name: court
            ? "Rear Court Overhead Footwork (Clear / Drop / Smash движение)"
            : "Динамични странични прескоци (Skater Hops) с омекотяване",
          sets: 4,
          repsOrDuration: court ? "10 совалки на серия" : "10 скока на крак",
          restSec: 45,
          techniqueTip:
            "Приземяване на двата крака едновременно за светкавично връщане напред.",
          targetWeakness: "Скорост при изтегляне в задно дясно/ляво поле",
        },
        {
          name: "Pallof Press със странично придвижване",
          sets: 3,
          repsOrDuration: "8 стъпки на страна",
          restSec: 45,
          techniqueTip:
            "Поддържайте ръцете изпънати, съпротивлението на ластика да е постоянно.",
          targetWeakness: "Ядро и баланс при латерално бягане",
        },
        {
          name: "Стречинг за флексори на тазобедрената става (Couch Stretch)",
          sets: 2,
          repsOrDuration: "45 сек на крак",
          restSec: 30,
          techniqueTip: "Стегнат корем, да не се преразгъва кръстът.",
          targetWeakness: "Мобилност при дълбок заден наклон",
        },
      ],
      cooldown: ["Миофасциален релийз за глутеуси с топка"],
    },
    {
      dayName: "Ден 3: 6-точков свободен Shadow Footwork",
      focus: "Гладко движение по целия корт без излишни междинни стъпки",
      intensity: "high",
      durationMinutes: 50,
      warmup: ["Леко тичане", "Координационна стълбичка"],
      exercises: [
        {
          name: court
            ? "Shadow Footwork 6 ъгъла по случаен маршрут"
            : "Звезда от конуси: спринт, докосване, връщане в центъра",
          sets: 5,
          repsOrDuration: "35 сек работа",
          restSec: 40,
          techniqueTip:
            "Винаги се връщайте в базовата позиция преди следващия старт.",
          targetWeakness: `Цялостна координация и слаби ъгли (${weakestCorners})`,
        },
        {
          name: "Координация с две тенис топки за реакция и периферно зрение",
          sets: 3,
          repsOrDuration: "1 минута",
          restSec: 30,
          techniqueTip:
            "Следете топките с периферното си зрение, без да накланяте главата надолу.",
          targetWeakness: "Визуално-моторна координация",
        },
      ],
      cooldown: ["Стречинг за гръбнак и прасци"],
    },
    {
      dayName: "Ден 4: Скорост на първата крачка & Реакция",
      focus: "Минимално време за реакция при бързи топки",
      intensity: "medium",
      durationMinutes: 45,
      warmup: ["Спринтове от място"],
      exercises: [
        {
          name: "Стартове от седеж и корем към 3-метров маркер",
          sets: 6,
          repsOrDuration: "3 метра спринт",
          restSec: 45,
          techniqueTip: "Експлозивно изправяне и мигновена крачка напред.",
          targetWeakness: "Време за реакция на корта",
        },
        {
          name: "Wall Sit с експлозивен отскок",
          sets: 3,
          repsOrDuration: "30 сек изометрия + отскок",
          restSec: 60,
          techniqueTip: "Взривно отлепяне от стената.",
          targetWeakness: "Статично-динамична сила",
        },
      ],
      cooldown: ["Стречинг за бедра"],
    },
    {
      dayName: "Ден 5: Защитен футуърк при смашове",
      focus: "Бързо заемане на ниска защитна стойка",
      intensity: "medium",
      durationMinutes: 45,
      warmup: ["Латерални движения"],
      exercises: [
        {
          name: "Side-to-Side Defense Footwork с блок на мрежата",
          sets: 4,
          repsOrDuration: "30 секунди",
          restSec: 45,
          techniqueTip: "Ниска стойка, широк разкрач, ракетата пред гърдите.",
          targetWeakness: "Защита при смаш",
        },
      ],
      cooldown: ["Разпускане"],
    },
    {
      dayName: "Ден 6: Възстановяване на стъпалата и мобилност",
      focus: "Регенерация на сухожилията на ходилото",
      intensity: "low",
      durationMinutes: 35,
      warmup: ["Леко раздвижване"],
      exercises: [
        {
          name: "Масаж на плантарната фасция с твърда топка",
          sets: 2,
          repsOrDuration: "5 мин на крак",
          restSec: 0,
          techniqueTip: "Равномерно притискане по цялата дължина на свода.",
          targetWeakness: "Умора в свода на ходилото",
        },
        {
          name: "Стречинг за ахилесовото сухожилие на наклонена повърхност",
          sets: 3,
          repsOrDuration: "45 сек на крак",
          restSec: 30,
          techniqueTip: "Петата плътно долепена до пода.",
          targetWeakness: "Еластичност на прасеца",
        },
      ],
      cooldown: ["Хидратация"],
    },
    {
      dayName: "Ден 7: Почивка",
      focus: "Пълен релакс",
      intensity: "low",
      durationMinutes: 20,
      warmup: [],
      exercises: [
        {
          name: "Разходка и лек стречинг",
          sets: 1,
          repsOrDuration: "20 мин",
          restSec: 0,
          techniqueTip: "Без натоварване.",
          targetWeakness: "Регенерация",
        },
      ],
      cooldown: [],
    },
  ];
}

function getInjuryRehabDays(): DayTemplateConfig[] {
  return [
    {
      dayName: "Ден 1: Мобилност на тазовия пояс, гръбнака и глезените",
      focus: "Възстановяване на пълния обем на движение без болка и дискомфорт",
      intensity: "low",
      durationMinutes: 45,
      warmup: ["Дихателни упражнения", "Плавна мобилизация на ставите"],
      exercises: [
        {
          name: "90/90 Hip Stretch & Мобилност на тазобедрени стави",
          sets: 3,
          repsOrDuration: "45 сек на страна",
          restSec: 30,
          techniqueTip: "Плавни движения без форсиране в крайния обем.",
          targetWeakness: "Мобилност в таза и защита на кръста",
        },
        {
          name: "Cat-Cow & Торакална ротация на четири крака",
          sets: 3,
          repsOrDuration: "10 бавни повторения",
          restSec: 30,
          techniqueTip: "Синхронизирайте движението с дишането.",
          targetWeakness: "Декомпресия на гръбначния стълб",
        },
        {
          name: "Deadbug безопасно укрепване на коремната стена",
          sets: 3,
          repsOrDuration: "10 повторения на страна",
          restSec: 30,
          techniqueTip:
            "Кръстът плътно залепен за пода по време на цялото движение.",
          targetWeakness: "Дълбоко ядро без стрес върху лумбалния дял",
        },
        {
          name: "Леко въртене на велоергометър с нисък пулс",
          sets: 1,
          repsOrDuration: "15 минути",
          restSec: 0,
          techniqueTip:
            "Пулс под 115 уд/мин за лек кръвоток към долните крайници.",
          targetWeakness: "Хранене на ставния хрущял",
        },
      ],
      cooldown: ["Пълно отпускане по гръб с повдигнати крака (10 мин)"],
    },
    {
      dayName: "Ден 2: Изометрична стабилизация на ставите & Ротаторен маншон",
      focus: "Укрепване на стабилизиращите мускули без агресивна динамика",
      intensity: "low",
      durationMinutes: 40,
      warmup: ["Леко загряване с ластици"],
      exercises: [
        {
          name: "Изометричен глутеус мост с ластик над коленете",
          sets: 3,
          repsOrDuration: "12 повторения с 3 сек задържане",
          restSec: 45,
          techniqueTip: "Стягайте седалищните мускули, не извивайте кръста.",
          targetWeakness: "Стабилизация на таза и коленните стави",
        },
        {
          name: "Външна и вътрешна ротация на рамото с лек ластик",
          sets: 3,
          repsOrDuration: "12 бавни повторения",
          restSec: 45,
          techniqueTip:
            "Лакътят под 90 градуса, прилепен към тялото с малка кърпа.",
          targetWeakness: "Защита и заздравяване на ротаторния маншон",
        },
        {
          name: "Bird-Dog с фокус върху неутрален гръбнак",
          sets: 3,
          repsOrDuration: "8 повторения на страна с 2 сек пауза",
          restSec: 30,
          techniqueTip:
            "Тялото не се накланя, повдигането е паралелно на пода.",
          targetWeakness: "Задна кинетична верига и анти-ротация",
        },
      ],
      cooldown: ["Миофасциален релийз с мека топка"],
    },
    {
      dayName: "Ден 3: Функционална стабилност и баланс без удари",
      focus: "Проприоцепция и контрол при бавно стъпване",
      intensity: "low",
      durationMinutes: 40,
      warmup: ["Мобилност на стъпалата"],
      exercises: [
        {
          name: "Бавно слизане от стъпало (Step Downs) с контрол на коляното",
          sets: 3,
          repsOrDuration: "8 повторения на крак",
          restSec: 45,
          techniqueTip:
            "Коляното да не се сгъва навътре (валгус), движението е право напред.",
          targetWeakness: "Стабилност на пателарното сухожилие и квадрицепс",
        },
        {
          name: "Pallof Press изометрия срещу лек ластик",
          sets: 3,
          repsOrDuration: "15 сек задържане на страна",
          restSec: 30,
          techniqueTip: "Тялото остава неподвижно като скала.",
          targetWeakness: "Укрепване на мускулния корсет",
        },
      ],
      cooldown: ["Фоумролер за прасци и бедрени мускули"],
    },
    {
      dayName: "Ден 4: Аеробно поддържане без ставен стрес",
      focus: "Поддържане на тонуса на кръвообращението и лимфата",
      intensity: "low",
      durationMinutes: 40,
      warmup: ["Лека гимнастика"],
      exercises: [
        {
          name: "Плуване или водна гимнастика / Елиптичен тренажор",
          sets: 1,
          repsOrDuration: "25 минути леко темпо",
          restSec: 0,
          techniqueTip: "Плавни движения без съпротивление и тласъци.",
          targetWeakness: "Общ тонус без гравитационен натиск върху ставите",
        },
        {
          name: "Дълбок диафрагмен стречинг и дишане",
          sets: 1,
          repsOrDuration: "10 минути",
          restSec: 0,
          techniqueTip:
            "Вдишване през носа (4 сек), издишване през устата (6 сек).",
          targetWeakness: "Намаляване на нивата на кортизол",
        },
      ],
      cooldown: ["Топъл душ и хидратация"],
    },
    {
      dayName: "Ден 5: Заздравяване на поддържащите мускули",
      focus: "Фина моторика и кинетичен баланс",
      intensity: "low",
      durationMinutes: 35,
      warmup: ["Раздвижване"],
      exercises: [
        {
          name: "Face Pulls с лек ластик за задни рамена и ромбоиди",
          sets: 3,
          repsOrDuration: "12 повторения",
          restSec: 45,
          techniqueTip: "Издърпване към челото, лактите високо.",
          targetWeakness: "Стойка и баланс в раменния пояс",
        },
      ],
      cooldown: ["Стречинг"],
    },
    {
      dayName: "Ден 6: Пресотерапия и лимфен дренаж",
      focus: "Ускорена регенерация на тъканите",
      intensity: "low",
      durationMinutes: 35,
      warmup: [],
      exercises: [
        {
          name: "Сесия с ботуши за пресотерапия (Recovery Boots)",
          sets: 1,
          repsOrDuration: "30 минути",
          restSec: 0,
          techniqueTip: "Ниско компресионно налягане.",
          targetWeakness: "Оток и скованост",
        },
      ],
      cooldown: [],
    },
    {
      dayName: "Ден 7: Пълен покой",
      focus: "Релаксация",
      intensity: "low",
      durationMinutes: 20,
      warmup: [],
      exercises: [
        {
          name: "Пасивен стречинг и разходка",
          sets: 1,
          repsOrDuration: "20 мин",
          restSec: 0,
          techniqueTip: "Без форсиране.",
          targetWeakness: "Възстановяване",
        },
      ],
      cooldown: [],
    },
  ];
}

function getPreTournamentTaperDays(
  context: AthleteGeminiContext
): DayTemplateConfig[] {
  const court = context.targetOptions.courtAccess;

  return [
    {
      dayName: "Ден 1: Нервно-мускулна активация и взривна скорост",
      focus:
        "Пикова скорост на нервната система при минимален обем (без натрупване на умора)",
      intensity: "medium",
      durationMinutes: 40,
      warmup: [
        "5 мин лека загрявка на ставите",
        "Динамични спринтове с ускорение 3-5 метра",
        "Светкавичен сплит-степ",
      ],
      exercises: [
        {
          name: court
            ? "Къси серии 3-совалков Kill & Counter с висока острота"
            : "Спринтове 3 метра от готовност (Split-step to sprint)",
          sets: 3,
          repsOrDuration: court ? "15 сек работа" : "4 спринта",
          restSec: 90,
          techniqueTip: "Максимална експлозивност, 100% фокус на всеки удар.",
          targetWeakness: "Първи метър и рефлекс",
        },
        {
          name: "Медицинска топка взривен хвърлей от гърди (Chest Pass)",
          sets: 3,
          repsOrDuration: "4 повторения",
          restSec: 75,
          techniqueTip:
            "Вложете максимална скорост, не търсете брой повторения.",
          targetWeakness: "Моментна експлозивна мощност",
        },
      ],
      cooldown: ["Стречинг и разпускане на мускулатурата"],
    },
    {
      dayName: "Ден 2: Тактическа прецизност, сервизи и ретури",
      focus: "Фина моторика, рутина при сервис и тактическа концентрация",
      intensity: "low",
      durationMinutes: 35,
      warmup: ["Загряване на рамото и китката с ластик"],
      exercises: [
        {
          name: "Прецизност на къс и висок сервис по зони (Target Serving)",
          sets: 4,
          repsOrDuration: "15 сервиза",
          restSec: 30,
          techniqueTip:
            "Визуализирайте траекторията на перцето милиметри над мрежата.",
          targetWeakness: "Стабилност на началния удар",
        },
        {
          name: "Атака на сервиз (Return of Serve) с разиграване до 3-ти удар",
          sets: 3,
          repsOrDuration: "8 разигравания",
          restSec: 60,
          techniqueTip:
            "Агресивна позиция и пресичане на перцето на най-високата точка.",
          targetWeakness: "Инициатива от първия удар",
        },
      ],
      cooldown: ["Стречинг за гръбнак и рамене"],
    },
    {
      dayName: "Ден 3: Психологически тонус, реакция и свежест",
      focus: "Максимална свежест, рефлекси и ментално спокойствие преди мача",
      intensity: "low",
      durationMinutes: 30,
      warmup: ["Леко раздвижване"],
      exercises: [
        {
          name: "Светлинна / визуална реакция на корт без умора",
          sets: 3,
          repsOrDuration: "20 секунди",
          restSec: 60,
          techniqueTip: "Бързо докосване с очи и ракета без изтощение.",
          targetWeakness: "Скоростна сетивност",
        },
        {
          name: "Пресотерапия (Recovery Boots) за свежи крака",
          sets: 1,
          repsOrDuration: "20 минути",
          restSec: 0,
          techniqueTip: "Релаксация и подготовка за състезателния ден.",
          targetWeakness: "Пикова лекота в долните крайници",
        },
      ],
      cooldown: ["Дихателна медитация и визуализация"],
    },
    {
      dayName: "Ден 4: Лека корт мобилност (Ден преди състезанието)",
      focus: "Усещане на ракетата и залата",
      intensity: "low",
      durationMinutes: 25,
      warmup: ["Мобилност"],
      exercises: [
        {
          name: "Леко подхвърляне и 10 минути свободен шадоу",
          sets: 1,
          repsOrDuration: "10 минути",
          restSec: 0,
          techniqueTip: "Плавно, леко, без умора.",
          targetWeakness: "Пикова свежест",
        },
      ],
      cooldown: ["Хидратация и почивка"],
    },
    {
      dayName: "Ден 5: Състезателна готовност",
      focus: "Активация за турнира",
      intensity: "low",
      durationMinutes: 20,
      warmup: ["Динамично разгряване"],
      exercises: [
        {
          name: "Къси стартове и разгряване с ракета",
          sets: 2,
          repsOrDuration: "5 мин",
          restSec: 60,
          techniqueTip: "Готовност за игра.",
          targetWeakness: "Пикова форма",
        },
      ],
      cooldown: [],
    },
    {
      dayName: "Ден 6: Почивка",
      focus: "Регенерация",
      intensity: "low",
      durationMinutes: 15,
      warmup: [],
      exercises: [],
      cooldown: [],
    },
    {
      dayName: "Ден 7: Почивка",
      focus: "Регенерация",
      intensity: "low",
      durationMinutes: 15,
      warmup: [],
      exercises: [],
      cooldown: [],
    },
  ];
}

function getGeneralConditioningDays(
  context: AthleteGeminiContext,
  isDeload: boolean
): DayTemplateConfig[] {
  const court = context.targetOptions.courtAccess;
  const weakestCorners =
    context.conditioning.shadowFootwork?.weakestCorners.join(" и ") ||
    "всички ъгли";

  return [
    {
      dayName: "Ден 1: Долна част, Базова сила & Стабилност",
      focus: "Укрепване на бедрата, седалището и устойчивостта на коленете",
      intensity: isDeload ? "low" : "medium",
      durationMinutes: isDeload ? 45 : 60,
      warmup: [
        "Динамичен стречинг",
        "Активация с ластик",
        "Клекове със собствено тегло",
      ],
      exercises: [
        {
          name: "Гоблет клек или Клек с ластик",
          sets: isDeload ? 2 : 3,
          repsOrDuration: "10-12 повторения",
          restSec: 60,
          techniqueTip:
            "Пълен контрол, коленете следват посоката на пръстите на краката.",
          targetWeakness: "Базова сила на квадрицепси",
        },
        {
          name: "Румънска тяга с ластик / гири (RDL)",
          sets: 3,
          repsOrDuration: "10 повторения",
          restSec: 60,
          techniqueTip:
            "Движение само от таза, неутрален гръбнак, леко сгънати колене.",
          targetWeakness: "Задна верига и хамстринги",
        },
        {
          name: "Странични стъпки с ластик около глезените",
          sets: 3,
          repsOrDuration: "12 стъпки във всяка посока",
          restSec: 45,
          techniqueTip:
            "Поддържайте полуклек и постоянно напрежение в ластика.",
          targetWeakness: "Глутеус медиус и странична стабилност",
        },
      ],
      cooldown: ["Стречинг за предна и задна част на бедрата"],
    },
    {
      dayName: "Ден 2: Горна част, Бутащи/Дърпащи движения & Ротация",
      focus: "Баланс в раменния пояс и предаване на сила през ядрото",
      intensity: "medium",
      durationMinutes: 50,
      warmup: ["Кръгове с ръце", "Торакална мобилност"],
      exercises: [
        {
          name: "Лицеви опори (стандартни или с повдигнати ръце)",
          sets: 3,
          repsOrDuration: "10-12 повторения",
          restSec: 60,
          techniqueTip:
            "Тялото в една линия, лактите под 45 градуса към торса.",
          targetWeakness: "Бутаща сила на гърди и трицепс",
        },
        {
          name: "Гребане с ластик или дъмбели (Bent-over Row)",
          sets: 3,
          repsOrDuration: "12 повторения",
          restSec: 60,
          techniqueTip:
            "Издърпване към таза, събиране на лопатките в крайна фаза.",
          targetWeakness: "Дърпаща сила и стабилност на лопатките",
        },
        {
          name: "Pallof Press с ластик (Анти-ротация)",
          sets: 3,
          repsOrDuration: "10 задържания по 2 сек на страна",
          restSec: 45,
          techniqueTip: "Стегната коремна стена, тазът остава перпендикулярен.",
          targetWeakness: "Ядро и стабилизация на гръбнака",
        },
      ],
      cooldown: ["Стречинг за гърди и раменен пояс"],
    },
    {
      dayName: "Ден 3: Специфична бадминтон координация & Футуърк",
      focus: `Подобряване на бързината към ${weakestCorners}`,
      intensity: "medium",
      durationMinutes: 55,
      warmup: ["Координационна стълбичка", "Подскоци на въже"],
      exercises: [
        {
          name: court
            ? "Shadow Footwork с акцент върху слабото предвижване"
            : "Координационни подскоци през конуси",
          sets: 4,
          repsOrDuration: "30 сек работа",
          restSec: 45,
          techniqueTip:
            "Поддържайте нисък център на тежестта и плавно оттласкване.",
          targetWeakness: `Дефицитен ъгъл (${weakestCorners})`,
        },
        {
          name: "Split-step стартове на къси дистанции",
          sets: 4,
          repsOrDuration: "6 старта",
          restSec: 45,
          techniqueTip: "Експлозивен преход от покой към спринт.",
          targetWeakness: "Реакция на корта",
        },
      ],
      cooldown: ["Стречинг за прасци и ходила"],
    },
    {
      dayName: "Ден 4: Интервална издръжливост & Възстановяване",
      focus: "Кардио-респираторен капацитет и дихателна издръжливост",
      intensity: "medium",
      durationMinutes: 45,
      warmup: ["Леко бягане 5 мин"],
      exercises: [
        {
          name: "Интервално бягане или велоергометър (30 сек бързо / 30 сек леко)",
          sets: 6,
          repsOrDuration: "1 минута интервал",
          restSec: 30,
          techniqueTip: "Поддържайте постоянна мощност в работните интервали.",
          targetWeakness: "Интервално възстановяване",
        },
        {
          name: "Йога и стречинг за тазобедрен пояс (90/90 stretch)",
          sets: 2,
          repsOrDuration: "60 сек на страна",
          restSec: 30,
          techniqueTip: "Плавни преходи без форсиране.",
          targetWeakness: "Мобилност при ниски топки",
        },
      ],
      cooldown: ["Дихателни упражнения"],
    },
    {
      dayName: "Ден 5: Пълноценна тренировка на цялото тяло",
      focus: "Синхронизиране на силата и мобилността",
      intensity: "medium",
      durationMinutes: 50,
      warmup: ["Динамична гимнастика"],
      exercises: [
        {
          name: "Комплекс от клек, напади и планк",
          sets: 3,
          repsOrDuration: "10 повторения на упражнение",
          restSec: 60,
          techniqueTip: "Плавни движения с фокус върху перфектната форма.",
          targetWeakness: "Цялостна мускулна кондиция",
        },
      ],
      cooldown: ["Стречинг"],
    },
    {
      dayName: "Ден 6: Активно възстановяване и регенерация",
      focus: "Релаксация на нервната система",
      intensity: "low",
      durationMinutes: 35,
      warmup: ["Лека разходка"],
      exercises: [
        {
          name: "Пресотерапия или леко въртене на велоергометър",
          sets: 1,
          repsOrDuration: "25 минути",
          restSec: 0,
          techniqueTip: "Ниска интензивност.",
          targetWeakness: "Възстановяване",
        },
      ],
      cooldown: ["Хидратация"],
    },
    {
      dayName: "Ден 7: Почивка",
      focus: "Пълен покой",
      intensity: "low",
      durationMinutes: 20,
      warmup: [],
      exercises: [],
      cooldown: [],
    },
  ];
}

function buildGoalSchedule(
  context: AthleteGeminiContext,
  targetSessionsCount: number,
  isDeload: boolean,
  isTaper: boolean,
  totalWeeks: number,
  sessionsPerWeek: number
): WorkoutProgram["schedule"] {
  const goal = context.targetOptions.targetGoal;
  let templates: DayTemplateConfig[];

  switch (goal) {
    case "explosive_power":
      templates = getExplosivePowerDays(context, isDeload, isTaper);
      break;
    case "aerobic_endurance":
      templates = getAerobicEnduranceDays(context, isDeload);
      break;
    case "agility_footwork":
      templates = getAgilityFootworkDays(context);
      break;
    case "injury_rehab":
      templates = getInjuryRehabDays();
      break;
    case "pre_tournament_taper":
      templates = getPreTournamentTaperDays(context);
      break;
    case "general_conditioning":
    default:
      templates = getGeneralConditioningDays(context, isDeload);
      break;
  }

  const activeTemplates = templates.filter(
    (t) => t.exercises && t.exercises.length > 0
  );
  const pool = activeTemplates.length > 0 ? activeTemplates : templates;
  const resultSchedule: WorkoutProgram["schedule"] = [];

  const startDateStr =
    context.targetOptions.startDate || new Date().toISOString().slice(0, 10);
  const cycleDurationDays = context.targetOptions.cycleDurationDays || 7;
  const eventsInPeriod = context.scheduleEventsInPeriod || [];

  for (let i = 0; i < targetSessionsCount; i++) {
    const t = pool[i % pool.length];
    const weekNum = Math.floor(i / sessionsPerWeek) + 1;
    const sessionInWeek = (i % sessionsPerWeek) + 1;

    // Distribute sessions across the cycle duration days
    const dayOffset = Math.min(
      cycleDurationDays - 1,
      Math.floor((i * cycleDurationDays) / targetSessionsCount)
    );
    const calendarDateStr = addDaysToIsoDate(startDateStr, dayOffset);

    // Check if this date has a competition in the schedule
    const matchedCompetition = eventsInPeriod.find(
      (ev) => ev.isCompetition && ev.date.startsWith(calendarDateStr)
    );

    const isCompetitionDay = !!matchedCompetition;
    const competitionTitle = matchedCompetition
      ? matchedCompetition.title
      : undefined;

    const dayLabel =
      totalWeeks > 1
        ? `Седмица ${weekNum}, Тренировка ${sessionInWeek}: ${t.dayName.replace(/^Ден \d+:\s*/, "")}`
        : `Ден ${i + 1}: ${t.dayName.replace(/^Ден \d+:\s*/, "")}`;

    resultSchedule.push({
      dayNumber: i + 1,
      dayName: dayLabel,
      calendarDate: calendarDateStr,
      isCompetitionDay,
      competitionTitle,
      focus: isCompetitionDay
        ? `🏆 Състезателен ден: ${competitionTitle} - тактическа кондиция и взривна активация`
        : t.focus,
      intensity: computeExerciseIntensity(t.intensity, isDeload, isTaper),
      durationMinutes: isDeload
        ? Math.round(t.durationMinutes * 0.75)
        : t.durationMinutes,
      warmup: t.warmup,
      exercises: t.exercises.map((ex) => ({
        ...ex,
        sets: computeExerciseSets(ex.sets, isDeload, isTaper),
      })),
      cooldown: t.cooldown,
    });
  }

  return resultSchedule;
}

function getGoalBulgarianTitle(goal: WorkoutTargetGoal): string {
  switch (goal) {
    case "explosive_power":
      return "Експлозивна Сила, Отскок & Мощност";
    case "aerobic_endurance":
      return "Аеробна & Лактатна Издръжливост";
    case "agility_footwork":
      return "Бързина на Корта, Координация & Футуърк";
    case "injury_rehab":
      return "Превенция, Мобилност & Рехабилитация";
    case "pre_tournament_taper":
      return "Предсъстезателен Тейпъринг & Пикова Острота";
    case "general_conditioning":
    default:
      return "Цялостна Кондиционна Подготовка (ОФП)";
  }
}

export function generateFallbackProgram(
  context: AthleteGeminiContext
): WorkoutProgram {
  const isDeload =
    context.workloadAndFatigue.recentFatigueTrend === "overreaching" ||
    context.workloadAndFatigue.averageRpeLast7Days > 7.5;
  const isTaper =
    context.targetOptions.targetGoal === "pre_tournament_taper" ||
    !!context.tournamentContext?.isTaperingActive;

  const restrictions = determineSafetyRestrictions(
    context.safetyAndMedical.activeInjuries,
    isDeload,
    isTaper
  );

  const cycleDays = context.targetOptions.cycleDurationDays || 7;
  const sessionsPerWeek = context.targetOptions.sessionsPerWeek || 3;
  const totalWeeks = Math.max(1, Math.round(cycleDays / 7));
  const targetSessionsCount = totalWeeks * sessionsPerWeek;

  const schedule = buildGoalSchedule(
    context,
    targetSessionsCount,
    isDeload,
    isTaper,
    totalWeeks,
    sessionsPerWeek
  );

  const coachNotesParts: string[] = [];
  if (context.targetOptions.notes && context.targetOptions.notes.trim()) {
    coachNotesParts.push(
      `Треньорски фокус: "${context.targetOptions.notes.trim()}".`
    );
  }
  if (isTaper) {
    coachNotesParts.push(
      "Предсъстезателен тейпъринг: намален обем на сериите (30-40%) за съхранение на нервната система и постигане на пикова взривна форма."
    );
  } else if (!context.targetOptions.courtAccess) {
    coachNotesParts.push("Сухо кондиционно ОФП без достъп до корт.");
  }
  coachNotesParts.push(
    "Програмата е стриктно съобразена с физическите тестове, турнирния график и RPE умората на състезателя."
  );

  const effStartDate =
    context.targetOptions.startDate || new Date().toISOString().slice(0, 10);
  const effEndDate = addDaysToIsoDate(effStartDate, cycleDays - 1);

  return {
    programTitle: `${getGoalBulgarianTitle(context.targetOptions.targetGoal)} (${context.profile.fullName})`,
    targetGoal: context.targetOptions.targetGoal,
    cycleDurationDays: cycleDays,
    sessionsPerWeek: sessionsPerWeek,
    startDate: effStartDate,
    endDate: effEndDate,
    targetAthlete: {
      id: context.profile.id,
      name: context.profile.fullName,
      age: context.profile.age,
      ageGroup: context.profile.ageGroup,
      skillLevel: context.profile.skillLevel,
    },
    safetyAudit: {
      activeRestrictions: restrictions,
      fatigueDeloadActive: isDeload,
      taperingActive: isTaper,
      coachSafetyNotes: coachNotesParts.join(" "),
    },
    schedule,
    recoveryRecommendations: [
      "Задължително 8+ часа качествен нощен сън за неврологично възстановяване.",
      "Хидратация: минимум 2.5 литра вода с електролити при интензивни натоварвания.",
      isDeload
        ? "Препоръчителни 2 сесии за пресотерапия (Recovery Boots) поради Deload режима."
        : "Препоръчителна сесия за пресотерапия (Recovery Boots) след тежък микроцикъл.",
      "Миофасциален релийз с фоумролер и динамичен стречинг след всяка сесия.",
    ],
    theoryAssignment:
      context.quizDeficits && context.quizDeficits.length > 0
        ? `Преговор на тема: ${context.quizDeficits[0].quizTitle} (Фокус: ${context.quizDeficits[0].deficitSummary})`
        : undefined,
    generatedAt: new Date().toISOString(),
  };
}

async function verifyRequestUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      return await getAuthUser(authHeader.substring(7));
    } catch {
      // Fall through to cookie
    }
  }
  return await getAuthUserFromSessionCookie();
}

async function tryModelGenerate(
  model: string,
  apiKey: string,
  prompt: string
): Promise<WorkoutProgram | null> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.4,
        },
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    if (res.status === 401 || res.status === 403) {
      console.warn(
        "[Gemini AI] Model authentication failed. Switching to dynamic engine.",
        model,
        res.status
      );
    } else {
      console.warn(
        "[Gemini API] Model returned HTTP error:",
        model,
        res.status,
        errText
      );
    }
    return null;
  }

  const geminiData = await res.json();
  const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) return null;

  try {
    let cleanJson = rawText.trim();
    if (cleanJson.startsWith("```json")) {
      cleanJson = cleanJson.slice(7);
    } else if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.slice(3);
    }
    if (cleanJson.endsWith("```")) {
      cleanJson = cleanJson.slice(0, -3);
    }
    cleanJson = cleanJson.trim();

    const parsed = JSON.parse(cleanJson);
    if (parsed && parsed.schedule && Array.isArray(parsed.schedule)) {
      return parsed as WorkoutProgram;
    }
  } catch (parseErr) {
    console.warn(
      "[Gemini API] Failed to parse JSON from model:",
      model,
      parseErr
    );
  }
  return null;
}

async function requestGeminiProgram(
  apiKey: string,
  context: AthleteGeminiContext
): Promise<WorkoutProgram | null> {
  const prompt = buildGeminiPrompt(context);
  const models = [
    "gemini-flash-lite-latest",
    "gemini-flash-latest",
    "gemini-3.5-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash-lite",
  ];

  for (const model of models) {
    try {
      const program = await tryModelGenerate(model, apiKey, prompt);
      if (program) return program;
    } catch (err) {
      console.warn("[Gemini API] Exception during model call:", model, err);
    }
  }
  return null;
}

function resolveGeminiApiKey(): string | undefined {
  try {
    const envPath = path.resolve(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      const match = content.match(
        /GEMINI_API_KEY\s*=\s*["']?([^"'\r\n]+)["']?/
      );
      if (match && match[1]) {
        const key = match[1].trim();
        if (key.length > 0) return key;
      }
    }
  } catch {
    // Fall back to process.env
  }
  return process.env.GEMINI_API_KEY?.trim();
}

export async function POST(req: NextRequest) {
  try {
    const user = await verifyRequestUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = RequestSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const {
      memberId,
      targetGoal,
      cycleDurationDays,
      sessionsPerWeek,
      courtAccess,
      notes,
      startDate,
    } = validated.data;

    const context = await getAthleteGeminiContext(memberId, {
      targetGoal: targetGoal as WorkoutTargetGoal,
      cycleDurationDays,
      sessionsPerWeek,
      courtAccess,
      notes,
      startDate,
    });

    const apiKey = resolveGeminiApiKey();
    let program: WorkoutProgram | null = null;

    if (apiKey) {
      try {
        program = await requestGeminiProgram(apiKey, context);
      } catch (geminiErr) {
        console.error("Gemini API call failed, falling back:", geminiErr);
      }
    }

    if (!program) {
      program = generateFallbackProgram(context);
    }

    const effectiveStartDate =
      context.targetOptions.startDate || new Date().toISOString().slice(0, 10);
    const effectiveEndDate = addDaysToIsoDate(
      effectiveStartDate,
      cycleDurationDays - 1
    );

    program.startDate = effectiveStartDate;
    program.endDate = effectiveEndDate;
    program.targetGoal = targetGoal as WorkoutTargetGoal;
    program.cycleDurationDays = cycleDurationDays;
    program.sessionsPerWeek = sessionsPerWeek;

    // Ensure calendar dates and competition flags are set on every schedule day
    if (program.schedule && Array.isArray(program.schedule)) {
      program.schedule.forEach((day, idx) => {
        if (!day.calendarDate) {
          const offset = Math.min(
            cycleDurationDays - 1,
            Math.floor((idx * cycleDurationDays) / program.schedule.length)
          );
          day.calendarDate = addDaysToIsoDate(effectiveStartDate, offset);
        }
        if (day.isCompetitionDay === undefined) {
          const matchedEv = context.scheduleEventsInPeriod?.find(
            (ev) => ev.isCompetition && ev.date.startsWith(day.calendarDate!)
          );
          if (matchedEv) {
            day.isCompetitionDay = true;
            day.competitionTitle = matchedEv.title;
          } else {
            day.isCompetitionDay = false;
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      program,
      context,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    console.error("Error generating workout program:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
