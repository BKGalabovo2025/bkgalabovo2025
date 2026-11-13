"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

import {
  getActiveInventorySectionId,
  INVENTORY_SECTIONS,
} from "@/components/inventory/inventory-sections";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

export function InventoryHeader() {
  const pathname = usePathname();
  const normalized = pathname?.replace(/\/+$/, "") || "";
  const isSubpage =
    normalized.startsWith("/inventory/") && normalized !== "/inventory";
  const activeSectionId = isSubpage
    ? getActiveInventorySectionId(pathname)
    : null;
  const activeSection =
    activeSectionId && activeSectionId !== "all"
      ? INVENTORY_SECTIONS.find((s) => s.id === activeSectionId)
      : null;

  const breadcrumbs =
    isSubpage && activeSection
      ? [
          { label: "Начало", href: "/dashboard" },
          { label: "Инвентар", href: "/inventory" },
          { label: activeSection.label },
        ]
      : [{ label: "Начало", href: "/dashboard" }, { label: "Инвентар" }];

  return (
    <PageHeader
      title="Инвентар и Оборудване"
      description="Управлявайте клубното оборудване и задавайте правила за разпределение по станции."
      breadcrumbs={breadcrumbs}
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
  );
}
