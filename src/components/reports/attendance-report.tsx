// src/components/reports/attendance-report.tsx
"use client";

import { useState } from "react";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  generateAttendanceReport,
  AttendanceReportItem,
} from "@/services/report-service";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateInput } from "@/lib/date-utils";
import { exportToCSV } from "@/lib/export-utils";
import {
  Loader2,
  Download,
  Filter,
  Calendar,
  Users,
  Activity,
  Trophy,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const AttendanceReport = () => {
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [reportData, setReportData] = useState<AttendanceReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDateChange =
    (setter: (date: Date | undefined) => void) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const dateString = e.target.value;
      if (dateString) {
        const [year, month, day] = dateString.split("-").map(Number);
        setter(new Date(year, month - 1, day));
      } else {
        setter(undefined);
      }
    };

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      setError("Моля, изберете начална и крайна дата.");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const data = await generateAttendanceReport(startDate, endDate);
      setReportData(data);
    } catch (err) {
      setError("Възникна грешка при генериране на справката.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (reportData.length === 0) return;

    const csvData = reportData.map((item) => ({
      Име: `${item.member.firstName} ${item.member.lastName}`,
      Посещения: item.attendanceCount,
      Имейл: item.member.email || "N/A",
      Телефон: item.member.phone || "N/A",
    }));

    exportToCSV(csvData, `attendance-report-${formatDateInput(new Date())}`);
  };

  const totalAttendance = reportData.reduce(
    (sum, item) => sum + item.attendanceCount,
    0
  );
  const topAttendee =
    reportData.length > 0
      ? reportData.sort((a, b) => b.attendanceCount - a.attendanceCount)[0]
      : null;

  return (
    <div className="space-y-6">
      {/* Filters Card */}
      <BentoCard className="p-8 bg-white border border-zinc-100 shadow-none rounded-[2rem]">
        <div className="flex flex-col md:flex-row gap-6 items-end">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1">
            <div className="space-y-3">
              <Label className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-400 ml-1 flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" strokeWidth={1.5} /> Начална
                дата
              </Label>
              <Input
                type="date"
                value={startDate ? formatDateInput(startDate) : ""}
                onChange={handleDateChange(setStartDate)}
                className="h-12 rounded-xl border-zinc-100 bg-zinc-50/50 shadow-none focus:ring-zinc-200 font-light"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-400 ml-1 flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" strokeWidth={1.5} /> Крайна
                дата
              </Label>
              <Input
                type="date"
                value={endDate ? formatDateInput(endDate) : ""}
                onChange={handleDateChange(setEndDate)}
                className="h-12 rounded-xl border-zinc-100 bg-zinc-50/50 shadow-none focus:ring-zinc-200 font-light"
              />
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
            {reportData.length > 0 && (
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
        {error && (
          <p className="text-rose-500 text-[11px] font-medium uppercase tracking-widest mt-6 ml-1">
            {error}
          </p>
        )}
      </BentoCard>

      {/* Stats Cards */}
      {reportData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <BentoCard className="p-8 bg-white border border-zinc-100 rounded-[2rem] shadow-none">
            <div className="flex items-center gap-4 mb-3 text-zinc-400">
              <Activity className="h-5 w-5" strokeWidth={1.5} />
              <span className="text-[11px] font-medium uppercase tracking-[0.2em]">
                Общо посещения
              </span>
            </div>
            <p className="text-4xl font-light tracking-tighter text-zinc-900">
              {totalAttendance}
            </p>
          </BentoCard>

          <BentoCard className="p-8 bg-white border border-zinc-100 rounded-[2rem] shadow-none">
            <div className="flex items-center gap-4 mb-3 text-zinc-400">
              <Users className="h-5 w-5" strokeWidth={1.5} />
              <span className="text-[11px] font-medium uppercase tracking-[0.2em]">
                Активни членове
              </span>
            </div>
            <p className="text-4xl font-light tracking-tighter text-zinc-900">
              {reportData.length}
            </p>
          </BentoCard>

          <BentoCard className="p-8 bg-white border border-zinc-100 rounded-[2rem] shadow-none relative group">
            <Trophy
              className="absolute top-8 right-8 h-8 w-8 text-zinc-100 group-hover:text-amber-100 transition-colors"
              strokeWidth={1}
            />
            <div className="flex items-center gap-4 mb-3 text-zinc-400">
              <Trophy className="h-5 w-5" strokeWidth={1.5} />
              <span className="text-[11px] font-medium uppercase tracking-[0.2em]">
                Най-активен
              </span>
            </div>
            <p className="text-xl font-light text-zinc-900 truncate">
              {topAttendee
                ? `${topAttendee.member.firstName} ${topAttendee.member.lastName}`
                : "N/A"}
            </p>
            <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest mt-2">
              {topAttendee?.attendanceCount} посещения
            </p>
          </BentoCard>
        </div>
      )}

      {/* Table Card */}
      <BentoCard className="p-0 overflow-hidden bg-white border border-zinc-100 shadow-none rounded-[2.5rem]">
        <div className="p-8 border-b border-zinc-50 flex items-center justify-between">
          <h3 className="font-medium text-[11px] uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-3">
            <Users className="h-4 w-4 text-primary" strokeWidth={1.5} />
            Списък с присъствия
          </h3>
          <Badge
            variant="outline"
            className="rounded-full px-4 py-1 text-[10px] font-medium uppercase tracking-widest border-zinc-100 text-zinc-400"
          >
            {reportData.length} резултата
          </Badge>
        </div>

        {isLoading ? (
          <div className="p-32 text-center">
            <Loader2
              className="h-10 w-10 animate-spin mx-auto text-zinc-200 mb-6"
              strokeWidth={1}
            />
            <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-zinc-400">
              Обработка на данни...
            </p>
          </div>
        ) : reportData.length > 0 ? (
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
                    Брой посещения
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.map((item) => (
                  <TableRow
                    key={item.member.id}
                    className="border-zinc-50 hover:bg-zinc-50/50 transition-colors h-24"
                  >
                    <TableCell className="px-8">
                      <p className="font-medium text-sm text-zinc-900">{`${item.member.firstName} ${item.member.lastName}`}</p>
                      <p className="text-[10px] font-light text-zinc-400 uppercase tracking-widest mt-1">
                        {item.member.status}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-light text-zinc-600">
                        {item.member.email || "—"}
                      </p>
                      <p className="text-xs font-light text-zinc-400 mt-1">
                        {item.member.phone || "—"}
                      </p>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <span className="inline-flex items-center justify-center h-10 w-16 rounded-xl bg-zinc-50 text-zinc-900 font-medium text-sm border border-zinc-100">
                        {item.attendanceCount}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-32 text-center">
            <div className="h-16 w-16 bg-zinc-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Activity className="h-8 w-8 text-zinc-200" strokeWidth={1} />
            </div>
            <p className="text-sm font-light text-zinc-400 tracking-wide">
              Няма намерени данни за избрания период.
            </p>
          </div>
        )}
      </BentoCard>
    </div>
  );
};

export default AttendanceReport;
