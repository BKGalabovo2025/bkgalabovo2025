import { Metadata } from "next";

import { TripManageView } from "@/components/business-trips/details/views/TripManageView";

export const metadata: Metadata = {
  title: "Управление | Командировка",
  description:
    "Пълен мениджър за управление на командировка, ведомост и документи.",
};

export default function TripManagePage() {
  return <TripManageView />;
}
