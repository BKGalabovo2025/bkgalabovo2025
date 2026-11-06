export interface CampsListSection {
  id: string;
  label: string;
  href: string;
  badge?: string;
}

export const CAMPS_LIST_SECTIONS: readonly CampsListSection[] = [
  { id: "all", label: "Всички лагери", href: "/training/camps" },
  { id: "upcoming", label: "Предстоящи", href: "/training/camps/upcoming" },
  { id: "past", label: "Минали", href: "/training/camps/past" },
] as const;

export function getActiveCampsListSection(pathname: string): string {
  if (pathname.startsWith("/training/camps/upcoming")) return "upcoming";
  if (pathname.startsWith("/training/camps/past")) return "past";
  return "all";
}
