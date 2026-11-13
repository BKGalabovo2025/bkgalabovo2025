"use client";

import { History, Trash2, Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { quizService } from "@/services/quiz-service";
import { TheoryResult } from "@/types/quiz.types";

interface MemberTheoryTabProps {
  memberId: string;
}

export const MemberTheoryTab = ({ memberId }: MemberTheoryTabProps) => {
  const [results, setResults] = useState<TheoryResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await quizService.getResultsByMember(memberId);
        setResults(data);
      } catch (error) {
        console.error("Error loading theory results:", error);
        toast.error("Грешка при зареждане на тестовете");
      } finally {
        setIsLoading(false);
      }
    };
    void loadData();
  }, [memberId]);

  if (isLoading) {
    return (
      <div className="animate-pulse p-8 text-center text-zinc-500 dark:text-zinc-400">
        Зареждане на тестове...
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 py-16 text-center">
        <History className="mx-auto mb-4 size-10 text-zinc-300 dark:text-zinc-700" />
        <h3 className="font-bold text-zinc-700 dark:text-zinc-300">
          Няма попълнени тестове
        </h3>
        <p className="mt-1 text-sm text-zinc-400">
          Това дете все още не е предало нито един теоретичен тест.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/training/theory"
            className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Теория и тестове
          </Link>
          <Link
            href="/training/theory/review"
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Проверка на тестове
          </Link>
        </div>
      </div>
    );
  }

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Сигурни ли сте, че искате да изтриете този резултат? Това действие е необратимо."
      )
    )
      return;
    try {
      await quizService.deleteResult(id);
      toast.success("Резултатът е изтрит успешно.");
      setResults(results.filter((r) => r.id !== id));
    } catch (error) {
      console.error("Error deleting result:", error);
      toast.error("Грешка при изтриване");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Link
          href="/training/theory"
          className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Теория и тестове
        </Link>
        <Link
          href="/training/theory/review"
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Проверка на тестове
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {results.map((r) => {
          const isReviewed = r.status === "REVIEWED";
          return (
            <Card
              key={r.id}
              className="overflow-hidden rounded-2xl border-zinc-200 dark:border-zinc-800"
            >
              <div className="flex items-start justify-between gap-2 bg-zinc-50 dark:bg-zinc-900 px-5 py-4">
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge
                      className={`text-[10px] ${isReviewed ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100" : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100"}`}
                    >
                      {isReviewed ? "ОЦЕНЕН" : "ЗА ПРОВЕРКА"}
                    </Badge>
                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                      {new Date(r.submittedAt).toLocaleDateString("bg-BG")}
                    </span>
                  </div>
                  <h3 className="leading-tight font-bold text-zinc-900 dark:text-zinc-100">
                    {r.quizTitle}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => void handleDelete(r.id)}
                  className="shrink-0 rounded-lg p-1 text-zinc-400 transition-colors hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600"
                  title="Изтрий теста"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              <CardContent className="space-y-4 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500">
                    <Trophy className="size-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                      Резултат
                    </p>
                    <p className="font-bold text-zinc-900 dark:text-zinc-100">
                      {r.totalScore}{" "}
                      <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
                        точки
                      </span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-3 text-xs">
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Автоматични:{" "}
                    </span>
                    <span className="font-bold dark:text-zinc-100">
                      {r.autoScore}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400">
                      От треньор:{" "}
                    </span>
                    <span className="font-bold dark:text-zinc-100">
                      {r.manualScore ?? 0}
                    </span>
                  </div>
                </div>

                {isReviewed && r.coachFeedback && (
                  <div className="mt-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 p-3">
                    <p className="mb-1 text-[10px] font-bold text-zinc-400 uppercase">
                      Отзив от треньор
                    </p>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 italic">
                      &quot;{r.coachFeedback}&quot;
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
