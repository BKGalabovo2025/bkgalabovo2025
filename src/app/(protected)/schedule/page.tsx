import ScheduleClient from "./ScheduleClient";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

export default function SchedulePage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <PageHeader
        title="Тренировъчен график"
        description="Преглед и управление на седмичния график за тренировки и групови занимания."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "График" },
        ]}
      />

      <div className="bg-white dark:bg-zinc-950 rounded-[32px] shadow-xl shadow-blue-900/5 border border-slate-100 dark:border-zinc-800 overflow-hidden">
        <div className="p-0">
          <ScheduleClient />
        </div>
      </div>
    </div>
  );
}
