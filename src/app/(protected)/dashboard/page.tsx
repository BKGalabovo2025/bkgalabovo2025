import DashboardClient from "./DashboardClient";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Табло - Бадминтон клуб Гълъбово",
  description:
    "Общ преглед на активността, членовете и финансовите показатели на клуба.",
};

export default function DashboardPage() {
  return <DashboardClient />;
}
