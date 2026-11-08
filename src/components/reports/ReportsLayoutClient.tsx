"use client";

import React from "react";

import { PageHeader } from "@/components/layout/page-header";
import { ReportsNav } from "@/components/reports/ReportsNav";

interface ReportsLayoutClientProps {
  children: React.ReactNode;
}

export function ReportsLayoutClient({ children }: ReportsLayoutClientProps) {
  return (
    <div className="space-y-4 duration-500 animate-in fade-in">
      <PageHeader
        title="Справки и Анализи"
        description="Генериране на подробни отчети за финансовото състояние, посещаемостта и инвентара."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Справки", href: "/reports" },
        ]}
      />

      <div className="sticky top-16 z-20 -mx-1 backdrop-blur-md sm:top-20 p-1">
        <ReportsNav />
      </div>

      <div className="duration-300 animate-in fade-in-50">{children}</div>
    </div>
  );
}
