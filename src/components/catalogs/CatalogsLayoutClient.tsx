"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

import { CatalogsNav } from "@/components/catalogs/CatalogsNav";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

interface CatalogsLayoutClientProps {
  children: React.ReactNode;
}

export function CatalogsLayoutClient({ children }: CatalogsLayoutClientProps) {
  const pathname = usePathname();

  // /catalogs/recovery/new and /catalogs/recovery/[id]/edit render their own dedicated PageHeader
  // with breadcrumb trail to the specific action.
  const isDedicatedFormPage =
    pathname === "/catalogs/recovery/new" ||
    Boolean(
      pathname?.startsWith("/catalogs/recovery/") && pathname?.endsWith("/edit")
    );

  if (isDedicatedFormPage) {
    return (
      <div className="space-y-6 pb-24 duration-700 animate-in fade-in">
        <main className="space-y-6">{children}</main>
      </div>
    );
  }

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
