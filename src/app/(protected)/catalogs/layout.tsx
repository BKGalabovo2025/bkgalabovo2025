import { ArrowUpRight } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import React from "react";

import { CatalogsNav } from "@/components/catalogs/CatalogsNav";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Клубни Каталози | БК Гълъбово",
  description:
    "Управление на ценоразписи, тренировъчни програми, клубни услуги, възстановяване и магазин.",
};

export default function CatalogsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6 pb-24 duration-700 animate-in fade-in">
      {/* Page Header with Direct Navigation to Sales */}
      <PageHeader
        title="Клубни Каталози"
        description="Управление на ценоразписи, тренировъчни програми, клубни услуги, възстановяване и магазин."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Каталози" },
        ]}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-xl border-zinc-200 text-xs font-semibold hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            <Link
              href="/sales"
              title="Отвори цялостния финансов дневник на продажбите"
            >
              <span>Дневник продажби</span>
              <ArrowUpRight className="ml-1 size-3.5 text-zinc-400" />
            </Link>
          </Button>
        </div>
      </PageHeader>

      {/* Primary Section Navigation */}
      <CatalogsNav />

      {/* Subpage View */}
      <main className="space-y-6">{children}</main>
    </div>
  );
}
