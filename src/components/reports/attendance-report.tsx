/* eslint-disable sonarjs/no-nested-conditional */

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
      <BentoCard className="rounded-4xl border border-zinc-100 bg-white p-8 shadow-none">
        <div className="flex flex-col items-end gap-6 md:flex-row">
          <div className="grid flex-1 grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-3">
              <Label className="ml-1 flex items-center gap-2 text-[11px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
                <Calendar className="size-3.5" strokeWidth={1.5} /> Начална
                дата
              </Label>
              <Input
                type="date"
                value={startDate ? formatDateInput(startDate) : ""}
                onChange={handleDateChange(setStartDate)}
                className="h-12 rounded-xl border-zinc-100 bg-zinc-50/50 font-light shadow-none focus:ring-zinc-200"
              />
            </div>
            <div className="space-y-3">
              <Label className="ml-1 flex items-center gap-2 text-[11px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
                <Calendar className="size-3.5" strokeWidth={1.5} /> Крайна
                дата
              </Label>
              <Input
                type="date"
                value={endDate ? formatDateInput(endDate) : ""}
                onChange={handleDateChange(setEndDate)}
                className="h-12 rounded-xl border-zinc-100 bg-zinc-50/50 font-light shadow-none focus:ring-zinc-200"
              />
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
            {reportData.length > 0 && (
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
        {error && (
          <p className="mt-6 ml-1 text-[11px] font-medium tracking-widest text-rose-500 uppercase">
            {error}
          </p>
        )}
      </BentoCard>

      {/* Stats Cards */}
      {reportData.length > 0 && (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <BentoCard className="rounded-4xl border border-zinc-100 bg-white p-8 shadow-none">
            <div className="mb-3 flex items-center gap-4 text-zinc-400">
              <Activity className="size-5" strokeWidth={1.5} />
              <span className="text-[11px] font-medium tracking-[0.2em] uppercase">
                Общо посещения
              </span>
            </div>
            <p className="text-4xl font-light tracking-tighter text-zinc-900">
              {totalAttendance}
            </p>
          </BentoCard>

          <BentoCard className="rounded-4xl border border-zinc-100 bg-white p-8 shadow-none">
            <div className="mb-3 flex items-center gap-4 text-zinc-400">
              <Users className="size-5" strokeWidth={1.5} />
              <span className="text-[11px] font-medium tracking-[0.2em] uppercase">
                Активни членове
              </span>
            </div>
            <p className="text-4xl font-light tracking-tighter text-zinc-900">
              {reportData.length}
            </p>
          </BentoCard>

          <BentoCard className="group relative rounded-4xl border border-zinc-100 bg-white p-8 shadow-none">
            <Trophy
              className="absolute top-8 right-8 size-8 text-zinc-100 transition-colors group-hover:text-amber-100"
              strokeWidth={1}
            />
            <div className="mb-3 flex items-center gap-4 text-zinc-400">
              <Trophy className="size-5" strokeWidth={1.5} />
              <span className="text-[11px] font-medium tracking-[0.2em] uppercase">
                Най-активен
              </span>
            </div>
            <p className="truncate text-xl font-light text-zinc-900">
              {topAttendee
                ? `${topAttendee.member.firstName} ${topAttendee.member.lastName}`
                : "N/A"}
            </p>
            <p className="mt-2 text-[10px] font-medium tracking-widest text-zinc-400 uppercase">
              {topAttendee?.attendanceCount} посещения
            </p>
          </BentoCard>
        </div>
      )}

      {/* Table Card */}
      <BentoCard className="overflow-hidden rounded-5xl border border-zinc-100 bg-white p-0 shadow-none">
        <div className="flex items-center justify-between border-b border-zinc-50 p-8">
          <h3 className="flex items-center gap-3 text-[11px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
            <Users className="size-4 text-primary" strokeWidth={1.5} />
            Списък с присъствия
          </h3>
          <Badge
            variant="outline"
            className="rounded-full border-zinc-100 px-4 py-1 text-[10px] font-medium tracking-widest text-zinc-400 uppercase"
          >
            {reportData.length} резултата
          </Badge>
        </div>

        {isLoading ? (
          <div className="p-32 text-center">
            <Loader2
              className="mx-auto mb-6 size-10 animate-spin text-zinc-200"
              strokeWidth={1}
            />
            <p className="text-[11px] font-medium tracking-[0.3em] text-zinc-400 uppercase">
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
          <div className="p-32 text-center">
            <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-zinc-50">
              <Activity className="size-8 text-zinc-200" strokeWidth={1} />
            </div>
            <p className="text-sm font-light tracking-wide text-zinc-400">
              Няма намерени данни за избрания период.
            </p>
          </div>
        )}
      </BentoCard>
    </div>
  );
};

export default AttendanceReport;
