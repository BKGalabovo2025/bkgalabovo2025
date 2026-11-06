import type { Metadata } from "next";

import { ItinerarySectionView } from "@/components/camps/views/ItinerarySectionView";

export const metadata: Metadata = {
  title: "Дневен график | Лагери | БК Гълъбово",
  description:
    "Дневен тренировъчен график, занимания и метеорологична прогноза за лагера.",
};

export default function CampIndexPage() {
  return <ItinerarySectionView />;
}
