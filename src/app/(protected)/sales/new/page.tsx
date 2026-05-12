import NewSaleClient from "./NewSaleClient";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

export default function NewSalePage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <PageHeader
        title="Нова продажба"
        description="Регистрирайте нова продажба на стока или услуга от инвентара."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Продажби", href: "/sales" },
          { label: "Нова продажба" },
        ]}
      />

      <div className="bg-white dark:bg-zinc-950 rounded-4xl shadow-xl shadow-blue-900/5 border border-slate-100 dark:border-zinc-800 overflow-hidden">
        <div className="p-0">
          <NewSaleClient />
        </div>
      </div>
    </div>
  );
}
