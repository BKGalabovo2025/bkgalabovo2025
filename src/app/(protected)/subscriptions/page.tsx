import SubscriptionsClient from "./SubscriptionsClient";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

export default function SubscriptionsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <PageHeader
        title="Абонаменти"
        description="Управление на членските планове, проследяване на валидност и автоматизиране на месечните такси."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Абонаменти" },
        ]}
      />

      <div className="bg-white dark:bg-zinc-950 rounded-[32px] shadow-xl shadow-blue-900/5 border border-slate-100 dark:border-zinc-800 overflow-hidden">
        <div className="p-8">
          <SubscriptionsClient />
        </div>
      </div>
    </div>
  );
}
