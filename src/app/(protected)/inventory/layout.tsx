import { Metadata } from "next";
import Link from "next/link";
import React, { Suspense } from "react";

import { InventoryNav } from "@/components/inventory/InventoryNav";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Инвентар и Оборудване | БК Гълъбово",
  description:
    "Управлявайте клубното оборудване и задавайте правила за разпределение по станции.",
};

export default function InventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col space-y-6 p-4 sm:p-6 dark:bg-zinc-950">
      <PageHeader
        title="Инвентар и Оборудване"
        description="Управлявайте клубното оборудване и задавайте правила за разпределение по станции."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Инвентар" },
        ]}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-xl text-xs font-semibold dark:border-zinc-800"
          >
            <Link
              href="/catalogs/shop"
              title="Каталог на клубния магазин и стоки"
            >
              Магазин & стоки
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-xl text-xs font-semibold dark:border-zinc-800"
          >
            <Link
              href="/reports/restock"
              title="Отчет за презареждане на наличности"
            >
              Отчет: зареждане
            </Link>
          </Button>
        </div>
      </PageHeader>
      <InventoryNav />
      <div className="flex-1 overflow-auto">
        <Suspense fallback={null}>{children}</Suspense>
      </div>
    </div>
  );
}
