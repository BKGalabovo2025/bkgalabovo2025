import { Metadata } from "next";

import { DashboardActivityView } from "@/components/dashboard/views/DashboardActivityView";

export const metadata: Metadata = {
  title: "Активност & Известия | Табло - БК Гълъбово",
  description:
    "Напомняния за плащания и документи, входящи запитвания, рожденици и отзиви.",
};

export default function DashboardActivityPage() {
  return <DashboardActivityView />;
}
