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

const LiabilitiesReport = () => {
  const [unpaidMembers, setUnpaidMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());

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
      <BentoCard className="p-6 bg-white border-none shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Година
              </Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="rounded-xl border-slate-100 bg-slate-50/50">
                  <SelectValue placeholder="Избери година" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100">
                  {years.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Месец
              </Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="rounded-xl border-slate-100 bg-slate-50/50">
                  <SelectValue placeholder="Избери месец" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100">
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <Button
              onClick={handleGenerateReport}
              disabled={isLoading}
              className="flex-1 md:flex-none rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-black text-xs uppercase tracking-widest h-11 px-6 shadow-lg shadow-slate-200"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Filter className="mr-2 h-4 w-4" />
              )}
              Генерирай
            </Button>
            {unpaidMembers.length > 0 && (
              <Button
                onClick={handleExport}
                variant="outline"
                className="rounded-xl border-slate-200 hover:bg-slate-50 font-black text-xs uppercase tracking-widest h-11"
              >
                <Download className="mr-2 h-4 w-4" /> Експорт
              </Button>
            )}
          </div>
        </div>
      </BentoCard>

      {/* Summary Stat Card */}
      {hasSearched && !isLoading && unpaidMembers.length > 0 && (
        <BentoCard className="p-6 bg-rose-50 border-rose-100/50">
          <div className="flex items-center gap-3 mb-2 text-rose-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Общо неплатили за периода
            </span>
          </div>
          <p className="text-3xl font-black text-rose-900">
            {unpaidMembers.length} души
          </p>
        </BentoCard>
      )}

      {/* Results Table Card */}
      <BentoCard className="p-0 overflow-hidden bg-white border-none shadow-sm">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <h3 className="font-black text-sm uppercase tracking-widest text-slate-900 flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" />
            Списък на длъжници
          </h3>
          {hasSearched && (
            <Badge
              variant={unpaidMembers.length > 0 ? "destructive" : "outline"}
              className="rounded-lg font-bold"
            >
              {unpaidMembers.length} задължения
            </Badge>
          )}
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">
              Проверка на плащания...
            </p>
          </div>
        ) : !hasSearched ? (
          <div className="p-12 text-center">
            <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Filter className="h-6 w-6 text-slate-300" />
            </div>
            <p className="text-sm font-bold text-slate-400 italic">
              Изберете период, за да видите кой не е платил абонамента си.
            </p>
          </div>
        ) : unpaidMembers.length === 0 ? (
          <div className="p-12 text-center text-emerald-600">
            <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="h-6 w-6" />
            </div>
            <p className="text-sm font-black uppercase tracking-widest">
              Браво! Всички са платили.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-slate-50 hover:bg-transparent">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest h-10">
                    Член
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest h-10">
                    Контакти
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest h-10 text-right">
                    Действие
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unpaidMembers.map((member) => (
                  <TableRow
                    key={member.id}
                    className="border-slate-50 hover:bg-rose-50/20 transition-colors"
                  >
                    <TableCell className="py-4">
                      <p className="font-black text-sm text-slate-900">{`${member.firstName} ${member.lastName}`}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Неплатен абонамент
                      </p>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-slate-600 flex items-center gap-1">
                          <Mail className="h-3 w-3 text-slate-300" />{" "}
                          {member.email || "—"}
                        </span>
                        <span className="text-xs font-medium text-slate-400">
                          {member.phone || "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-black text-[10px] uppercase tracking-tighter"
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
