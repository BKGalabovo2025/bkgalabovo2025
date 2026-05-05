import ReservationsClient from "./ReservationsClient";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

export default function ReservationsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <PageHeader
        title="График и резервации"
        description="Управление на кортовете в реално време. Резервиране на часове за тренировки, свободни игри и събития."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Резервации" },
        ]}
      />

      <div className="bg-white dark:bg-zinc-950 rounded-[32px] shadow-xl shadow-blue-900/5 border border-slate-100 dark:border-zinc-800 overflow-hidden">
        <div className="p-0">
          <ReservationsClient />
        </div>
      </div>
    </div>
  );
}
