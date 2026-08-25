import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthUser } from "@/lib/auth-utils";
import { getAdminDb } from "@/lib/firebase-admin";

const EvalRequestSchema = z.object({
  resultId: z.string().min(1),
  questionText: z.string().min(1),
  tacticalAnswer: z.string().min(1),
  maxPoints: z.number().int().min(1).default(28),
});

interface AiEvalResult {
  aiScore: number;
  aiFeedback: string;
}

async function requestGeminiEvaluation(
  questionText: string,
  tacticalAnswer: string,
  maxPoints: number
): Promise<AiEvalResult | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const prompt = `Вие сте професионален треньор по бадминтон.
Оценете следния отговор на състезател по тактически казус:
Въпрос/Казус: "${questionText}"
Отговор на състезателя: "${tacticalAnswer}"
Максимален брой точки: ${maxPoints}.

Моля, върнете JSON формат:
{
  "score": <число между 0 и ${maxPoints}>,
  "feedback": "<кратка, насърчителна и градивна тактическа обратна връзка на български език (до 2 изречения)>"
}`;

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

    if (!res.ok) return null;
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    const parsed = JSON.parse(text);
    return {
      aiScore:
        typeof parsed.score === "number"
          ? Math.min(maxPoints, Math.max(0, Math.round(parsed.score)))
          : Math.round(maxPoints * 0.75),
      aiFeedback:
        typeof parsed.feedback === "string"
          ? parsed.feedback
          : "Добър тактически подход.",
    };
  } catch (err) {
    console.error("Gemini AI evaluation fallback triggered:", err);
    return null;
  }
}

async function authorizeUser(request: Request): Promise<boolean> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return false;
  try {
    await getAuthUser(authHeader.substring(7));
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const isAuthorized = await authorizeUser(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = EvalRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { resultId, questionText, tacticalAnswer, maxPoints } = parsed.data;

    const fallback: AiEvalResult = {
      aiScore: Math.round(maxPoints * 0.75),
      aiFeedback:
        "Добър тактически подход. Препоръчва се повече дълбочина при изчистването и по-бързо заемане на централна позиция на корта.",
    };

    const geminiResult = await requestGeminiEvaluation(
      questionText,
      tacticalAnswer,
      maxPoints
    );

    const finalResult = geminiResult || fallback;

    const adminDb = getAdminDb();
    const docRef = adminDb.collection("theory_results").doc(resultId);
    await docRef.update({
      aiScore: finalResult.aiScore,
      aiFeedback: finalResult.aiFeedback,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      aiScore: finalResult.aiScore,
      aiFeedback: finalResult.aiFeedback,
    });
  } catch (error) {
    console.error("Error in /api/quiz/ai-eval:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
