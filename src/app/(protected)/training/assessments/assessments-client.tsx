"use client";

import { format } from "date-fns";
import { bg } from "date-fns/locale";
import { ClipboardList, Loader2, Printer, Target, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateAssessmentAnalysis } from "@/lib/assessment-analysis";
import { BADMINTON_TESTS } from "@/lib/badminton-tests";
import { cn } from "@/lib/utils";
import {
  deleteAssessment,
  getAllAssessments,
} from "@/services/assessment-service";
import { getAllMembers } from "@/services/member-service";
import { useAppStore } from "@/store/use-app-store";
import {
  AssessmentAgeGroup,
  BadmintonTest,
  MemberAssessment,
} from "@/types/assessment.types";
import { Member } from "@/types/member.types";

import ConductTestDialog from "./conduct-test-dialog";

const ageGroups: AssessmentAgeGroup[] = [
  "U9",
  "U11",
  "U13",
  "U15",
  "U17",
  "U19",
  "Мъже и Жени",
];

export default function AssessmentsClient() {
  const { activeBranch } = useAppStore();
  const [selectedTest, setSelectedTest] = useState<BadmintonTest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [printFilter, setPrintFilter] = useState<string | "all">("all");

  const [activeTab, setActiveTab] = useState<"bwf" | "history">("bwf");
  const [members, setMembers] = useState<Member[]>([]);
  const [history, setHistory] = useState<MemberAssessment[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  useEffect(() => {
    getAllMembers().then(setMembers).catch(console.error);
  }, []);

  useEffect(() => {
    if (activeTab === "history") {
      loadHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, activeBranch]);

  const loadHistory = async () => {
    setIsHistoryLoading(true);
    try {
      const results = await getAllAssessments(activeBranch);
      setHistory(results);
    } catch (error) {
      console.error(error);
      toast.error("Грешка при зареждане на историята");
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleDeleteResult = async (resultId: string) => {
    if (
      !confirm(
        "Сигурни ли сте, че искате да изтриете този резултат? Той ще бъде премахнат и от досието на състезателя."
      )
    ) {
      return;
    }

    try {
      await deleteAssessment(resultId);
      setHistory((prev) => prev.filter((r) => r.id !== resultId));
      toast.success("Резултатът е изтрит успешно.");
    } catch (error) {
      console.error(error);
      toast.error("Възникна грешка при изтриването.");
    }
  };

  const groupedHistory = useMemo(() => {
    return history.reduce(
      (acc, curr) => {
        const dateStr = curr.date.split("T")[0];
        if (!acc[dateStr]) acc[dateStr] = [];
        acc[dateStr].push(curr);
        return acc;
      },
      {} as Record<string, MemberAssessment[]>
    );
  }, [history]);

  useEffect(() => {
    const handleAfterPrint = () => {
      setPrintFilter("all");
    };
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  const handleConductTest = (test: BadmintonTest) => {
    setSelectedTest(test);
    setIsDialogOpen(true);
  };

  const handlePrint = (filter: string | "all") => {
    setPrintFilter(filter);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-area, .printable-area * {
            visibility: visible;
          }
          .printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `,
        }}
      />

      <div className="mx-auto max-w-7xl p-4 sm:p-8">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "bwf" | "history")}
        >
          <div className="no-print mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-zinc-950 uppercase">
                <Target className="size-6 text-indigo-600" />
                Бадминтон Оценяване (BWF)
              </h1>
              <p className="mt-1 font-medium text-zinc-500">
                Официална методика за тестване на физически и технически
                качества
              </p>
            </div>
            <div className="flex gap-4">
              <TabsList className="h-10">
                <TabsTrigger value="bwf" className="text-sm font-bold">
                  BWF Бланки
                </TabsTrigger>
                <TabsTrigger value="history" className="text-sm font-bold">
                  История
                </TabsTrigger>
              </TabsList>

              {activeTab === "bwf" && (
                <Button
                  onClick={() => handlePrint("all")}
                  variant="outline"
                  className="h-10 rounded-xl border-zinc-200 font-bold text-zinc-700"
                >
                  <Printer className="mr-2 size-4" />
                  Принтирай ВСИЧКИ
                </Button>
              )}
            </div>
          </div>

          <TabsContent value="bwf" className="duration-300 animate-in fade-in">
            <div className="printable-area space-y-12 bg-white p-2">
              <div className="mb-8 hidden text-center print:block">
                <h1 className="text-2xl font-bold uppercase">
                  Бланка за Оценяване - BWF Тестове
                </h1>
                <p>Дата: ______________ Треньор: _________________________</p>
              </div>

              {ageGroups.map((group) => {
                const groupTests = BADMINTON_TESTS.filter(
                  (t: BadmintonTest) => t.ageGroup === group
                );
                if (groupTests.length === 0) return null;

                let groupPrintClass = "print:hidden";
                if (printFilter === "all") {
                  groupPrintClass = "page-break-after-always";
                } else if (groupTests.some((t) => t.id === printFilter)) {
                  groupPrintClass = "";
                }

                return (
                  <div key={group} className={cn("mb-10", groupPrintClass)}>
                    <div className="mb-4 flex items-center gap-3">
                      <span className="rounded-lg bg-indigo-600 px-3 py-1 text-lg font-black tracking-widest text-white uppercase">
                        {group}
                      </span>
                      <div className="h-px flex-1 bg-zinc-200"></div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      {groupTests.map((test: BadmintonTest) => (
                        <div
                          key={test.id}
                          className={cn(
                            "flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-sm",
                            printFilter !== "all" &&
                              printFilter !== test.id &&
                              "print:hidden"
                          )}
                        >
                          <div>
                            <div className="mb-2 flex items-start justify-between">
                              <h3 className="text-lg leading-tight font-bold">
                                {test.name}
                              </h3>
                              <span className="rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                                {test.source}
                              </span>
                            </div>
                            <p className="mb-4 text-sm text-zinc-600">
                              {test.description}
                            </p>

                            <div className="space-y-2 rounded-lg border border-zinc-100 bg-zinc-50 p-3 text-sm">
                              <p>
                                <strong className="text-zinc-800">
                                  Оборудване:
                                </strong>{" "}
                                <span className="text-zinc-600">
                                  {test.equipment}
                                </span>
                              </p>
                              <p>
                                <strong className="text-zinc-800">
                                  Оценяване:
                                </strong>{" "}
                                <span className="text-zinc-600">
                                  {test.scoring}
                                </span>
                              </p>
                              <p>
                                <strong className="text-zinc-800">
                                  Фокус:
                                </strong>{" "}
                                <span className="text-zinc-600">
                                  {test.focus}
                                </span>
                              </p>
                            </div>
                          </div>

                          <div className="no-print mt-4 flex justify-end gap-2 border-t border-zinc-100 pt-4">
                            <Button
                              onClick={() => handlePrint(test.id)}
                              variant="ghost"
                              className="w-full text-zinc-500 hover:text-zinc-800 sm:w-auto"
                            >
                              <Printer className="mr-2 size-4" />
                              Принтирай
                            </Button>
                            <Button
                              onClick={() => handleConductTest(test)}
                              className="w-full bg-indigo-50 font-bold text-indigo-700 hover:bg-indigo-100 sm:w-auto"
                            >
                              <ClipboardList className="mr-2 size-4" />
                              Проведи тест
                            </Button>
                          </div>

                          {/* Print-only empty table rows for writing results */}
                          <div className="mt-4 hidden border-t border-zinc-200 pt-2 print:block">
                            <table className="w-full border-collapse border border-zinc-300 text-left text-xs">
                              <thead>
                                <tr className="bg-zinc-100">
                                  <th className="w-1/2 border border-zinc-300 p-1">
                                    Име на състезател
                                  </th>
                                  <th className="w-1/4 border border-zinc-300 p-1">
                                    Резултат
                                  </th>
                                  <th className="w-1/4 border border-zinc-300 p-1">
                                    Бележка
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {[1, 2, 3, 4, 5, 6].map((row) => (
                                  <tr key={row}>
                                    <td className="border border-zinc-300 p-3"></td>
                                    <td className="border border-zinc-300 p-3"></td>
                                    <td className="border border-zinc-300 p-3"></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent
            value="history"
            className="space-y-6 duration-300 animate-in fade-in"
          >
            {isHistoryLoading && (
              <div className="flex justify-center p-12">
                <Loader2 className="size-8 animate-spin text-indigo-600" />
              </div>
            )}

            {!isHistoryLoading && Object.keys(groupedHistory).length === 0 && (
              <div className="rounded-2xl border border-zinc-200 bg-white py-12 text-center shadow-sm">
                <p className="font-medium text-zinc-500">
                  Няма проведени тестове до момента.
                </p>
              </div>
            )}

            {!isHistoryLoading &&
              Object.keys(groupedHistory).length > 0 &&
              Object.entries(groupedHistory).map(([dateStr, results]) => {
                const dateObj = new Date(dateStr);
                return (
                  <Card
                    key={dateStr}
                    className="overflow-hidden border-zinc-200 shadow-sm"
                  >
                    <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50 px-6 py-4">
                      <h3 className="text-lg font-bold text-zinc-900">
                        {format(dateObj, "dd MMMM yyyy", { locale: bg })}
                      </h3>
                      <div className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-bold text-indigo-800">
                        {results.length} теста
                      </div>
                    </div>
                    <CardContent className="p-0">
                      <div className="divide-y divide-zinc-100">
                        {results.map((r) => {
                          const member = members.find(
                            (m) => m.id === r.memberId
                          );
                          const memberName = member
                            ? `${member.firstName} ${member.lastName}`
                            : "Неизвестен";

                          let analysis = r.coachAnalysis;
                          let recommendation = r.recommendedExercises;

                          if (!analysis && !recommendation) {
                            const testDef = BADMINTON_TESTS.find(
                              (t) => t.id === r.testId
                            );
                            if (testDef) {
                              const dynamicResult = generateAssessmentAnalysis(
                                r.testId,
                                r.score,
                                testDef.scoreType
                              );
                              analysis = dynamicResult.analysis;
                              recommendation = dynamicResult.recommendation;
                            }
                          }

                          return (
                            <div
                              key={r.id}
                              className="group flex items-center justify-between p-4 transition-colors hover:bg-zinc-50 sm:px-6"
                            >
                              <Link
                                href={`/members/${r.memberId}?tab=assessments`}
                                className="flex flex-1 items-center justify-between pr-4"
                              >
                                <div>
                                  <div className="font-bold text-zinc-900 transition-colors group-hover:text-indigo-600">
                                    {memberName}
                                  </div>
                                  <div className="mt-0.5 flex items-center gap-2 text-xs font-medium text-zinc-500">
                                    <span>{r.testName}</span>
                                    {r.notes && (
                                      <>
                                        <span className="text-zinc-300">•</span>
                                        <span className="text-zinc-400 italic">
                                          {r.notes}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                  {(analysis || recommendation) && (
                                    <div className="mt-2 w-full max-w-xl space-y-1 rounded-lg border border-indigo-100/50 bg-indigo-50/30 p-2 text-xs">
                                      {analysis && (
                                        <div className="line-clamp-2 font-medium text-indigo-700">
                                          <strong className="mb-0.5 block text-[10px] tracking-wide text-indigo-800 uppercase">
                                            Анализ
                                          </strong>
                                          {analysis}
                                        </div>
                                      )}
                                      {recommendation && (
                                        <div className="line-clamp-2 font-medium text-emerald-700">
                                          <strong className="mb-0.5 block text-[10px] tracking-wide text-emerald-800 uppercase">
                                            Препоръка
                                          </strong>
                                          {recommendation}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="flex shrink-0 flex-col items-end gap-1">
                                  <span className="rounded border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-sm font-black text-indigo-600">
                                    {r.scoreDisplay}
                                  </span>
                                  <span className="text-[10px] font-medium text-zinc-400 transition-colors group-hover:text-indigo-500">
                                    Към досие &rarr;
                                  </span>
                                </div>
                              </Link>

                              <div className="border-l border-zinc-100 pl-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleDeleteResult(r.id);
                                  }}
                                  className="text-zinc-400 hover:bg-red-50 hover:text-red-500"
                                  title="Изтрий резултата"
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </TabsContent>
        </Tabs>
      </div>

      <ConductTestDialog
        test={selectedTest}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </>
  );
}
