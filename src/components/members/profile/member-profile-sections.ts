/**
 * Единен източник на истина за подстраниците (секциите) на досието на член.
 * Всяка секция съответства на реален маршрут в
 * `src/app/(protected)/members/[id]/(tabs)/<pathSuffix>/page.tsx`.
 * Навигацията ([MemberProfileNav]) и тестът за цялост се четат от тук.
 */
export type MemberProfileSectionId =
  | "personal"
  | "documents"
  | "parents"
  | "sales"
  | "attendance"
  | "trainings"
  | "volume"
  | "assessments"
  | "theory"
  | "ai-workouts";

export interface MemberProfileSection {
  id: MemberProfileSectionId;
  label: string;
  /** Суфикс след `/members/[id]`; празен низ = индексната страница. */
  pathSuffix: string;
  tooltip: string;
  accent?: "emerald" | "blue";
}

export const MEMBER_PROFILE_SECTIONS: readonly MemberProfileSection[] = [
  {
    id: "personal",
    label: "Данни",
    pathSuffix: "",
    tooltip: "Лични данни, контакти, възрастова група и семеен профил",
  },
  {
    id: "documents",
    label: "Документи",
    pathSuffix: "/documents",
    tooltip: "Медицински свидетелства, картотеки, декларации и бланки за печат",
  },
  {
    id: "parents",
    label: "Родителски достъп",
    pathSuffix: "/parents",
    tooltip: "Връзка с родители, PIN кодове за вход и родителски контрол",
    accent: "emerald",
  },
  {
    id: "sales",
    label: "Финансова история",
    pathSuffix: "/sales",
    tooltip: "Заплатени такси, абонаменти, история на плащанията и фактури",
  },
  {
    id: "attendance",
    label: "Присъствия",
    pathSuffix: "/attendance",
    tooltip:
      "Хронологичен регистър на присъствията и отсъствията от тренировки",
  },
  {
    id: "trainings",
    label: "Shadow тренировки",
    pathSuffix: "/trainings",
    tooltip:
      "История на тренировките на Shadow тренажора, бързина и показатели",
  },
  {
    id: "volume",
    label: "Тренировъчен обем",
    pathSuffix: "/volume",
    tooltip:
      "Анализ на тренировъчното натоварване, седмични часове и интензитет",
  },
  {
    id: "assessments",
    label: "Оценяване",
    pathSuffix: "/assessments",
    tooltip: "Треньорски оценки, физически нормативи и тестови показатели",
  },
  {
    id: "theory",
    label: "Теория",
    pathSuffix: "/theory",
    tooltip:
      "Резултати от тестове по правилника на бадминтона и тактически въпроси",
  },
  {
    id: "ai-workouts",
    label: "AI Програми",
    pathSuffix: "/ai-workouts",
    tooltip: "Индивидуални тренировъчни планове, генерирани от AI треньора",
    accent: "blue",
  },
];

/** Определя активната секция по текущия път (най-дългото съвпадение печели). */
export function getActiveMemberSectionId(
  pathname: string,
  memberId: string
): MemberProfileSectionId | null {
  const base = `/members/${memberId}`;
  if (pathname === base || pathname === `${base}/personal`) return "personal";
  const match = [...MEMBER_PROFILE_SECTIONS]
    .filter(
      (s) => s.pathSuffix && pathname.startsWith(`${base}${s.pathSuffix}`)
    )
    .sort((a, b) => b.pathSuffix.length - a.pathSuffix.length)[0];
  return match ? match.id : null;
}
