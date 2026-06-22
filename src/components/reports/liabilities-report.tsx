/* eslint-disable sonarjs/no-nested-conditional */
 
 
"use client";

import { useState } from "react";
import { Member } from "@/types";
import { generateLiabilityReport } from "@/services/report-service";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BentoCard } from "@/components/ui/bento-card";
import {
  Loader2,
  Download,
  Filter,
  AlertCircle,
  Users,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { exportToCSV } from "@/lib/export-utils";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

interface LiabilitiesReportProps {
  initialUnpaidMembers: Member[];
  initialYear: number;
  initialMonth: number;
}

// Генерираме последните 5 години за падащото меню
const years = Array.from({ length: 5 }, (_, i) =>
  (new Date().getFullYear() - i).toString()
);
const months = [
  { value: "1", label: "Януари" },
  { value: "2", label: "Февруари" },
  { value: "3", label: "Март" },
  { value: "4", label: "Април" },
  { value: "5", label: "Май" },
  { value: "6", label: "Юни" },
  { value: "7", label: "Юли" },
  { value: "8", label: "Август" },
  { value: "9", label: "Септември" },
  { value: "10", label: "Октомври" },
  { value: "11", label: "Ноември" },
  { value: "12", label: "Декември" },
];

const LiabilitiesReport = ({
  initialUnpaidMembers,
  initialYear,
  initialMonth,
}: LiabilitiesReportProps) => {
  const [unpaidMembers, setUnpaidMembers] = useState<Member[]>(
    initialUnpaidMembers
  );
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(true);

  const [year, setYear] = useState(initialYear.toString());
  const [month, setMonth] = useState(initialMonth.toString());

  const handleGenerateReport = async () => {
    setIsLoading(true);
    setHasSearched(true);
    try {
      const reportData = await generateLiabilityReport(
        parseInt(year, 10),
        parseInt(month, 10)
      );
      setUnpaidMembers(reportData);
    } catch (error) {
      console.error("Failed to generate liability report:", error);
      setUnpaidMembers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    const dataToExport = unpaidMembers.map((member) => ({
      Име: member.firstName,
      Фамилия: member.lastName,
      Имейл: member.email || "Н/А",
      Телефон: member.phone || "Н/А",
    }));
    exportToCSV(dataToExport, `liability-report-${month}-${year}`);
  };

  return (
    <div className="space-y-6">
      {/* Filters Card */}
      <BentoCard className="p-8 bg-white border border-zinc-100 shadow-none rounded-4xl">
        <div className="flex flex-col md:flex-row gap-6 items-end">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1">
            <div className="space-y-3">
              <Label className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-400 ml-1">
                Година
              </Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="h-12 rounded-xl border-zinc-100 bg-zinc-50/50 shadow-none focus:ring-zinc-200">
                  <SelectValue placeholder="Избери година" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-zinc-100 shadow-2xl">
                  {years.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-400 ml-1">
                Месец
              </Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="h-12 rounded-xl border-zinc-100 bg-zinc-50/50 shadow-none focus:ring-zinc-200">
                  <SelectValue placeholder="Избери месец" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-zinc-100 shadow-2xl">
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <Button
              onClick={handleGenerateReport}
              disabled={isLoading}
              className="flex-1 md:flex-none rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 font-medium text-[11px] uppercase tracking-widest h-12 px-8 shadow-none transition-all"
            >
              {isLoading ? (
                <Loader2 className="mr-3 h-4 w-4 animate-spin" />
              ) : (
                <Filter className="mr-3 h-4 w-4" strokeWidth={1.5} />
              )}
              Генерирай
            </Button>
            {unpaidMembers.length > 0 && (
              <Button
                onClick={handleExport}
                variant="outline"
                className="rounded-xl border-zinc-100 hover:bg-zinc-50 font-medium text-[11px] uppercase tracking-widest h-12 px-8 transition-all"
              >
                <Download className="mr-3 h-4 w-4" strokeWidth={1.5} /> Експорт
              </Button>
            )}
          </div>
        </div>
      </BentoCard>

      {/* Summary Stat Card */}
      {hasSearched && !isLoading && unpaidMembers.length > 0 && (
        <BentoCard className="p-8 bg-white border border-rose-100 rounded-4xl shadow-none">
          <div className="flex items-center gap-4 mb-3 text-rose-500">
            <AlertCircle className="h-5 w-5" strokeWidth={1.5} />
            <span className="text-[11px] font-medium uppercase tracking-[0.2em]">
              Общо неплатили за периода
            </span>
          </div>
          <p className="text-4xl font-light tracking-tighter text-rose-600">
            {unpaidMembers.length} <span className="text-xl">души</span>
          </p>
        </BentoCard>
      )}

      {/* Results Table Card */}
      <BentoCard className="p-0 overflow-hidden bg-white border border-zinc-100 shadow-none rounded-5xl">
        <div className="p-8 border-b border-zinc-50 flex items-center justify-between">
          <h3 className="font-medium text-[11px] uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-3">
            <Users className="h-4 w-4 text-primary" strokeWidth={1.5} />
            Списък на длъжници
          </h3>
          {hasSearched && (
            <Badge
              variant={unpaidMembers.length > 0 ? "destructive" : "outline"}
              className="rounded-full px-4 py-1 text-[10px] font-medium uppercase tracking-widest border-none"
            >
              {unpaidMembers.length} задължения
            </Badge>
          )}
        </div>

        {isLoading ? (
          <div className="p-32 text-center">
            <Loader2
              className="h-10 w-10 animate-spin mx-auto text-zinc-200 mb-6"
              strokeWidth={1}
            />
            <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-zinc-400">
              Проверка на плащания...
            </p>
          </div>
        ) : unpaidMembers.length === 0 ? (
          <div className="p-32 text-center text-emerald-600">
            <div className="h-16 w-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Users className="h-8 w-8" strokeWidth={1} />
            </div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em]">
              Браво! Всички са платили.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-zinc-50/50">
                <TableRow className="border-none hover:bg-transparent h-16">
                  <TableHead className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 px-8">
                    Член
                  </TableHead>
                  <TableHead className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400">
                    Контакти
                  </TableHead>
                  <TableHead className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 text-right pr-8">
                    Действие
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unpaidMembers.map((member) => (
                  <TableRow
                    key={member.id}
                    className="border-zinc-50 hover:bg-zinc-50/50 transition-colors h-24"
                  >
                    <TableCell className="px-8">
                      <p className="font-medium text-sm text-zinc-900">{`${member.firstName} ${member.lastName}`}</p>
                      <p className="text-[10px] font-light text-rose-500 uppercase tracking-widest mt-1">
                        Неплатен абонамент
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-sm font-light text-zinc-600 flex items-center gap-2">
                          <Mail
                            className="h-3.5 w-3.5 text-zinc-300"
                            strokeWidth={1.5}
                          />{" "}
                          {member.email || "—"}
                        </span>
                        <span className="text-xs font-light text-zinc-400">
                          {member.phone || "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl text-zinc-600 hover:text-rose-500 hover:bg-rose-50 font-medium text-[10px] uppercase tracking-widest px-6 h-10 transition-all"
                      >
                        Напомняне
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </BentoCard>
    </div>
  );
};

export default LiabilitiesReport;
