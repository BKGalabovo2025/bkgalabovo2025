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
      <BentoCard className="p-6 bg-white border-none shadow-sm">
        <div className="flex flex-col md:flex-row gap-6 items-end">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Calendar className="h-3 w-3" /> Начална дата
              </Label>
              <Input
                type="date"
                value={startDate ? formatDateInput(startDate) : ""}
                onChange={handleDateChange(setStartDate)}
                className="rounded-xl border-slate-100 bg-slate-50/50 focus:ring-blue-500/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Calendar className="h-3 w-3" /> Крайна дата
              </Label>
              <Input
                type="date"
                value={endDate ? formatDateInput(endDate) : ""}
                onChange={handleDateChange(setEndDate)}
                className="rounded-xl border-slate-100 bg-slate-50/50 focus:ring-blue-500/20"
              />
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
            {reportData.length > 0 && (
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
        {error && (
          <p className="text-rose-500 text-xs font-bold mt-4">{error}</p>
        )}
      </BentoCard>

      {/* Stats Cards */}
      {reportData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <BentoCard className="p-6 bg-blue-50 border-blue-100/50">
            <div className="flex items-center gap-3 mb-2 text-blue-600">
              <Activity className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Общо посещения
              </span>
            </div>
            <p className="text-3xl font-black text-blue-900">
              {totalAttendance}
            </p>
          </BentoCard>

          <BentoCard className="p-6 bg-emerald-50 border-emerald-100/50">
            <div className="flex items-center gap-3 mb-2 text-emerald-600">
              <Users className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Активни членове
              </span>
            </div>
            <p className="text-3xl font-black text-emerald-900">
              {reportData.length}
            </p>
          </BentoCard>

          <BentoCard className="p-6 bg-purple-50 border-purple-100/50">
            <div className="flex items-center gap-3 mb-2 text-purple-600">
              <Trophy className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Най-активен
              </span>
            </div>
            <p className="text-lg font-black text-purple-900 truncate">
              {topAttendee
                ? `${topAttendee.member.firstName} ${topAttendee.member.lastName}`
                : "N/A"}
            </p>
            <p className="text-xs font-bold text-purple-600 uppercase mt-1">
              {topAttendee?.attendanceCount} посещения
            </p>
          </BentoCard>
        </div>
      )}

      {/* Table Card */}
      <BentoCard className="p-0 overflow-hidden bg-white border-none shadow-sm">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <h3 className="font-black text-sm uppercase tracking-widest text-slate-900 flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" />
            Списък с присъствия
          </h3>
          <Badge
            variant="outline"
            className="rounded-lg border-slate-200 text-slate-500 font-bold"
          >
            {reportData.length} резултата
          </Badge>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">
              Обработка на данни...
            </p>
          </div>
        ) : reportData.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-slate-50 hover:bg-transparent">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest h-10">
                    Член
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest h-10">
                    Имейл / Телефон
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest h-10 text-right">
                    Брой посещения
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.map((item) => (
                  <TableRow
                    key={item.member.id}
                    className="border-slate-50 hover:bg-slate-50/50 transition-colors"
                  >
                    <TableCell className="py-4">
                      <p className="font-black text-sm text-slate-900">{`${item.member.firstName} ${item.member.lastName}`}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        {item.member.status}
                      </p>
                    </TableCell>
                    <TableCell className="py-4">
                      <p className="text-xs font-medium text-slate-600">
                        {item.member.email || "—"}
                      </p>
                      <p className="text-xs font-medium text-slate-400">
                        {item.member.phone || "—"}
                      </p>
                    </TableCell>
                    <TableCell className="text-right py-4">
                      <span className="inline-flex items-center justify-center h-8 w-12 rounded-lg bg-blue-50 text-blue-700 font-black text-sm">
                        {item.attendanceCount}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Activity className="h-6 w-6 text-slate-300" />
            </div>
            <p className="text-sm font-bold text-slate-400 italic">
              Няма намерени данни за избрания период.
            </p>
          </div>
        )}
      </BentoCard>
    </div>
  );
};

export default AttendanceReport;
