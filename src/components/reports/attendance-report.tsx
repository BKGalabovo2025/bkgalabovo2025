// src/components/reports/attendance-report.tsx
"use client";

import {
  Activity,
  Calendar,
  Download,
  Filter,
  Loader2,
  Trophy,
  Users,
} from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  AttendanceReportItem,
  generateAttendanceReport,
} from "@/services/report-service";

interface AttendanceReportProps {
  initialReportData: AttendanceReportItem[];
  initialStartDate: string;
  initialEndDate: string;
}

const AttendanceReport = ({
  initialReportData,
  initialStartDate,
  initialEndDate,
}: AttendanceReportProps) => {
  const [startDate, setStartDate] = useState<Date | undefined>(
    () => new Date(initialStartDate)
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    () => new Date(initialEndDate)
  );
  const [reportData, setReportData] =
    useState<AttendanceReportItem[]>(initialReportData);
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
      <BentoCard className="rounded-2xl border border-zinc-200/80 bg-white p-3.5 sm:p-4.5 shadow-none dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col items-end gap-3 sm:gap-4 md:flex-row">
          <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="attendance-start-date"
                className="ml-1 flex items-center gap-2 text-[10px] sm:text-[11px] font-medium tracking-[0.2em] text-zinc-400 uppercase"
              >
                <Calendar className="size-3.5" strokeWidth={1.5} /> Начална дата
              </Label>
              <Input
                id="attendance-start-date"
                name="startDate"
                type="date"
                value={startDate ? formatDateInput(startDate) : ""}
                onChange={handleDateChange(setStartDate)}
                className="h-10 rounded-xl border-zinc-100 bg-zinc-50/50 text-xs sm:text-sm font-light shadow-none focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-900/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="attendance-end-date"
                className="ml-1 flex items-center gap-2 text-[10px] sm:text-[11px] font-medium tracking-[0.2em] text-zinc-400 uppercase"
              >
                <Calendar className="size-3.5" strokeWidth={1.5} /> Крайна дата
              </Label>
              <Input
                id="attendance-end-date"
                name="endDate"
                type="date"
                value={endDate ? formatDateInput(endDate) : ""}
                onChange={handleDateChange(setEndDate)}
                className="h-10 rounded-xl border-zinc-100 bg-zinc-50/50 text-xs sm:text-sm font-light shadow-none focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-900/50"
              />
            </div>
          </div>

          <div className="flex w-full gap-2.5 md:w-auto">
            <Button
              onClick={handleGenerateReport}
              disabled={isLoading}
              className="h-10 flex-1 rounded-xl bg-zinc-950 px-5 text-[10px] sm:text-[11px] font-medium tracking-widest text-white uppercase shadow-none transition-all hover:bg-zinc-800 md:flex-none"
            >
              {isLoading ? (
                <Loader2 className="mr-2 size-3.5 animate-spin" />
              ) : (
                <Filter className="mr-2 size-3.5" strokeWidth={1.5} />
              )}
              Генерирай
            </Button>
            {reportData.length > 0 && (
              <Button
                onClick={handleExport}
                variant="outline"
                className="h-10 rounded-xl border-zinc-200 px-5 text-[10px] sm:text-[11px] font-medium tracking-widest uppercase transition-all hover:bg-zinc-50 dark:border-zinc-800"
              >
                <Download className="mr-2 size-3.5" strokeWidth={1.5} /> Експорт
              </Button>
            )}
          </div>
        </div>
        {error && (
          <p className="mt-4 ml-1 text-[10px] sm:text-[11px] font-medium tracking-widest text-rose-500 uppercase">
            {error}
          </p>
        )}
      </BentoCard>

      {/* Stats Cards */}
      {reportData.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
          <BentoCard className="rounded-2xl border border-zinc-200/80 bg-white p-3.5 sm:p-4 shadow-none dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-2 flex items-center gap-2.5 text-zinc-400">
              <Activity className="size-4" strokeWidth={1.5} />
              <span className="text-[10px] sm:text-[11px] font-medium tracking-[0.2em] uppercase">
                Общо посещения
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-light tracking-tight text-zinc-900 dark:text-white">
              {totalAttendance}
            </p>
          </BentoCard>

          <BentoCard className="rounded-2xl border border-zinc-200/80 bg-white p-3.5 sm:p-4 shadow-none dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-2 flex items-center gap-2.5 text-zinc-400">
              <Users className="size-4" strokeWidth={1.5} />
              <span className="text-[10px] sm:text-[11px] font-medium tracking-[0.2em] uppercase">
                Активни членове
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-light tracking-tight text-zinc-900 dark:text-white">
              {reportData.length}
            </p>
          </BentoCard>

          <BentoCard className="group relative rounded-2xl border border-zinc-200/80 bg-white p-3.5 sm:p-4 shadow-none dark:border-zinc-800 dark:bg-zinc-950">
            <Trophy
              className="absolute top-4 right-4 size-6 text-zinc-100 transition-colors group-hover:text-amber-100 dark:text-zinc-800"
              strokeWidth={1}
            />
            <div className="mb-2 flex items-center gap-2.5 text-zinc-400">
              <Trophy className="size-4" strokeWidth={1.5} />
              <span className="text-[10px] sm:text-[11px] font-medium tracking-[0.2em] uppercase">
                Най-активен
              </span>
            </div>
            <p className="truncate text-base sm:text-lg font-light text-zinc-900 dark:text-white">
              {topAttendee
                ? `${topAttendee.member.firstName} ${topAttendee.member.lastName}`
                : "N/A"}
            </p>
            <p className="mt-1 text-[10px] font-medium tracking-widest text-zinc-400 uppercase">
              {topAttendee?.attendanceCount} посещения
            </p>
          </BentoCard>
        </div>
      )}

      {/* Table Card */}
      <BentoCard className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-0 shadow-none dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between border-b border-zinc-100 p-3.5 sm:p-4 dark:border-zinc-800">
          <h3 className="flex items-center gap-2 text-[10px] sm:text-[11px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
            <Users className="size-3.5 text-primary" strokeWidth={1.5} />
            Списък с присъствия
          </h3>
          <Badge
            variant="outline"
            className="rounded-full border-zinc-200 px-3 py-0.5 text-[10px] font-medium tracking-widest text-zinc-400 uppercase dark:border-zinc-800"
          >
            {reportData.length} резултата
          </Badge>
        </div>

        {isLoading ? (
          <div className="p-8 sm:p-12 text-center">
            <Loader2
              className="mx-auto mb-3 size-8 animate-spin text-zinc-300 dark:text-zinc-600"
              strokeWidth={1.5}
            />
            <p className="text-[10px] sm:text-[11px] font-medium tracking-[0.3em] text-zinc-400 uppercase">
              Обработка на данни...
            </p>
          </div>
        ) : reportData.length > 0 ? (
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
                      Брой посещения
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.map((item) => (
                    <TableRow
                      key={item.member.id}
                      className="h-24 border-zinc-50 transition-colors hover:bg-zinc-50/50"
                    >
                      <TableCell className="px-8">
                        <p className="text-sm font-medium text-zinc-900">{`${item.member.firstName} ${item.member.lastName}`}</p>
                        <p className="mt-1 text-[10px] font-light tracking-widest text-zinc-400 uppercase">
                          {item.member.status}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-light text-zinc-600">
                          {item.member.email || "—"}
                        </p>
                        <p className="mt-1 text-xs font-light text-zinc-400">
                          {item.member.phone || "—"}
                        </p>
                      </TableCell>
                      <TableCell className="pr-8 text-right">
                        <span className="inline-flex h-10 w-16 items-center justify-center rounded-xl border border-zinc-100 bg-zinc-50 text-sm font-medium text-zinc-900">
                          {item.attendanceCount}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex flex-col divide-y divide-zinc-50 md:hidden">
              {reportData.map((item) => (
                <div
                  key={item.member.id}
                  className="flex items-center justify-between gap-4 p-6"
                >
                  <div className="flex flex-col gap-3">
                    <div>
                      <p className="text-sm font-medium text-zinc-900">{`${item.member.firstName} ${item.member.lastName}`}</p>
                      <p className="mt-1 text-[10px] font-light tracking-widest text-zinc-400 uppercase">
                        {item.member.status}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-light text-zinc-600">
                        {item.member.email || "—"}
                      </p>
                      <p className="mt-0.5 text-xs font-light text-zinc-400">
                        {item.member.phone || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-right text-[10px] font-medium tracking-widest text-zinc-400 uppercase">
                      Посещения
                    </span>
                    <span className="inline-flex h-10 w-12 items-center justify-center rounded-xl border border-zinc-100 bg-zinc-50 text-sm font-medium text-zinc-900">
                      {item.attendanceCount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="p-8 sm:p-12 text-center">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-zinc-50 dark:bg-zinc-900">
              <Activity
                className="size-6 text-zinc-300 dark:text-zinc-600"
                strokeWidth={1.5}
              />
            </div>
            <p className="text-xs sm:text-sm font-light tracking-wide text-zinc-400">
              Няма намерени данни за избрания период.
            </p>
          </div>
        )}
      </BentoCard>
    </div>
  );
};

export default AttendanceReport;
