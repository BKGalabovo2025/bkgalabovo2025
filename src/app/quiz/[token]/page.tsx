import { Loader2 } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { getAdminDb } from "@/lib/firebase-admin";
import type { Quiz, TheoryResult } from "@/types/quiz.types";

import QuizPlayer from "./quiz-player";

export const metadata: Metadata = {
  title: "Интерактивен тест по бадминтон | БК Гълъбово",
  description:
    "Тест за бадминтон тактика, правила и теория за състезатели и любители на Бадминтон Клуб Гълъбово.",
};

export const dynamic = "force-dynamic";

async function loadQuizByTokenAdmin(token: string): Promise<{
  initialResult: TheoryResult | null;
  initialQuiz: Quiz | null;
}> {
  try {
    const db = getAdminDb();
    const resSnap = await db
      .collection("theory_results")
      .where("shareToken", "==", token)
      .limit(1)
      .get();
    if (resSnap.empty) {
      return { initialResult: null, initialQuiz: null };
    }
    const rDoc = resSnap.docs[0];
    const initialResult = { id: rDoc.id, ...rDoc.data() } as TheoryResult;
    let initialQuiz: Quiz | null = null;
    if (initialResult.quizId) {
      const qDoc = await db
        .collection("quizzes")
        .doc(initialResult.quizId)
        .get();
      if (qDoc.exists) {
        initialQuiz = { id: qDoc.id, ...qDoc.data() } as Quiz;
      }
    }
    return { initialResult, initialQuiz };
  } catch {
    return { initialResult: null, initialQuiz: null };
  }
}

export default async function QuizTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const { initialResult, initialQuiz } = await loadQuizByTokenAdmin(token);
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-indigo-50 via-purple-50 to-pink-50">
          <Loader2 className="size-10 animate-spin text-indigo-500" />
        </div>
      }
    >
      <QuizPlayer
        token={token}
        initialResult={initialResult}
        initialQuiz={initialQuiz}
      />
    </Suspense>
  );
}
