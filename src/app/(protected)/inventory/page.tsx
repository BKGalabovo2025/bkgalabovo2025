import InventoryClient from "./InventoryClient";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

export default function InventoryPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <PageHeader
        title="Склад и наличности"
        description="Управление на продуктите в клуба, проследяване на количества, размери и доставки."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Склад" },
        ]}
      />

      <div className="bg-white dark:bg-zinc-950 rounded-[32px] shadow-xl shadow-blue-900/5 border border-slate-100 dark:border-zinc-800 overflow-hidden">
        <div className="p-8">
          <InventoryClient />
        </div>
      </div>
    </div>
  );
}
