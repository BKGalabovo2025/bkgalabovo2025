import { Metadata } from "next";
import React, { Suspense } from "react";

import { InventoryHeader } from "@/components/inventory/InventoryHeader";
import { InventoryNav } from "@/components/inventory/InventoryNav";

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
      <InventoryHeader />
      <InventoryNav />
      <div className="flex-1 overflow-auto">
        <Suspense fallback={null}>{children}</Suspense>
      </div>
    </div>
  );
}
