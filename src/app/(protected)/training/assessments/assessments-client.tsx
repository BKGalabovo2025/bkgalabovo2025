"use client";

import { useState, useEffect, useMemo } from "react";
import { BADMINTON_TESTS } from "@/lib/badminton-tests";
import {
  AssessmentAgeGroup,
  BadmintonTest,
  MemberAssessment,
} from "@/types/assessment.types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Printer, ClipboardList, Target, Loader2, Trash2 } from "lucide-react";
import ConductTestDialog from "./conduct-test-dialog";
import { useAppStore } from "@/store/use-app-store";
import { Member } from "@/types/member.types";
import { getAllMembers } from "@/services/member-service";
import {
  getAllAssessments,
  deleteAssessment,
} from "@/services/assessment-service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { format } from "date-fns";
import { bg } from "date-fns/locale";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";

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

      <div className="max-w-7xl mx-auto p-4 sm:p-8">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "bwf" | "history")}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 no-print">
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-950 flex items-center gap-2">
                <Target className="w-6 h-6 text-indigo-600" />
                Бадминтон Оценяване (BWF)
              </h1>
              <p className="text-zinc-500 font-medium mt-1">
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
                  className="rounded-xl border-zinc-200 font-bold text-zinc-700 h-10"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Принтирай ВСИЧКИ
                </Button>
              )}
            </div>
          </div>

          <TabsContent value="bwf" className="animate-in fade-in duration-300">
            <div className="space-y-12 printable-area bg-white p-2">
              <div className="hidden print:block mb-8 text-center">
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
                    <div className="flex items-center gap-3 mb-4">
                      <span className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-lg font-black tracking-widest uppercase">
                        {group}
                      </span>
                      <div className="h-px bg-zinc-200 flex-1"></div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {groupTests.map((test: BadmintonTest) => (
                        <div
                          key={test.id}
                          className={cn(
                            "border border-zinc-200 rounded-xl p-5 bg-white shadow-sm flex flex-col justify-between",
                            printFilter !== "all" &&
                              printFilter !== test.id &&
                              "print:hidden"
                          )}
                        >
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-bold text-lg leading-tight">
                                {test.name}
                              </h3>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded">
                                {test.source}
                              </span>
                            </div>
                            <p className="text-sm text-zinc-600 mb-4">
                              {test.description}
                            </p>

                            <div className="space-y-2 text-sm bg-zinc-50 p-3 rounded-lg border border-zinc-100">
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

                          <div className="mt-4 pt-4 border-t border-zinc-100 flex justify-end gap-2 no-print">
                            <Button
                              onClick={() => handlePrint(test.id)}
                              variant="ghost"
                              className="w-full sm:w-auto text-zinc-500 hover:text-zinc-800"
                            >
                              <Printer className="w-4 h-4 mr-2" />
                              Принтирай
                            </Button>
                            <Button
                              onClick={() => handleConductTest(test)}
                              className="w-full sm:w-auto bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold"
                            >
                              <ClipboardList className="w-4 h-4 mr-2" />
                              Проведи тест
                            </Button>
                          </div>

                          {/* Print-only empty table rows for writing results */}
                          <div className="hidden print:block mt-4 border-t border-zinc-200 pt-2">
                            <table className="w-full text-xs text-left border-collapse border border-zinc-300">
                              <thead>
                                <tr className="bg-zinc-100">
                                  <th className="border border-zinc-300 p-1 w-1/2">
                                    Име на състезател
                                  </th>
                                  <th className="border border-zinc-300 p-1 w-1/4">
                                    Резултат
                                  </th>
                                  <th className="border border-zinc-300 p-1 w-1/4">
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
            className="animate-in fade-in duration-300 space-y-6"
          >
            {isHistoryLoading && (
              <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            )}

            {!isHistoryLoading && Object.keys(groupedHistory).length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-zinc-200 shadow-sm">
                <p className="text-zinc-500 font-medium">
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
                    className="border-zinc-200 overflow-hidden shadow-sm"
                  >
                    <div className="bg-zinc-50 px-6 py-4 border-b border-zinc-100 flex justify-between items-center">
                      <h3 className="font-bold text-lg text-zinc-900">
                        {format(dateObj, "dd MMMM yyyy", { locale: bg })}
                      </h3>
                      <div className="bg-indigo-100 text-indigo-800 text-sm font-bold px-3 py-1 rounded-full">
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
                          return (
                            <div
                              key={r.id}
                              className="flex justify-between items-center p-4 sm:px-6 hover:bg-zinc-50 transition-colors group"
                            >
                              <Link
                                href={`/members/${r.memberId}?tab=assessments`}
                                className="flex-1 flex justify-between items-center pr-4"
                              >
                                <div>
                                  <div className="font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors">
                                    {memberName}
                                  </div>
                                  <div className="text-xs text-zinc-500 mt-0.5 font-medium flex items-center gap-2">
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
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                    {r.scoreDisplay}
                                  </span>
                                  <span className="text-[10px] text-zinc-400 font-medium group-hover:text-indigo-500 transition-colors">
                                    Към досие &rarr;
                                  </span>
                                </div>
                              </Link>

                              <div className="pl-2 border-l border-zinc-100">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleDeleteResult(r.id);
                                  }}
                                  className="text-zinc-400 hover:text-red-500 hover:bg-red-50"
                                  title="Изтрий резултата"
                                >
                                  <Trash2 className="w-4 h-4" />
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
