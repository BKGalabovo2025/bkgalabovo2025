import { Metadata } from "next";

import { TripOverviewView } from "@/components/business-trips/details/views/TripOverviewView";

export const metadata: Metadata = {
  title: "Общ преглед | Командировка",
  description: "Основни данни за командировката, ръководител, дати и статус.",
};

export default function TripOverviewPage() {
  return <TripOverviewView />;
}
