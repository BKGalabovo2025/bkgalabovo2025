"use client";

import { useState } from "react";
import { BADMINTON_TESTS } from "@/lib/badminton-tests";
import { AssessmentAgeGroup, BadmintonTest } from "@/types/assessment.types";
import { Button } from "@/components/ui/button";
import { Printer, ClipboardList, Target } from "lucide-react";
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
  const [selectedTest, setSelectedTest] = useState<BadmintonTest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleConductTest = (test: BadmintonTest) => {
    setSelectedTest(test);
    setIsDialogOpen(true);
  };

  const handlePrintBlank = () => {
    window.print();
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 no-print">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-950 flex items-center gap-2">
              <Target className="w-6 h-6 text-indigo-600" />
              Бадминтон Оценяване (BWF)
            </h1>
            <p className="text-zinc-500 font-medium mt-1">
              Официална методика за тестване на физически и технически качества
            </p>
          </div>
          <Button
            onClick={handlePrintBlank}
            variant="outline"
            className="rounded-xl border-zinc-200"
          >
            <Printer className="w-4 h-4 mr-2" />
            Принтирай бланки
          </Button>
        </div>

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

            return (
              <div key={group} className="mb-10 page-break-after-always">
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
                      className="border border-zinc-200 rounded-xl p-5 bg-white shadow-sm flex flex-col justify-between"
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
                            <strong className="text-zinc-800">Фокус:</strong>{" "}
                            <span className="text-zinc-600">{test.focus}</span>
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-zinc-100 flex justify-end no-print">
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
      </div>

      <ConductTestDialog
        test={selectedTest}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </>
  );
}
