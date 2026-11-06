import { PageHeader } from "@/components/layout/page-header";

import InventoryClient from "./inventory-client";

export default function InventoryPage() {
  return (
    <div className="flex h-full flex-col space-y-6 p-4 sm:p-6 dark:bg-zinc-950">
      <PageHeader
        title="Инвентар и Оборудване"
        description="Управлявайте клубното оборудване и задавайте правила за разпределение по станции."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Инвентар" },
        ]}
      />
      <div className="flex-1 overflow-auto">
        <InventoryClient />
      </div>
    </div>
  );
}
