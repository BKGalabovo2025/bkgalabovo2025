import { Metadata } from "next";

import { TripProtocolView } from "@/components/business-trips/details/views/TripProtocolView";

export const metadata: Metadata = {
  title: "Решение на УС & Протокол | Командировка",
  description: "Протокол и решение на Управителния съвет.",
};

export default function TripProtocolPage() {
  return <TripProtocolView />;
}
