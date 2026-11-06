import { Metadata } from "next";

import { DashboardOverviewView } from "@/components/dashboard/views/DashboardOverviewView";

export const metadata: Metadata = {
  title: "Общ преглед | Табло - БК Гълъбово",
  description:
    "Ключови показатели (KPI), оборот, дневен график и наличности в реално време.",
};

export default function DashboardOverviewPage() {
  return <DashboardOverviewView />;
}
