import { Bell, LayoutDashboard, TerminalSquare } from "lucide-react";

export type DashboardSectionId = "overview" | "activity" | "logs";

export interface DashboardSectionConfig {
  id: DashboardSectionId;
  label: string;
  pathSuffix: string;
  tooltip: string;
  icon: typeof LayoutDashboard;
}

export const DASHBOARD_SECTIONS: readonly DashboardSectionConfig[] = [
  {
    id: "overview",
    label: "Общ преглед",
    pathSuffix: "overview",
    tooltip:
      "Ключови показатели (KPI), оборот, дневен график и наличности в реално време",
    icon: LayoutDashboard,
  },
  {
    id: "activity",
    label: "Активност & Известия",
    pathSuffix: "activity",
    tooltip:
      "Напомняния за плащания и документи, запитвания от форми, рожденици и отзиви",
    icon: Bell,
  },
  {
    id: "logs",
    label: "Системен мониторинг",
    pathSuffix: "logs",
    tooltip: "Мониторинг на грешки, събития и стабилност на системните услуги",
    icon: TerminalSquare,
  },
] as const;

export function getActiveDashboardSectionId(
  pathname: string
): DashboardSectionId | null {
  const normalized = pathname.replace(/\/+$/, "") || "/";

  // Base /dashboard path defaults to "overview"
  if (normalized === "/dashboard") {
    return "overview";
  }

  if (!normalized.startsWith("/dashboard/")) {
    return null;
  }

  const remainder = normalized.slice("/dashboard/".length).split("/")[0];

  if (remainder === "overview") return "overview";
  if (remainder === "activity") return "activity";
  if (remainder === "logs") return "logs";

  const match = DASHBOARD_SECTIONS.find((s) => s.pathSuffix === remainder);
  return match ? match.id : null;
}
