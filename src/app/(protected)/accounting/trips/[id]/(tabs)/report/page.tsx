import { Metadata } from "next";

import { TripReportView } from "@/components/business-trips/details/views/TripReportView";

export const metadata: Metadata = {
  title: "Доклад & Отчет | Командировка",
  description: "Спортно-технически доклад и финансово отчитане.",
};

export default function TripReportPage() {
  return <TripReportView />;
}
