"use client";

import { format } from "date-fns";
import { bg } from "date-fns/locale";
import {
  ClipboardList,
  Link2,
  Loader2,
  Printer,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useDeepLinkHighlight } from "@/hooks/useDeepLinkHighlight";
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

interface AssessmentsClientProps {
  initialTab?: "bwf" | "history";
}

export default function AssessmentsClient({
  initialTab = "bwf",
}: AssessmentsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");
  const testParam = searchParams.get("test") || idParam;
  const assessmentParam = searchParams.get("assessment") || idParam;
  const dateParam = searchParams.get("date");

  const { activeBranch } = useAppStore();
  const [selectedTest, setSelectedTest] = useState<BadmintonTest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [printFilter, setPrintFilter] = useState<string | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [activeTab, setActiveTab] = useState<"bwf" | "history">(initialTab);
  const [members, setMembers] = useState<Member[]>([]);
  const [history, setHistory] = useState<MemberAssessment[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  useDeepLinkHighlight(
    activeTab === "bwf" ? "test" : "assessment",
    activeTab === "bwf" || (!isHistoryLoading && history.length > 0),
    activeTab === "bwf" ? "test" : "assessment"
  );

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (activeTab === "bwf" && testParam) {
      const match = BADMINTON_TESTS.find((t) => t.id === testParam);
      if (match) {
        setTimeout(() => {
          const el = document.getElementById(`test-${match.id}`);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 150);
      }
    } else if (activeTab === "history" && !isHistoryLoading) {
      if (assessmentParam) {
        setTimeout(() => {
          const el = document.getElementById(`assessment-${assessmentParam}`);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 150);
      } else if (dateParam) {
        setTimeout(() => {
          const el = document.getElementById(`date-${dateParam}`);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
      }
    }
  }, [activeTab, testParam, assessmentParam, dateParam, isHistoryLoading]);

  useEffect(() => {
    getAllMembers().then(setMembers).catch(console.error);
  }, []);

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBranch]);

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
    const q = searchQuery.trim().toLowerCase();
    const filtered = !q
      ? history
      : history.filter((curr) => {
          const member = members.find((m) => m.id === curr.memberId);
          const memberName = member
            ? `${member.firstName} ${member.lastName}`.toLowerCase()
            : "";
          return (
            memberName.includes(q) ||
            (curr.testName || "").toLowerCase().includes(q) ||
            (curr.notes || "").toLowerCase().includes(q)
          );
        });

    return filtered.reduce(
      (acc, curr) => {
        const dateStr = curr.date.split("T")[0];
        if (!acc[dateStr]) acc[dateStr] = [];
        acc[dateStr].push(curr);
        return acc;
      },
      {} as Record<string, MemberAssessment[]>
    );
  }, [history, searchQuery, members]);

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

      <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            const next = v as "bwf" | "history";
            setActiveTab(next);
            router.push(
              next === "bwf"
                ? "/training/assessments"
                : "/training/assessments/history"
            );
          }}
        >
          <div className="no-print mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Card className="rounded-2xl border-zinc-200/80 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
              <CardContent className="p-4">
                <p className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                  Общо BWF тестове
                </p>
                <p className="mt-1 text-2xl font-black text-zinc-900 dark:text-white">
                  {BADMINTON_TESTS.length}
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-zinc-200/80 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
              <CardContent className="p-4">
                <p className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                  Възрастови групи
                </p>
                <p className="mt-1 text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  {ageGroups.length}
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-zinc-200/80 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
              <CardContent className="p-4">
                <p className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                  Проведени оценявания
                </p>
                <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {history.length}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="no-print mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === "bwf"
                    ? "Търси тест по име, фокус или възраст..."
                    : "Търси по състезател или име на тест..."
                }
                className="rounded-xl border-zinc-200 bg-white pl-9 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
            {activeTab === "bwf" && (
              <Button
                onClick={() => handlePrint("all")}
                variant="outline"
                className="h-9 w-full sm:w-auto rounded-xl border-zinc-200 text-xs font-semibold text-zinc-700 dark:border-zinc-800 dark:text-zinc-300"
              >
                <Printer className="mr-1.5 size-3.5" />
                Принтирай ВСИЧКИ
              </Button>
            )}
          </div>

          <TabsContent value="bwf" className="duration-300 animate-in fade-in">
            <div className="printable-area space-y-12 bg-white p-2 dark:bg-transparent">
              <div className="mb-8 hidden text-center print:block">
                <h1 className="text-2xl font-bold uppercase">
                  Бланка за Оценяване - BWF Тестове
                </h1>
                <p>Дата: ______________ Треньор: _________________________</p>
              </div>

              {ageGroups.map((group) => {
                const q = searchQuery.trim().toLowerCase();
                const groupTests = BADMINTON_TESTS.filter(
                  (t: BadmintonTest) =>
                    t.ageGroup === group &&
                    (!q ||
                      t.name.toLowerCase().includes(q) ||
                      t.description.toLowerCase().includes(q) ||
                      t.focus.toLowerCase().includes(q) ||
                      t.ageGroup.toLowerCase().includes(q))
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
                      <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800"></div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      {groupTests.map((test: BadmintonTest) => {
                        const isHighlighted = testParam === test.id;
                        return (
                          <div
                            key={test.id}
                            id={`test-${test.id}`}
                            className={cn(
                              "flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900",
                              isHighlighted && "ring-2 ring-indigo-500",
                              printFilter !== "all" &&
                                printFilter !== test.id &&
                                "print:hidden"
                            )}
                          >
                            <div>
                              <div className="mb-2 flex items-start justify-between">
                                <h3 className="text-lg leading-tight font-bold dark:text-zinc-100">
                                  {test.name}
                                </h3>
                                <div className="flex items-center gap-1.5">
                                  <span className="rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-bold tracking-widest text-zinc-400 uppercase dark:bg-zinc-800">
                                    {test.source}
                                  </span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="no-print size-7 rounded-lg text-zinc-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-400"
                                    onClick={() => {
                                      const url = `${window.location.origin}${window.location.pathname}?id=${test.id}`;
                                      void navigator.clipboard.writeText(url);
                                      toast.success("Линкът е копиран!");
                                    }}
                                    title="Копирай директен линк"
                                    aria-label="Копирай директен линк"
                                  >
                                    <Link2 className="size-3.5" />
                                  </Button>
                                </div>
                              </div>
                              <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                                {test.description}
                              </p>

                              <div className="space-y-2 rounded-lg border border-zinc-100 bg-zinc-50 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950/50">
                                <p>
                                  <strong className="text-zinc-800 dark:text-zinc-200">
                                    Оборудване:
                                  </strong>{" "}
                                  <span className="text-zinc-600 dark:text-zinc-400">
                                    {test.equipment}
                                  </span>
                                </p>
                                <p>
                                  <strong className="text-zinc-800 dark:text-zinc-200">
                                    Оценяване:
                                  </strong>{" "}
                                  <span className="text-zinc-600 dark:text-zinc-400">
                                    {test.scoring}
                                  </span>
                                </p>
                                <p>
                                  <strong className="text-zinc-800 dark:text-zinc-200">
                                    Фокус:
                                  </strong>{" "}
                                  <span className="text-zinc-600 dark:text-zinc-400">
                                    {test.focus}
                                  </span>
                                </p>
                              </div>
                            </div>

                            <div className="no-print mt-4 flex justify-end gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                              <Button
                                onClick={() => handlePrint(test.id)}
                                variant="ghost"
                                className="w-full text-zinc-500 hover:text-zinc-800 sm:w-auto dark:text-zinc-400 dark:hover:text-zinc-100"
                              >
                                <Printer className="mr-2 size-4" />
                                Принтирай
                              </Button>
                              <Button
                                onClick={() => handleConductTest(test)}
                                className="w-full bg-indigo-50 font-bold text-indigo-700 hover:bg-indigo-100 sm:w-auto dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/60"
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
                        );
                      })}
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
              <div className="rounded-2xl border border-zinc-200 bg-white py-12 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <p className="font-medium text-zinc-500 dark:text-zinc-400">
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
                    id={`date-${dateStr}`}
                    className="overflow-hidden border-zinc-200 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        {format(dateObj, "dd MMMM yyyy", { locale: bg })}
                      </h3>
                      <div className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-bold text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                        {results.length} теста
                      </div>
                    </div>
                    <CardContent className="p-0">
                      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
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

                          const isHighlighted = assessmentParam === r.id;

                          return (
                            <div
                              key={r.id}
                              id={`assessment-${r.id}`}
                              className={cn(
                                "group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 transition-colors hover:bg-zinc-50 sm:px-6 dark:hover:bg-zinc-800/50",
                                isHighlighted &&
                                  "bg-indigo-50/50 ring-2 ring-indigo-500 ring-inset dark:bg-indigo-950/30"
                              )}
                            >
                              <Link
                                href={`/members/${r.memberId}/assessments`}
                                className="flex flex-1 items-center justify-between pr-4"
                              >
                                <div>
                                  <div className="font-bold text-zinc-900 transition-colors group-hover:text-indigo-600 dark:text-zinc-100 dark:group-hover:text-indigo-400">
                                    {memberName}
                                  </div>
                                  <div className="mt-0.5 flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                    <span>{r.testName}</span>
                                    {r.notes && (
                                      <>
                                        <span className="text-zinc-300 dark:text-zinc-700">
                                          •
                                        </span>
                                        <span className="text-zinc-400 italic">
                                          {r.notes}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                  {(analysis || recommendation) && (
                                    <div className="mt-2 w-full max-w-xl space-y-1 rounded-lg border border-indigo-100/50 bg-indigo-50/30 p-2 text-xs dark:border-indigo-900/40 dark:bg-indigo-950/30">
                                      {analysis && (
                                        <div className="line-clamp-2 font-medium text-indigo-700 dark:text-indigo-300">
                                          <strong className="mb-0.5 block text-[10px] tracking-wide text-indigo-800 uppercase dark:text-indigo-200">
                                            Анализ
                                          </strong>
                                          {analysis}
                                        </div>
                                      )}
                                      {recommendation && (
                                        <div className="line-clamp-2 font-medium text-emerald-700 dark:text-emerald-300">
                                          <strong className="mb-0.5 block text-[10px] tracking-wide text-emerald-800 uppercase dark:text-emerald-200">
                                            Препоръка
                                          </strong>
                                          {recommendation}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="flex shrink-0 flex-col items-end gap-1">
                                  <span className="rounded border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-sm font-black text-indigo-600 dark:border-indigo-900/50 dark:bg-indigo-950/50 dark:text-indigo-300">
                                    {r.scoreDisplay}
                                  </span>
                                  <span className="text-[10px] font-medium text-zinc-400 transition-colors group-hover:text-indigo-500">
                                    Към досие &rarr;
                                  </span>
                                </div>
                              </Link>

                              <div className="flex items-center gap-1 border-l border-zinc-100 pl-2 dark:border-zinc-800">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    const url = `${window.location.origin}${window.location.pathname}?id=${r.id}`;
                                    void navigator.clipboard.writeText(url);
                                    toast.success("Линкът е копиран!");
                                  }}
                                  className="text-zinc-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-400"
                                  title="Копирай директен линк"
                                  aria-label="Копирай директен линк"
                                >
                                  <Link2 className="size-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleDeleteResult(r.id);
                                  }}
                                  className="text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40"
                                  title="Изтрий резултата"
                                  aria-label="Изтрий резултата"
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
