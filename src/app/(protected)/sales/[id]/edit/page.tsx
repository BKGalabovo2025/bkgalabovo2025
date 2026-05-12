import EditSaleClient from "./EditSaleClient";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

export default function EditSalePage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <PageHeader
        title="Редактиране на продажба"
        description="Коригирайте детайлите на съществуваща продажба."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Продажби", href: "/sales" },
          { label: "Редактиране" },
        ]}
      />

      <div className="bg-white dark:bg-zinc-950 rounded-4xl shadow-xl shadow-blue-900/5 border border-slate-100 dark:border-zinc-800 overflow-hidden">
        <div className="p-0">
          <EditSaleClient />
        </div>
      </div>
    </div>
  );
}
