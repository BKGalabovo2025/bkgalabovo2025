export interface TacticalEvaluation {
  suggestedScore: number;
  maxScore: number;
  feedback: string;
  identifiedSteps: string[];
}

function checkNonAnswer(raw: string): boolean {
  return (
    raw.includes("нямам отговор") ||
    raw.includes("не знам") ||
    raw.includes("незнам") ||
    raw.includes("нз") ||
    raw.includes("не мога") ||
    raw.includes("нищо") ||
    raw === "-" ||
    raw === "." ||
    raw.length < 5
  );
}

function detectTacticalSteps(raw: string): string[] {
  const steps: string[] = [];
  if (
    raw.includes("сервис") ||
    raw.includes("сервиз") ||
    raw.includes("начален удар")
  ) {
    steps.push("Начален сервис / подготовка");
  }
  if (
    raw.includes("къс") ||
    raw.includes("мрежа") ||
    raw.includes("мрежата") ||
    raw.includes("пусна") ||
    raw.includes("късо") ||
    raw.includes("под мрежа")
  ) {
    steps.push("Отиграване на мрежата (къса игра)");
  }
  if (
    raw.includes("вдиг") ||
    raw.includes("висок") ||
    raw.includes("лоб") ||
    raw.includes("клиър") ||
    raw.includes("назад") ||
    raw.includes("дълбоко") ||
    raw.includes("задна линия")
  ) {
    steps.push("Провокиране / игра на задна линия (високо/дълбоко)");
  }
  if (
    raw.includes("смач") ||
    raw.includes("смаш") ||
    raw.includes("заби") ||
    raw.includes("атака") ||
    raw.includes("завърш") ||
    raw.includes("удар надолу") ||
    raw.includes("драйв") ||
    raw.includes("натиск")
  ) {
    steps.push("Атакуващ завършек / натиск (смач / драйв)");
  }
  if (
    raw.includes("дроп") ||
    raw.includes("сечен") ||
    raw.includes("лъжлив") ||
    raw.includes("финт") ||
    raw.includes("ъгъл")
  ) {
    steps.push("Тактическа промяна на темпото (дроп / финт)");
  }
  return steps;
}

function computeQualityScore(stepsCount: number, maxPoints: number): number {
  if (stepsCount >= 4) return Math.round(maxPoints * 0.95);
  if (stepsCount === 3) return Math.round(maxPoints * 0.75);
  if (stepsCount === 2) return Math.round(maxPoints * 0.5);
  if (stepsCount === 1) return Math.round(maxPoints * 0.25);
  return 0;
}

export function evaluateTacticalAnswer(
  _questionText: string,
  answerText: string,
  maxPoints: number = 28
): TacticalEvaluation {
  if (!answerText || !answerText.trim()) {
    return {
      suggestedScore: 0,
      maxScore: maxPoints,
      feedback:
        "Състезателят не е предоставил отговор на тактическата задача (0 т.).",
      identifiedSteps: [],
    };
  }

  const raw = answerText.toLowerCase().trim();
  if (checkNonAnswer(raw)) {
    return {
      suggestedScore: 0,
      maxScore: maxPoints,
      feedback:
        "Състезателят няма отговор или не е отговорил по същество на тактическата задача (0/28 т.).",
      identifiedSteps: [],
    };
  }

  const steps = detectTacticalSteps(raw);
  if (steps.length === 0) {
    return {
      suggestedScore: 0,
      maxScore: maxPoints,
      feedback:
        "В отговора не са разпознати специфични бадминтон удари или тактически фази (0/28 т.).",
      identifiedSteps: [],
    };
  }

  const qualityScore = computeQualityScore(steps.length, maxPoints);
  const suggestedScore = Math.min(maxPoints, Math.max(0, qualityScore));

  let feedback = "";
  if (suggestedScore >= Math.round(maxPoints * 0.85)) {
    feedback = `Отлична тактическа мисъл (${suggestedScore}/${maxPoints} т.)! Структурирани фази: ${steps.join(" -> ")}.`;
  } else if (suggestedScore >= Math.round(maxPoints * 0.5)) {
    feedback = `Добър тактически замисъл (${suggestedScore}/${maxPoints} т.). Елементи: ${steps.join(", ")}. Препоръчва се повече детайл за завършека.`;
  } else {
    feedback = `Частичен тактически отговор (${suggestedScore}/${maxPoints} т.). Разпознат елемент: ${steps.join(", ")}.`;
  }

  return {
    suggestedScore,
    maxScore: maxPoints,
    feedback,
    identifiedSteps: steps,
  };
}
