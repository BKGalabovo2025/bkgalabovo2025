// src/app/(protected)/finances/prices/page.tsx
export const dynamic = "force-dynamic";

import { getAllPrices } from "@/services/price-service";
import { PricesClientPage } from "./client-page";
import { PageHeader } from "@/components/layout/page-header";

export default async function PricesPage() {
  const prices = await getAllPrices();

  return (
    <div className="space-y-8 pb-12 duration-500 animate-in fade-in">
      <PageHeader
        title="Управление на цени"
        description="Преглед и актуализация на цените за всички услуги и абонаменти в клуба. Всяка промяна се записва в историята."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Каталози", href: "/catalogs" },
          { label: "Цени" },
        ]}
      />

      <div className="overflow-hidden rounded-4xl border border-slate-100 bg-white shadow-xl shadow-blue-900/5 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="p-8">
          <PricesClientPage initialPrices={prices} />
        </div>
      </div>
    </div>
  );
}
