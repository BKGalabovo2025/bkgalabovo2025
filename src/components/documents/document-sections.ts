import { FileCheck2, FileSignature } from "lucide-react";

export type DocumentSectionId = "templates" | "signed";

export interface DocumentSectionConfig {
  id: DocumentSectionId;
  label: string;
  pathSuffix: string;
  tooltip: string;
  icon: typeof FileCheck2;
}

export const DOCUMENT_SECTIONS: readonly DocumentSectionConfig[] = [
  {
    id: "templates",
    label: "Образци на бланки",
    pathSuffix: "templates",
    tooltip:
      "Управление на клубни образци, декларации, формуляри и шаблони за документи",
    icon: FileCheck2,
  },
  {
    id: "signed",
    label: "Всички подписани документи",
    pathSuffix: "signed",
    tooltip:
      "Електронен регистър, валидност и одит на подписаните клубни документи",
    icon: FileSignature,
  },
] as const;

export function getActiveDocumentSectionId(
  pathname: string
): DocumentSectionId | null {
  const normalized = pathname.replace(/\/+$/, "") || "/";

  // Base /documents path defaults to "templates"
  if (normalized === "/documents") {
    return "templates";
  }

  if (!normalized.startsWith("/documents/")) {
    return null;
  }

  const remainder = normalized.slice("/documents/".length).split("/")[0];

  const match = DOCUMENT_SECTIONS.find((s) => s.pathSuffix === remainder);
  return match ? match.id : null;
}
