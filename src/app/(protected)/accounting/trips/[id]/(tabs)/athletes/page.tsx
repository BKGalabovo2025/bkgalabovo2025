import { Metadata } from "next";

import { TripAthletesView } from "@/components/business-trips/details/views/TripAthletesView";

export const metadata: Metadata = {
  title: "Състезатели & Подписи | Командировка",
  description: "Пътуващи състезатели и електронни подписи за пътуването.",
};

export default function TripAthletesPage() {
  return <TripAthletesView />;
}
