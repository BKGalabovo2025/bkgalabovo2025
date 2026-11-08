import { FileCheck2, Palette, Printer, UploadCloud } from "lucide-react";

export type CertificateSectionId = "issue" | "studio" | "templates" | "issued";

export interface CertificateSectionConfig {
  id: CertificateSectionId;
  label: string;
  pathSuffix: string;
  tooltip: string;
  icon: typeof UploadCloud;
}

export const CERTIFICATE_SECTIONS: readonly CertificateSectionConfig[] = [
  {
    id: "issue",
    label: "Качи готов ваучер",
    pathSuffix: "",
    tooltip: "Качване и издаване на готов PDF или изображение",
    icon: UploadCloud,
  },
  {
    id: "studio",
    label: "Студио за издаване",
    pathSuffix: "/studio",
    tooltip:
      "Издаване на грамоти, дипломи и ваучери по шаблон (вкл. турнири и лагери)",
    icon: Printer,
  },
  {
    id: "templates",
    label: "AI Шаблони & Дизайнер",
    pathSuffix: "/templates",
    tooltip: "Визуален и AI дизайнер на шаблони за сертификати и грамоти",
    icon: Palette,
  },
  {
    id: "issued",
    label: "Издадени документи",
    pathSuffix: "/issued",
    tooltip: "Регистър на всички издадени сертификати, грамоти и ваучери",
    icon: FileCheck2,
  },
] as const;

export function getActiveCertificateSectionId(
  pathname: string
): CertificateSectionId | null {
  const normalized = pathname.replace(/\/+$/, "") || "/";

  // Base /certificates or /certificates/issue defaults to "issue"
  if (normalized === "/certificates" || normalized === "/certificates/issue") {
    return "issue";
  }

  if (!normalized.startsWith("/certificates/")) {
    return null;
  }

  const remainder = "/" + normalized.slice("/certificates/".length).split("/")[0];

  const match = CERTIFICATE_SECTIONS.find((s) => s.pathSuffix === remainder);
  return match ? match.id : null;
}
