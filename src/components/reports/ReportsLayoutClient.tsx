"use client";

import { Calculator } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

import { PageHeader } from "@/components/layout/page-header";
import {
  getActiveReportSectionId,
  REPORT_SECTIONS,
} from "@/components/reports/report-sections";
import { ReportsNav } from "@/components/reports/ReportsNav";
import { Button } from "@/components/ui/button";

interface ReportsLayoutClientProps {
  children: React.ReactNode;
}

export function ReportsLayoutClient({ children }: ReportsLayoutClientProps) {
  const pathname = usePathname();
  const normalized = pathname?.replace(/\/+$/, "") || "";
  const isSubpage =
    normalized.startsWith("/reports/") && normalized !== "/reports";
  const activeSectionId = isSubpage ? getActiveReportSectionId(pathname) : null;
  const activeSection = activeSectionId
    ? REPORT_SECTIONS.find((s) => s.id === activeSectionId)
    : null;

  const breadcrumbs =
    isSubpage && activeSection
      ? [
          { label: "Начало", href: "/dashboard" },
          { label: "Справки", href: "/reports" },
          { label: activeSection.label },
        ]
      : [{ label: "Начало", href: "/dashboard" }, { label: "Справки" }];

  return (
    <div className="space-y-4 duration-500 animate-in fade-in">
      <PageHeader
        title="Справки и Анализи"
        description="Генериране на подробни отчети за финансовото състояние, посещаемостта и инвентара."
        breadcrumbs={breadcrumbs}
      >
        <Button
          asChild
          variant="outline"
          className="h-10 rounded-xl border-zinc-200 px-4 text-xs font-medium dark:border-zinc-800"
        >
          <Link href="/accounting">
            <Calculator className="mr-2 size-4" strokeWidth={1.5} />
            Счетоводство
          </Link>
        </Button>
      </PageHeader>

      <div className="sticky top-16 z-20 -mx-1 backdrop-blur-md sm:top-20 p-1">
        <ReportsNav />
      </div>

      <div className="duration-300 animate-in fade-in-50">{children}</div>
    </div>
  );
}
