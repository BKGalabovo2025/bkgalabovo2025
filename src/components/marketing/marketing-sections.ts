import { FileText, History, Phone, Send, Zap } from "lucide-react";

export type MarketingSectionId =
  "contacts" | "composer" | "templates" | "history" | "automations";

export interface MarketingSectionConfig {
  id: MarketingSectionId;
  label: string;
  pathSuffix: string;
  tooltip: string;
  icon: typeof Phone;
}

export const MARKETING_SECTIONS: readonly MarketingSectionConfig[] = [
  {
    id: "contacts",
    label: "Контакти & CRM",
    pathSuffix: "contacts",
    tooltip:
      "Списък с обединени клубни контакти, бързи обаждания, бележки и статуси",
    icon: Phone,
  },
  {
    id: "composer",
    label: "Имейл Кампания",
    pathSuffix: "composer",
    tooltip: "Съставител на имейл кампании и персонализирани съобщения",
    icon: Send,
  },
  {
    id: "templates",
    label: "Шаблони",
    pathSuffix: "templates",
    tooltip:
      "Готови текстови шаблони за съобщения, състезания, такси и графици",
    icon: FileText,
  },
  {
    id: "history",
    label: "История & Дневник",
    pathSuffix: "history",
    tooltip:
      "Пълен хронологичен регистър на изпратени съобщения и проведени разговори",
    icon: History,
  },
  {
    id: "automations",
    label: "Автоматизации",
    pathSuffix: "automations",
    tooltip: "Правила за автоматични напомняния, рождени дни и дължими такси",
    icon: Zap,
  },
] as const;

export function getActiveMarketingSectionId(
  pathname: string
): MarketingSectionId | null {
  const normalized = pathname.replace(/\/+$/, "") || "/";

  // Base /marketing defaults to "contacts"
  if (normalized === "/marketing") {
    return "contacts";
  }

  if (!normalized.startsWith("/marketing/")) {
    return null;
  }

  const remainder = normalized.slice("/marketing/".length).split("/")[0];

  const match = MARKETING_SECTIONS.find((s) => s.pathSuffix === remainder);
  return match ? match.id : null;
}
