export type DeclarationSectionId = "signed" | "templates";

export interface DeclarationSectionConfig {
  id: DeclarationSectionId;
  label: string;
  /** Празен низ = индексна секция (/declarations). */
  pathSuffix: string;
  tooltip: string;
}

export const DECLARATION_SECTIONS: readonly DeclarationSectionConfig[] = [
  {
    id: "signed",
    label: "Подписани",
    pathSuffix: "",
    tooltip: "Подписани декларации за информирано съгласие",
  },
  {
    id: "templates",
    label: "Шаблони",
    pathSuffix: "templates",
    tooltip: "Празни бланки за печат",
  },
] as const;

export function getDeclarationSectionHref(id: DeclarationSectionId): string {
  const section = DECLARATION_SECTIONS.find((s) => s.id === id);
  return section?.pathSuffix
    ? `/declarations/${section.pathSuffix}`
    : "/declarations";
}

export function getActiveDeclarationSectionId(
  pathname: string
): DeclarationSectionId | null {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (normalized === "/declarations") return "signed";
  if (!normalized.startsWith("/declarations/")) return null;
  const segment = normalized.slice("/declarations/".length).split("/")[0];
  const match = DECLARATION_SECTIONS.find((s) => s.pathSuffix === segment);
  return match ? match.id : null;
}

export const BLANK_DECLARATION_PDF_URL = encodeURI(
  "/declaration/Декларация за информирано съгласие BG ENG.pdf"
);
