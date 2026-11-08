import { Award, BarChart3, Package, Users, Wallet } from "lucide-react";

export type ReportSectionId =
  "financial" | "liabilities" | "attendance" | "restock" | "annual";

export interface ReportSectionConfig {
  id: ReportSectionId;
  label: string;
  pathSuffix: string;
  tooltip: string;
  icon: typeof BarChart3;
}

export const REPORT_SECTIONS: readonly ReportSectionConfig[] = [
  {
    id: "financial",
    label: "Финанси",
    pathSuffix: "financial",
    tooltip:
      "Обобщен финансов отчет за приходи, разходи, печалба и салда по периоди",
    icon: BarChart3,
  },
  {
    id: "liabilities",
    label: "Задължения",
    pathSuffix: "liabilities",
    tooltip:
      "Справка за невнесени месечни абонаменти, такси и просрочени задължения",
    icon: Wallet,
  },
  {
    id: "attendance",
    label: "Присъствие",
    pathSuffix: "attendance",
    tooltip:
      "Анализ на посещаемостта по състезатели, тренировъчни групи и периоди",
    icon: Users,
  },
  {
    id: "restock",
    label: "Зареждане",
    pathSuffix: "restock",
    tooltip:
      "Справка за критични складови наличности, пера, екипировка и поръчки",
    icon: Package,
  },
  {
    id: "annual",
    label: "Годишен отчет",
    pathSuffix: "annual",
    tooltip:
      "Официален годишен отчет за дейността на треньора и клуба с медали, лагери и турнири",
    icon: Award,
  },
] as const;

export function getActiveReportSectionId(
  pathname: string
): ReportSectionId | null {
  const normalized = pathname.replace(/\/+$/, "") || "/";

  // Base /reports path defaults to "financial"
  if (normalized === "/reports") {
    return "financial";
  }

  if (!normalized.startsWith("/reports/")) {
    return null;
  }

  const remainder = normalized.slice("/reports/".length).split("/")[0];

  const match = REPORT_SECTIONS.find((s) => s.pathSuffix === remainder);
  return match ? match.id : null;
}
