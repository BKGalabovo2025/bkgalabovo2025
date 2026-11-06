import { Metadata } from "next";

import { TripOrderView } from "@/components/business-trips/details/views/TripOrderView";

export const metadata: Metadata = {
  title: "Заповед (PDF) | Командировка",
  description: "Официална заповед за командировка с електронен печат.",
};

export default function TripOrderPage() {
  return <TripOrderView />;
}
