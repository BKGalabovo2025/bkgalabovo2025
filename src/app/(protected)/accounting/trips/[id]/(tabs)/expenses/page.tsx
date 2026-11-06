import { Metadata } from "next";

import { TripExpensesView } from "@/components/business-trips/details/views/TripExpensesView";

export const metadata: Metadata = {
  title: "Разходи & Фактури | Командировка",
  description: "Пълен опис на разходите за гориво, нощувки, дневни и такси.",
};

export default function TripExpensesPage() {
  return <TripExpensesView />;
}
