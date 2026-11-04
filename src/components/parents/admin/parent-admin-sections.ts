/**
 * Единен източник на истина за йерархичните подстраници (секциите) на Родителския портал (Админ).
 * Всяка секция съответства на реален маршрут в
 * `src/app/(protected)/parents/<pathSuffix>/page.tsx`.
 * Навигацията (ParentsNav) и тестовете за цялост четат от тук.
 */

export type ParentAdminSectionId =
  | "requests"
  | "accounts"
  | "absences"
  | "corrections"
  | "activity"
  | "messages";

export interface ParentAdminSection {
  id: ParentAdminSectionId;
  label: string;
  /** Суфикс след `/parents`; празен низ = индексната страница `/parents`. */
  pathSuffix: string;
  tooltip: string;
  accent?: "amber" | "blue" | "emerald" | "purple" | "orange" | "indigo";
}

export const PARENT_ADMIN_SECTIONS: readonly ParentAdminSection[] = [
  {
    id: "requests",
    label: "Заявки",
    pathSuffix: "",
    tooltip: "Чакащи заявки от родители за достъп до портала",
    accent: "amber",
  },
  {
    id: "accounts",
    label: "Родители",
    pathSuffix: "/accounts",
    tooltip: "Всички одобрени родителски профили и свързани състезатели",
    accent: "blue",
  },
  {
    id: "absences",
    label: "Отсъствия",
    pathSuffix: "/absences",
    tooltip: "Заявени отсъствия на състезатели от тренировки",
    accent: "orange",
  },
  {
    id: "corrections",
    label: "Корекции",
    pathSuffix: "/corrections",
    tooltip: "Предложени от родителите корекции на лични данни",
    accent: "indigo",
  },
  {
    id: "activity",
    label: "Активност",
    pathSuffix: "/activity",
    tooltip: "Дневник на родителските действия и потребители на живо",
    accent: "emerald",
  },
  {
    id: "messages",
    label: "Комуникация",
    pathSuffix: "/messages",
    tooltip: "История на разговорите, бележки и изпратени имейли",
    accent: "purple",
  },
];

/**
 * Определя активната секция по текущия път.
 * Поддържа канонични пътища и техни псевдоними:
 * - `/parents` или `/parents/requests` или `/parents/pending` -> "requests"
 * - `/parents/accounts` или `/parents/parents` -> "accounts"
 * - `/parents/absences` -> "absences"
 * - `/parents/corrections` -> "corrections"
 * - `/parents/activity` -> "activity"
 * - `/parents/messages` или `/parents/communication` -> "messages"
 */
export function getActiveParentAdminSectionId(
  pathname: string
): ParentAdminSectionId | null {
  if (!pathname.startsWith("/parents")) return null;

  const rest = pathname.slice("/parents".length);
  if (
    rest === "" ||
    rest === "/" ||
    rest === "/requests" ||
    rest === "/pending"
  ) {
    return "requests";
  }
  if (rest === "/accounts" || rest === "/parents") {
    return "accounts";
  }
  if (rest === "/absences") {
    return "absences";
  }
  if (rest === "/corrections") {
    return "corrections";
  }
  if (rest === "/activity") {
    return "activity";
  }
  if (rest === "/messages" || rest === "/communication") {
    return "messages";
  }

  return null;
}
