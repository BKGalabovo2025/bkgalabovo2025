import { CalendarDays, Users } from "lucide-react";

export type CampSectionId = "itinerary" | "attendees";

export interface CampSectionConfig {
  id: CampSectionId;
  label: string;
  pathSuffix: string;
  tooltip: string;
  icon: typeof CalendarDays;
}

export const CAMP_SECTIONS: readonly CampSectionConfig[] = [
  {
    id: "itinerary",
    label: "Дневен график",
    pathSuffix: "itinerary",
    tooltip:
      "Дневна тренировъчна програма, часове, треньори и прогноза за времето",
    icon: CalendarDays,
  },
  {
    id: "attendees",
    label: "Списък с участници",
    pathSuffix: "attendees",
    tooltip: "Списък със записани състезатели, стаи, капаро и застраховки",
    icon: Users,
  },
] as const;

export function getActiveCampSectionId(
  pathname: string,
  campId: string
): CampSectionId | null {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  const basePath = `/training/camps/${campId}`;

  // Base path defaults to "itinerary"
  if (normalized === basePath) {
    return "itinerary";
  }

  if (!normalized.startsWith(`${basePath}/`)) {
    return null;
  }

  const remainder = normalized.slice(`${basePath}/`.length).split("/")[0];

  const match = CAMP_SECTIONS.find((s) => s.pathSuffix === remainder);
  return match ? match.id : null;
}
