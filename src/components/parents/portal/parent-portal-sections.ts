import {
  CalendarDays,
  CalendarX2,
  CreditCard,
  FileText,
  Trophy,
  User,
} from "lucide-react";

export type ParentPortalSectionId =
  | "attendance"
  | "documents"
  | "finances"
  | "profile"
  | "development"
  | "absences";

export interface ParentPortalSectionConfig {
  id: ParentPortalSectionId;
  label: string;
  pathSuffix: string;
  tooltip: string;
  icon: typeof CalendarDays;
}

export const PARENT_PORTAL_SECTIONS: readonly ParentPortalSectionConfig[] = [
  {
    id: "attendance",
    label: "Присъствия & График",
    pathSuffix: "",
    tooltip: "Календар на проведените тренировки и присъствия на детето",
    icon: CalendarDays,
  },
  {
    id: "documents",
    label: "Документи & Картотека",
    pathSuffix: "documents",
    tooltip: "Електронно подписване на декларации, картотека и медицински",
    icon: FileText,
  },
  {
    id: "finances",
    label: "Такси & Бележки",
    pathSuffix: "finances",
    tooltip: "Месечни абонаменти, такси и електронни касови бележки",
    icon: CreditCard,
  },
  {
    id: "profile",
    label: "Данни за детето",
    pathSuffix: "profile",
    tooltip: "Картон на спортиста, контактни данни и заявка за корекция",
    icon: User,
  },
  {
    id: "development",
    label: "Спортно развитие",
    pathSuffix: "development",
    tooltip: "Ранглиста, точки, тестове и изпити по бадминтон",
    icon: Trophy,
  },
  {
    id: "absences",
    label: "Заявени отсъствия",
    pathSuffix: "absences",
    tooltip: "Предварително уведомяване на треньора за предстоящи отсъствия",
    icon: CalendarX2,
  },
] as const;

export function getParentPortalSectionHref(id: ParentPortalSectionId): string {
  const section = PARENT_PORTAL_SECTIONS.find((s) => s.id === id);
  return section?.pathSuffix
    ? `/club/parents/${section.pathSuffix}`
    : "/club/parents";
}

export function getActiveParentPortalSectionId(
  pathname: string
): ParentPortalSectionId | null {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (normalized === "/club/parents") return "attendance";
  if (!normalized.startsWith("/club/parents/")) return null;

  const segment = normalized.slice("/club/parents/".length).split("/")[0];
  // Ignore static utility routes
  if (["login", "request", "reset-password"].includes(segment)) return null;

  const match = PARENT_PORTAL_SECTIONS.find((s) => s.pathSuffix === segment);
  return match ? match.id : null;
}
