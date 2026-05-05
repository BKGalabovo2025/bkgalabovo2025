// src/app/(protected)/finances/prices/page.tsx
export const dynamic = "force-dynamic";

import { getAllPrices } from "@/services/price-service";
import { PricesClientPage } from "./client-page";
import { PageHeader } from "@/components/layout/page-header";

export default async function PricesPage() {
  const prices = await getAllPrices();

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <PageHeader
        title="Управление на цени"
        description="Преглед и актуализация на цените за всички услуги и абонаменти в клуба. Всяка промяна се записва в историята."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Финанси", href: "/finances" },
          { label: "Цени" },
        ]}
      />

      <div className="bg-white dark:bg-zinc-950 rounded-[32px] shadow-xl shadow-blue-900/5 border border-slate-100 dark:border-zinc-800 overflow-hidden">
        <div className="p-8">
          <PricesClientPage initialPrices={prices} />
        </div>
      </div>
    </div>
  );
}
