/* eslint-disable sonarjs/no-nested-conditional */

"use client";

import {
  AlertCircle,
  Download,
  Filter,
  Loader2,
  Mail,
  Users,
} from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { exportToCSV } from "@/lib/export-utils";
import { generateLiabilityReport } from "@/services/report-service";
import { Member } from "@/types";

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
  const [unpaidMembers, setUnpaidMembers] =
    useState<Member[]>(initialUnpaidMembers);
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
      <BentoCard className="rounded-4xl border border-zinc-100 bg-white p-8 shadow-none">
        <div className="flex flex-col items-end gap-6 md:flex-row">
          <div className="grid flex-1 grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-3">
              <Label className="ml-1 text-[11px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
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
              <Label className="ml-1 text-[11px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
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

          <div className="flex w-full gap-3 md:w-auto">
            <Button
              onClick={handleGenerateReport}
              disabled={isLoading}
              className="h-12 flex-1 rounded-xl bg-zinc-950 px-8 text-[11px] font-medium tracking-widest text-white uppercase shadow-none transition-all hover:bg-zinc-800 md:flex-none"
            >
              {isLoading ? (
                <Loader2 className="mr-3 size-4 animate-spin" />
              ) : (
                <Filter className="mr-3 size-4" strokeWidth={1.5} />
              )}
              Генерирай
            </Button>
            {unpaidMembers.length > 0 && (
              <Button
                onClick={handleExport}
                variant="outline"
                className="h-12 rounded-xl border-zinc-100 px-8 text-[11px] font-medium tracking-widest uppercase transition-all hover:bg-zinc-50"
              >
                <Download className="mr-3 size-4" strokeWidth={1.5} /> Експорт
              </Button>
            )}
          </div>
        </div>
      </BentoCard>

      {/* Summary Stat Card */}
      {hasSearched && !isLoading && unpaidMembers.length > 0 && (
        <BentoCard className="rounded-4xl border border-rose-100 bg-white p-8 shadow-none">
          <div className="mb-3 flex items-center gap-4 text-rose-500">
            <AlertCircle className="size-5" strokeWidth={1.5} />
            <span className="text-[11px] font-medium tracking-[0.2em] uppercase">
              Общо неплатили за периода
            </span>
          </div>
          <p className="text-4xl font-light tracking-tighter text-rose-600">
            {unpaidMembers.length} <span className="text-xl">души</span>
          </p>
        </BentoCard>
      )}

      {/* Results Table Card */}
      <BentoCard className="overflow-hidden rounded-5xl border border-zinc-100 bg-white p-0 shadow-none">
        <div className="flex items-center justify-between border-b border-zinc-50 p-8">
          <h3 className="flex items-center gap-3 text-[11px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
            <Users className="size-4 text-primary" strokeWidth={1.5} />
            Списък на длъжници
          </h3>
          {hasSearched && (
            <Badge
              variant={unpaidMembers.length > 0 ? "destructive" : "outline"}
              className="rounded-full border-none px-4 py-1 text-[10px] font-medium tracking-widest uppercase"
            >
              {unpaidMembers.length} задължения
            </Badge>
          )}
        </div>

        {isLoading ? (
          <div className="p-32 text-center">
            <Loader2
              className="mx-auto mb-6 size-10 animate-spin text-zinc-200"
              strokeWidth={1}
            />
            <p className="text-[11px] font-medium tracking-[0.3em] text-zinc-400 uppercase">
              Проверка на плащания...
            </p>
          </div>
        ) : unpaidMembers.length === 0 ? (
          <div className="p-32 text-center text-emerald-600">
            <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-emerald-50">
              <Users className="size-8" strokeWidth={1} />
            </div>
            <p className="text-[11px] font-medium tracking-[0.2em] uppercase">
              Браво! Всички са платили.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader className="bg-zinc-50/50">
                  <TableRow className="h-16 border-none hover:bg-transparent">
                    <TableHead className="px-8 text-[10px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
                      Член
                    </TableHead>
                    <TableHead className="text-[10px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
                      Контакти
                    </TableHead>
                    <TableHead className="pr-8 text-right text-[10px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
                      Действие
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unpaidMembers.map((member) => (
                    <TableRow
                      key={member.id}
                      className="h-24 border-zinc-50 transition-colors hover:bg-zinc-50/50"
                    >
                      <TableCell className="px-8">
                        <p className="text-sm font-medium text-zinc-900">{`${member.firstName} ${member.lastName}`}</p>
                        <p className="mt-1 text-[10px] font-light tracking-widest text-rose-500 uppercase">
                          Неплатен абонамент
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1.5">
                          <span className="flex items-center gap-2 text-sm font-light text-zinc-600">
                            <Mail
                              className="size-3.5 text-zinc-300"
                              strokeWidth={1.5}
                            />{" "}
                            {member.email || "—"}
                          </span>
                          <span className="text-xs font-light text-zinc-400">
                            {member.phone || "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="pr-8 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-10 rounded-xl px-6 text-[10px] font-medium tracking-widest text-zinc-600 uppercase transition-all hover:bg-rose-50 hover:text-rose-500"
                        >
                          Напомняне
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex flex-col divide-y divide-zinc-50 md:hidden">
              {unpaidMembers.map((member) => (
                <div key={member.id} className="flex flex-col gap-4 p-6">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{`${member.firstName} ${member.lastName}`}</p>
                    <p className="mt-1 text-[10px] font-medium tracking-widest text-rose-500 uppercase">
                      Неплатен абонамент
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5 rounded-xl bg-zinc-50 p-3">
                    <span className="flex items-center gap-2 text-xs font-medium text-zinc-600">
                      <Mail className="size-3.5 text-zinc-400" />
                      {member.email || "—"}
                    </span>
                    <span className="flex items-center gap-2 text-xs font-medium text-zinc-600">
                      {member.phone || "—"}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 w-full border-rose-200 bg-rose-50 text-[10px] tracking-widest text-rose-500 uppercase hover:bg-rose-100"
                  >
                    Напомняне
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}
      </BentoCard>
    </div>
  );
};

export default LiabilitiesReport;
