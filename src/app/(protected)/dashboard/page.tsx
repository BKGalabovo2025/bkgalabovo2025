import DashboardClient from "./DashboardClient";
import { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Табло - Бадминтон клуб Гълъбово",
  description:
    "Общ преглед на активността, членовете и финансовите показатели на клуба.",
};

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <PageHeader
        title="Табло за управление"
        description="Добре дошли в административния панел. Тук можете да следите ключовите показатели и активността на клуба в реално време."
        breadcrumbs={[{ label: "Начало" }]}
      />

      <div className="px-0">
        <DashboardClient />
      </div>
    </div>
  );
}
