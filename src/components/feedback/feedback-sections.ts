import { Inbox, Layers, Link as LinkIcon } from "lucide-react";

export type FeedbackSectionId = "submissions" | "campaigns" | "templates";

export interface FeedbackSectionConfig {
  id: FeedbackSectionId;
  label: string;
  pathSuffix: string;
  tooltip: string;
  icon: typeof Inbox;
}

export const FEEDBACK_SECTIONS: readonly FeedbackSectionConfig[] = [
  {
    id: "submissions",
    label: "Отзиви",
    pathSuffix: "submissions",
    tooltip:
      "Преглед, модерация и одобряване на попълнени отзиви от родители и състезатели",
    icon: Inbox,
  },
  {
    id: "campaigns",
    label: "Анкети & Линкове",
    pathSuffix: "campaigns",
    tooltip:
      "Генериране и споделяне на линкове за обратна връзка за клубни събития",
    icon: LinkIcon,
  },
  {
    id: "templates",
    label: "Шаблони",
    pathSuffix: "templates",
    tooltip: "Управление на въпросници, въпроси и шаблони за анкети",
    icon: Layers,
  },
] as const;

export function getActiveFeedbackSectionId(
  pathname: string
): FeedbackSectionId | null {
  const normalized = pathname.replace(/\/+$/, "") || "/";

  // Base /feedback defaults to "submissions"
  if (normalized === "/feedback") {
    return "submissions";
  }

  if (!normalized.startsWith("/feedback/")) {
    return null;
  }

  const remainder = normalized.slice("/feedback/".length).split("/")[0];

  const match = FEEDBACK_SECTIONS.find((s) => s.pathSuffix === remainder);
  return match ? match.id : null;
}
