import { FileCheck2, UploadCloud } from "lucide-react";

export type CertificateSectionId = "issue" | "issued";

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
    label: "Издай ваучер / документ",
    pathSuffix: "issue",
    tooltip: "Качване на готови ваучери, генериране на грамоти и QR код",
    icon: UploadCloud,
  },
  {
    id: "issued",
    label: "Издадени документи",
    pathSuffix: "issued",
    tooltip: "Регистър на издадени сертификати, ваучери, статуси и верификация",
    icon: FileCheck2,
  },
] as const;

export function getActiveCertificateSectionId(
  pathname: string
): CertificateSectionId | null {
  const normalized = pathname.replace(/\/+$/, "") || "/";

  // Base /certificates defaults to "issue"
  if (normalized === "/certificates") {
    return "issue";
  }

  if (!normalized.startsWith("/certificates/")) {
    return null;
  }

  const remainder = normalized.slice("/certificates/".length).split("/")[0];

  const match = CERTIFICATE_SECTIONS.find((s) => s.pathSuffix === remainder);
  return match ? match.id : null;
}
