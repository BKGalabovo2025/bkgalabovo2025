import type { Metadata } from "next";

import { AttendanceSectionView } from "@/components/reports/views/AttendanceSectionView";

export const metadata: Metadata = {
  title: "Посещаемост | Справки | БК Гълъбово",
  description:
    "Анализ и статистика на посещаемостта по тренировъчни групи, периоди и състезатели.",
};

export default function ReportsAttendancePage() {
  return <AttendanceSectionView />;
}
