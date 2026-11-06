"use client";

import React from "react";

import AttendanceReport from "@/components/reports/attendance-report";
import { BentoCard } from "@/components/ui/bento-card";

import { useReportsContext } from "../ReportsContext";

export function AttendanceSectionView() {
  const { initialAttendanceData, initialAttendancePeriod } =
    useReportsContext();

  return (
    <BentoCard className="overflow-hidden border border-zinc-200/80 bg-white p-3.5 sm:p-5 shadow-xs rounded-2xl dark:border-zinc-800 dark:bg-zinc-950">
      <AttendanceReport
        initialReportData={initialAttendanceData}
        initialStartDate={initialAttendancePeriod.startDate}
        initialEndDate={initialAttendancePeriod.endDate}
      />
    </BentoCard>
  );
}
