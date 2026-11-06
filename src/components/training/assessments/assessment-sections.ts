export interface AssessmentSection {
  id: string;
  label: string;
  href: string;
  badge?: string;
}

export const ASSESSMENT_SECTIONS: readonly AssessmentSection[] = [
  { id: "bwf", label: "BWF Тестове и Бланки", href: "/training/assessments" },
  {
    id: "history",
    label: "История на оценяването",
    href: "/training/assessments/history",
  },
] as const;

export function getActiveAssessmentSection(pathname: string): string {
  if (pathname.startsWith("/training/assessments/history")) {
    return "history";
  }
  return "bwf";
}
