import { NextResponse } from "next/server";
import { z } from "zod";

import { getAdminDb } from "@/lib/firebase-admin";

const QuizQuestionPayloadSchema = z.object({
  id: z.string(),
  text: z.string(),
  options: z.array(z.string()).optional(),
  correctAnswer: z.number().optional(),
  type: z.string(),
  points: z.number().optional(),
});

const AiFeedbackRequestSchema = z.object({
  resultId: z.string().min(1),
  quizTitle: z.string(),
  questions: z.array(QuizQuestionPayloadSchema),
  userAnswers: z.record(z.string(), z.union([z.number(), z.string()])),
  autoScore: z.number(),
  maxAutoScore: z.number(),
});

// Badminton rules knowledge base for precise fallback explanations
function generateRuleBasedExplanation(
  q: { text: string; options?: string[]; correctAnswer?: number },
  userChoiceIndex?: number
): string {
  const text = q.text.toLowerCase();
  const cIndex = q.correctAnswer ?? 0;
  const correctText = q.options?.[cIndex] || "правилният вариант";
  const userText =
    typeof userChoiceIndex === "number" && q.options
      ? q.options[userChoiceIndex]
      : "";

  if (text.includes("точки се играе") || text.includes("гейм")) {
    return `Според официалните правила на BWF (Световната федерация по бадминтон), един стандартен гейм се играе до 21 точки (с разлика от поне 2 точки).`;
  }
  if (text.includes("висока мрежата") || text.includes("стълбчетата")) {
    return `Височината на мрежата по правилника на BWF е точно 1.55 метра в двата края (при стълбовете) и 1.524 метра в самия център на корта.`;
  }
  if (
    text.includes("четен") ||
    text.includes("сервираш") ||
    text.includes("страна на корта")
  ) {
    return `В бадминтона при четен брой точки на сервиращия (0, 2, 4, 6...) се сервира винаги от дясното поле, а при нечетен брой точки – от лявото поле.`;
  }
  if (
    text.includes("закача") ||
    text.includes("филето") ||
    text.includes("мрежата")
  ) {
    return `Ако при сервис перото закачи филето/горния ръб на мрежата, но премине оттатък и падне в правилното поле за сервис на противника, играта продължава нормално без прекъсване.`;
  }
  if (text.includes("обувки") || text.includes("настилката")) {
    return `Задължително се изискват чисти обувки със специална подметка за зала (Non-marking), която не оставя следи и предпазва глезените от подхлъзване.`;
  }
  if (text.includes("сингъл") && text.includes("линии")) {
    return `При игра поединично (сингъл) по време на цялото разиграване важат вътрешните странични линии – кортът е по-тесен.`;
  }
  if (text.includes("почивка") && text.includes("гейм")) {
    return `Официалното правило на BWF предвижда точно 2 минути (120 секунди) интервал/почивка между отделните геймове и до 60 секунди, когато някой състезател достигне 11 точки.`;
  }
  if (
    text.includes("място") ||
    text.includes("дом") ||
    text.includes("база") ||
    text.includes("връщаш")
  ) {
    return `След всеки нанесен удар състезателят трябва незабавно да се върне в своята 'База' – в центъра на корта, за да покрива еднакво добре всички посоки.`;
  }
  if (
    text.includes("двойки") &&
    (text.includes("състезатели") || text.includes("играчи"))
  ) {
    return `В мач на двойки на корта играят два отбора по двама състезатели, което прави общо 4 състезатели.`;
  }

  const userTextSuffix = userText
    ? ` Твоят избор "${userText}" не съответства на стандартите на играта.`
    : "";
  return `Според официалните правила на бадминтона верният отговор е "${correctText}".${userTextSuffix}`;
}

function generateRuleBasedCoachFeedback(
  quizTitle: string,
  autoScore: number,
  maxAutoScore: number,
  _wrongCount?: number,
  playerName?: string
): string {
  const percentage =
    maxAutoScore > 0 ? Math.round((autoScore / maxAutoScore) * 100) : 100;
  const namePrefix = playerName ? `${playerName}, ` : "";

  if (percentage >= 90) {
    return `${namePrefix}отлично представяне по правилата и тактиката! Демонстрираш стабилни теоретични знания, които ти помагат и на корта. Продължавай все така!`;
  } else if (percentage >= 65) {
    return `${namePrefix}добър резултат (${autoScore}/${maxAutoScore} т.). Имаш солидна основа, но обърни внимание на сбърканите детайли от правилата, за да си още по-уверен/а по време на състезания.`;
  } else {
    return `${namePrefix}добър опит на теста "${quizTitle}". Препоръчвам ти да преговориш основните правила на BWF за размери на корта и сервис зони – това ще подобри значително тактическото ти мислене в игра!`;
  }
}

type QuizQuestionPayload = z.infer<typeof QuizQuestionPayloadSchema>;

async function requestGeminiFeedback(
  quizTitle: string,
  questions: QuizQuestionPayload[],
  userAnswers: Record<string, number | string>,
  autoScore: number,
  maxAutoScore: number
) {
  const apiKey =
    process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  // Find all WRONG single choice questions
  const wrongQuestions = questions.filter((q) => {
    if (q.type !== "SINGLE_CHOICE") return false;
    const uAns = userAnswers[q.id];
    return uAns !== q.correctAnswer && typeof uAns === "number";
  });

  // Default fallback data
  const fallbackExplanations: Record<string, string> = {};
  wrongQuestions.forEach((q) => {
    const uAns = userAnswers[q.id];
    fallbackExplanations[q.id] = generateRuleBasedExplanation(
      q,
      typeof uAns === "number" ? uAns : undefined
    );
  });
  const fallbackCoachFeedback = generateRuleBasedCoachFeedback(
    quizTitle,
    autoScore,
    maxAutoScore,
    wrongQuestions.length
  );

  if (wrongQuestions.length === 0 && autoScore === maxAutoScore) {
    return {
      aiExplanations: {},
      proposedCoachFeedback:
        "Отлично представяне на теста! Всички въпроси по правилата са решени без грешка. Браво!",
    };
  }

  if (!apiKey) {
    return {
      aiExplanations: fallbackExplanations,
      proposedCoachFeedback: fallbackCoachFeedback,
    };
  }

  const promptDetails = wrongQuestions
    .map((q) => {
      const uAns = userAnswers[q.id];
      const uAnsText =
        typeof uAns === "number" && q.options
          ? q.options[uAns]
          : "Не е посочен";
      const cAnsText =
        typeof q.correctAnswer === "number" && q.options
          ? q.options[q.correctAnswer]
          : "Не е посочен";
      return `Въпрос: "${q.text}"\nОтговор на състезателя: "${uAnsText}"\nВерен отговор: "${cAnsText}"\nID: ${q.id}`;
    })
    .join("\n\n");

  const prompt = `Вие сте професионален треньор по бадминтон.
Състезател току-що завърши теоретичен тест на тема "${quizTitle}".
Резултат от затворените въпроси: ${autoScore} от ${maxAutoScore} т.

По-долу са въпросите, на които състезателят е отговорил ГРЕШНО:
${promptDetails || "Няма грешни затворени въпроси."}

Моля, генерирайте:
1. За всеки грешен въпрос (по неговото ID), напишете кратко, точно обяснение (1-2 изречения) на български език ЗАЩО верният отговор е правилен според официалните правила на BWF/бадминтона.
2. Кратко, насърчително ревю/коментар от името на треньора (2-3 изречения), базирано на цялостното представяне.

Върнете отговора СТРИКТНО в следния JSON формат:
{
  "explanations": {
    "question_id": "Обяснение..."
  },
  "proposedCoachFeedback": "Ревю от треньора..."
}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      }
    );

    if (!res.ok) {
      return {
        aiExplanations: fallbackExplanations,
        proposedCoachFeedback: fallbackCoachFeedback,
      };
    }
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return {
        aiExplanations: fallbackExplanations,
        proposedCoachFeedback: fallbackCoachFeedback,
      };
    }

    const parsed = JSON.parse(text);
    return {
      aiExplanations: parsed.explanations || fallbackExplanations,
      proposedCoachFeedback:
        parsed.proposedCoachFeedback || fallbackCoachFeedback,
    };
  } catch (err) {
    console.error("Gemini AI feedback error (using fallback):", err);
    return {
      aiExplanations: fallbackExplanations,
      proposedCoachFeedback: fallbackCoachFeedback,
    };
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = AiFeedbackRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const {
      resultId,
      quizTitle,
      questions,
      userAnswers,
      autoScore,
      maxAutoScore,
    } = parsed.data;

    // Verify result exists in Firestore
    const db = getAdminDb();
    const resultRef = db.collection("theory_results").doc(resultId);
    const resultSnap = await resultRef.get();
    if (!resultSnap.exists) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 });
    }

    const aiFeedback = await requestGeminiFeedback(
      quizTitle,
      questions,
      userAnswers,
      autoScore,
      maxAutoScore
    );

    await resultRef.update({
      aiExplanations: aiFeedback.aiExplanations,
      proposedCoachFeedback: aiFeedback.proposedCoachFeedback,
    });

    return NextResponse.json(aiFeedback);
  } catch (err: unknown) {
    console.error("Error in AI Feedback API:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
