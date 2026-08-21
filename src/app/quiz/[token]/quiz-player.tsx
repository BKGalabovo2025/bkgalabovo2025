"use client";

import {
  BookOpen,
  ChevronRight,
  Loader2,
  MessageSquare,
  Trophy,
} from "lucide-react";
import { useEffect, useState } from "react";

import { quizService } from "@/services/quiz-service";
import type { Quiz, TheoryResult } from "@/types/quiz.types";

interface QuizPlayerProps {
  token: string;
}

type Step = "loading" | "not-found" | "answering" | "submitting" | "done";

export default function QuizPlayer({ token }: QuizPlayerProps) {
  const [step, setStep] = useState<Step>("loading");
  const [result, setResult] = useState<TheoryResult | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [currentQ, setCurrentQ] = useState(0);

  useEffect(() => {
    void loadResult();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadResult = async () => {
    setStep("loading");
    try {
      const r = await quizService.getResultByToken(token);
      if (!r) {
        setStep("not-found");
        return;
      }
      setResult(r);

      const quizData = await quizService.getQuizzes(r.siteId);
      const found = quizData.find((q) => q.id === r.quizId);
      if (found) setQuiz(found);

      if (r.status === "REVIEWED" || r.answers) {
        setStep("done");
        return;
      }

      setStep("answering");
    } catch {
      setStep("not-found");
    }
  };

  const handleSelectAnswer = (questionId: string, value: number | string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    if (!result || !quiz) return;
    setStep("submitting");
    try {
      let autoScore = 0;
      for (const q of quiz.questions) {
        if (q.type === "SINGLE_CHOICE" && answers[q.id] === q.correctAnswer) {
          autoScore += q.points;
        }
      }
      const openQ = quiz.questions.find((q) => q.type === "OPEN_TEXT");
      const tacticalAnswer = openQ ? String(answers[openQ.id] ?? "") : "";
      await quizService.submitTacticalAnswer(
        result.id,
        autoScore,
        tacticalAnswer,
        answers
      );
      setResult((prev) =>
        prev ? { ...prev, autoScore, totalScore: autoScore, answers } : prev
      );
      setStep("done");
    } catch {
      setStep("answering");
    }
  };

  if (step === "loading" || step === "submitting") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <Loader2 className="size-12 animate-spin text-indigo-500" />
        <p className="text-lg font-semibold text-indigo-700">
          {step === "submitting"
            ? "Записваме отговорите ти... ✍️"
            : "Зареждане на теста..."}
        </p>
      </div>
    );
  }

  if (step === "not-found") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-br from-red-50 to-orange-50 p-6">
        <div className="text-6xl">😕</div>
        <h1 className="text-2xl font-black text-red-600">
          Тестът не е намерен
        </h1>
        <p className="max-w-sm text-center text-zinc-600">
          Линкът може да е изтекъл. Попитай треньора си за нов линк!
        </p>
      </div>
    );
  }

  if (step === "done" && result) {
    const pct = result.totalScore;
    const isReviewed = result.status === "REVIEWED";

    let emoji = "📚";
    let bgColor = "bg-gradient-to-br from-blue-400 to-indigo-500";
    let message = "💪 Учи и опитай пак!";

    if (pct >= 80) {
      emoji = "🏆";
      bgColor = "bg-gradient-to-br from-emerald-400 to-green-500";
      message = "🌟 Страхотна работа!";
    } else if (pct >= 60) {
      emoji = "🥈";
      bgColor = "bg-gradient-to-br from-amber-400 to-orange-400";
      message = "👍 Добре се справи!";
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
        <div className="mx-auto max-w-lg space-y-6 py-8">
          <div className="text-center">
            <div className="mb-2 text-5xl">{emoji}</div>
            <h1 className="text-2xl font-black text-indigo-800">
              {result.quizTitle}
            </h1>
            <p className="mt-1 text-zinc-500">Твоят резултат</p>
          </div>
          <div className="overflow-hidden rounded-3xl bg-white shadow-xl">
            <div className={`flex items-center justify-center p-8 ${bgColor}`}>
              <div className="text-center text-white">
                <div className="text-6xl font-black">{result.totalScore}</div>
                <div className="text-xl font-bold opacity-90">/ 100 точки</div>
              </div>
            </div>
            <div className="space-y-4 p-6">
              {isReviewed ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Автоматични въпроси</span>
                    <span className="font-bold text-zinc-800">
                      {result.autoScore} т.
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">
                      Тактическа мисия (от треньора)
                    </span>
                    <span className="font-bold text-zinc-800">
                      {result.manualScore} т.
                    </span>
                  </div>
                  {result.coachFeedback && (
                    <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <MessageSquare className="size-4 text-indigo-600" />
                        <span className="text-sm font-bold text-indigo-700">
                          Бележка от Треньора
                        </span>
                      </div>
                      <p className="text-sm text-indigo-800 italic">
                        &quot;{result.coachFeedback}&quot;
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-2xl bg-amber-50 p-4 text-center">
                  <p className="text-sm font-medium text-amber-700">
                    ⏳ Получи <strong>{result.autoScore} т.</strong> от
                    автоматичните въпроси!
                  </p>
                  <p className="mt-1 text-xs text-amber-600">
                    Треньорът ще провери тактическата ти мисия скоро.
                  </p>
                </div>
              )}
              <div className="mb-6 text-center text-3xl">{message}</div>

              {quiz && result.answers && (
                <div className="mt-6 space-y-4 border-t border-zinc-100 pt-6">
                  <h3 className="mb-4 text-lg font-black text-indigo-900">
                    Твоите отговори
                  </h3>
                  {quiz.questions.map((q, i) => {
                    const isSingleChoice = q.type === "SINGLE_CHOICE";
                    const userAnswer = result.answers?.[q.id];
                    return (
                      <div
                        key={q.id}
                        className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
                      >
                        <p className="mb-3 text-sm font-bold text-zinc-800">
                          {i + 1}. {q.text}
                        </p>
                        {isSingleChoice ? (
                          <div className="space-y-2">
                            {q.options?.map((opt, optIdx) => {
                              const isSelected = userAnswer === optIdx;
                              const isActuallyCorrect =
                                q.correctAnswer === optIdx;

                              let bgClass =
                                "bg-white border-zinc-200 text-zinc-600";
                              let bgClassCircle = "bg-zinc-200 text-zinc-500";

                              if (isActuallyCorrect) {
                                bgClass =
                                  "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold";
                                bgClassCircle = "bg-emerald-500 text-white";
                              } else if (isSelected) {
                                bgClass =
                                  "bg-red-50 border-red-300 text-red-800";
                                bgClassCircle = "bg-red-500 text-white";
                              }

                              return (
                                <div
                                  key={optIdx}
                                  className={`flex items-center gap-3 rounded-xl border p-3 text-sm ${bgClass}`}
                                >
                                  <div
                                    className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${bgClassCircle}`}
                                  >
                                    {["А", "Б", "В"][optIdx] ??
                                      String(optIdx + 1)}
                                  </div>
                                  <span>{opt}</span>
                                  {isSelected && (
                                    <span className="ml-auto text-xs opacity-70">
                                      Твой отговор
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="rounded-xl border border-purple-200 bg-purple-50 p-3 text-sm text-purple-800">
                              <span className="mb-1 block text-xs font-bold uppercase opacity-70">
                                Твоят отговор:
                              </span>
                              {userAnswer || (
                                <span className="italic opacity-50">
                                  Няма отговор
                                </span>
                              )}
                            </div>
                            {isReviewed && (
                              <div className="text-right text-xs font-bold text-purple-600">
                                Оценено: {result.manualScore} / {q.points} т.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!quiz || step !== "answering") return null;
  const questions = quiz.questions;
  const q = questions[currentQ];
  const isLast = currentQ === questions.length - 1;
  const progress = Math.round((currentQ / questions.length) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
      <div className="mx-auto max-w-lg space-y-6 py-8">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <BookOpen className="size-5 text-indigo-500" />
            <span className="text-sm font-bold tracking-wide text-indigo-700 uppercase">
              {quiz.title}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-indigo-100">
            <div
              className={`h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 w-[${progress}%]`}
            />
          </div>
          <p className="mt-1 text-right text-xs text-zinc-500">
            Въпрос {currentQ + 1} от {questions.length}
          </p>
        </div>
        <div className="overflow-hidden rounded-3xl bg-white shadow-xl">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6">
            <div className="mb-3 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white">
              {q.type === "OPEN_TEXT"
                ? "🧠 Тактическа мисия"
                : `❓ ${q.points} точки`}
            </div>
            <p className="text-lg leading-snug font-bold text-white">
              {q.text}
            </p>
          </div>
          <div className="space-y-3 p-6">
            {q.type === "SINGLE_CHOICE" &&
              q.options?.map((opt, i) => {
                const selected = answers[q.id] === i;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectAnswer(q.id, i)}
                    className={`w-full rounded-2xl border-2 p-4 text-left text-sm font-medium transition-all ${selected ? "border-indigo-500 bg-indigo-50 text-indigo-800 shadow-md" : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-indigo-300 hover:bg-indigo-50"}`}
                  >
                    <span
                      className={`mr-3 inline-flex size-7 items-center justify-center rounded-full text-sm font-black ${selected ? "bg-indigo-500 text-white" : "bg-zinc-200 text-zinc-600"}`}
                    >
                      {["А", "Б", "В"][i]}
                    </span>
                    {opt}
                  </button>
                );
              })}
            {q.type === "OPEN_TEXT" && (
              <textarea
                value={String(answers[q.id] ?? "")}
                onChange={(e) => handleSelectAnswer(q.id, e.target.value)}
                placeholder="Напиши своя отговор тук... 📝"
                rows={4}
                className="w-full resize-none rounded-2xl border-2 border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            )}
          </div>
        </div>
        <div className="flex gap-3">
          {currentQ > 0 && (
            <button
              type="button"
              onClick={() => setCurrentQ((p) => p - 1)}
              className="flex-1 rounded-2xl border-2 border-zinc-200 bg-white py-4 text-sm font-bold text-zinc-600 transition-all hover:bg-zinc-50"
            >
              ← Назад
            </button>
          )}
          {!isLast ? (
            <button
              type="button"
              onClick={() => setCurrentQ((p) => p + 1)}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 py-4 text-sm font-bold text-white shadow-lg transition-all hover:from-indigo-600 hover:to-purple-700"
            >
              Напред <ChevronRight className="size-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleSubmit()}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 py-4 text-sm font-bold text-white shadow-lg transition-all hover:from-emerald-600 hover:to-green-700"
            >
              <Trophy className="size-4" /> Предай Теста!
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
