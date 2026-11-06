export interface TheorySection {
  id: string;
  label: string;
  href: string;
  badge?: string;
}

export const THEORY_SECTIONS: readonly TheorySection[] = [
  { id: "library", label: "Библиотека с тестове", href: "/training/theory" },
  {
    id: "builder",
    label: "Конструктор на тест",
    href: "/training/theory/builder",
  },
  { id: "sent", label: "Изпратени тестове", href: "/training/theory/sent" },
  { id: "review", label: "За проверка", href: "/training/theory/review" },
  {
    id: "history",
    label: "История на резултатите",
    href: "/training/theory/history",
  },
] as const;

export function getActiveTheorySection(pathname: string): string {
  if (pathname.startsWith("/training/theory/builder")) return "builder";
  if (pathname.startsWith("/training/theory/sent")) return "sent";
  if (pathname.startsWith("/training/theory/review")) return "review";
  if (pathname.startsWith("/training/theory/history")) return "history";
  return "library";
}
