"use client";

import { Check, Clock, Trophy, History, Trash2 } from "lucide-react";
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
      <div className="animate-pulse p-8 text-center text-slate-400">
        Зареждане на тестове...
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-200 py-16 text-center">
        <History className="mx-auto mb-4 size-10 text-zinc-300" />
        <h3 className="font-bold text-zinc-700">Няма попълнени тестове</h3>
        <p className="mt-1 text-sm text-zinc-400">
          Това дете все още не е предало нито един теоретичен тест.
        </p>
      </div>
    );
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Сигурни ли сте, че искате да изтриете този резултат? Това действие е необратимо.")) return;
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
    <div className="grid gap-4 sm:grid-cols-2">
      {results.map((r) => {
        const isReviewed = r.status === "REVIEWED";
        return (
          <Card key={r.id} className="overflow-hidden rounded-2xl border-zinc-200">
            <div className="bg-zinc-50 px-5 py-4 flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={`text-[10px] ${isReviewed ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : "bg-amber-100 text-amber-700 hover:bg-amber-100"}`}>
                    {isReviewed ? "ОЦЕНЕН" : "ЗА ПРОВЕРКА"}
                  </Badge>
                  <span className="text-xs font-semibold text-zinc-500">
                    {new Date(r.submittedAt).toLocaleDateString("bg-BG")}
                  </span>
                </div>
                <h3 className="font-bold text-zinc-900 leading-tight">{r.quizTitle}</h3>
              </div>
              <button
                type="button"
                onClick={() => void handleDelete(r.id)}
                className="shrink-0 text-zinc-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors"
                title="Изтрий теста"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
                  <Trophy className="size-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    Резултат
                  </p>
                  <p className="font-bold text-zinc-900">
                    {r.totalScore} <span className="text-xs text-zinc-500 font-normal">точки</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs border-t border-zinc-100 pt-3">
                <div>
                  <span className="text-zinc-500">Автоматични: </span>
                  <span className="font-bold">{r.autoScore}</span>
                </div>
                <div>
                  <span className="text-zinc-500">От треньор: </span>
                  <span className="font-bold">{r.manualScore ?? 0}</span>
                </div>
              </div>

              {isReviewed && r.coachFeedback && (
                <div className="rounded-xl bg-zinc-50 p-3 mt-2">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">
                    Отзив от треньор
                  </p>
                  <p className="text-xs text-zinc-700 italic">"{r.coachFeedback}"</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
