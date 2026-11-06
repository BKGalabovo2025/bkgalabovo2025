import {
  Activity,
  Database,
  Palette,
  Settings,
  Shield,
  User,
  Users,
} from "lucide-react";

export type SettingsSectionId =
  | "general"
  | "branding"
  | "security"
  | "profile"
  | "recovery"
  | "team"
  | "audit"
  | "backup";

export interface SettingsSectionConfig {
  id: SettingsSectionId;
  label: string;
  pathSuffix: string;
  tooltip: string;
  icon: typeof Settings;
}

export const SETTINGS_SECTIONS: readonly SettingsSectionConfig[] = [
  {
    id: "general",
    label: "Общи",
    pathSuffix: "general",
    tooltip: "Основни настройки на сайта, клубни контакти и адреси",
    icon: Settings,
  },
  {
    id: "branding",
    label: "Брандиране",
    pathSuffix: "branding",
    tooltip: "Логота, цветова палитра, банери и визуална идентичност",
    icon: Palette,
  },
  {
    id: "security",
    label: "Сигурност",
    pathSuffix: "security",
    tooltip: "Двуфакторна автентикация, пароли и защитни политики",
    icon: Shield,
  },
  {
    id: "profile",
    label: "Личен Профил",
    pathSuffix: "profile",
    tooltip: "Потребителски профил на администратора и лични данни",
    icon: User,
  },
  {
    id: "recovery",
    label: "Зона Възстановяване",
    pathSuffix: "recovery",
    tooltip: "Параметри и график за Recovery Zone by ZM",
    icon: Activity,
  },
  {
    id: "team",
    label: "Екип",
    pathSuffix: "team",
    tooltip: "Треньорски щаб, роли, снимки и биография",
    icon: Users,
  },
  {
    id: "audit",
    label: "Системни логове",
    pathSuffix: "audit",
    tooltip: "Одитни логове за сигурност и извършени действия",
    icon: Shield,
  },
  {
    id: "backup",
    label: "Резервен архив",
    pathSuffix: "backup",
    tooltip: "Архивиране на базата данни и възстановяване",
    icon: Database,
  },
] as const;

export function getActiveSettingsSectionId(
  pathname: string
): SettingsSectionId | null {
  const normalized = pathname.replace(/\/+$/, "") || "/";

  // Base /settings defaults to "general"
  if (normalized === "/settings") {
    return "general";
  }

  if (!normalized.startsWith("/settings/")) {
    return null;
  }

  const remainder = normalized.slice("/settings/".length).split("/")[0];

  const match = SETTINGS_SECTIONS.find((s) => s.pathSuffix === remainder);
  return match ? match.id : null;
}
