export interface BeepTestSection {
  id: string;
  label: string;
  href: string;
  badge?: string;
}

export const BEEP_TEST_SECTIONS: readonly BeepTestSection[] = [
  { id: "new", label: "Провеждане на тест", href: "/training/beep-test" },
  {
    id: "history",
    label: "История на резултатите",
    href: "/training/beep-test/history",
  },
  {
    id: "norms",
    label: "Нормативи и скала",
    href: "/training/beep-test/norms",
  },
] as const;

export function getActiveBeepTestSection(pathname: string): string {
  if (pathname.startsWith("/training/beep-test/history")) {
    return "history";
  }
  if (pathname.startsWith("/training/beep-test/norms")) {
    return "norms";
  }
  return "new";
}
