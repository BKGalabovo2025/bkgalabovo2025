import { Metadata } from "next";
import React, { Suspense } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { ShadowNav } from "@/components/training/shadow/ShadowNav";

export const metadata: Metadata = {
  title: "Shadow Training | БК Гълъбово",
  description:
    "Интерактивен треньор за движения по корта и анализ на натоварването.",
};

export default function ShadowLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-24 duration-700 animate-in fade-in">
      <PageHeader
        title="Shadow Training"
        description="Интерактивен треньор за движения по корта и анализ на натоварването."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Тренировки", href: "/training/planner" },
          { label: "Shadow Training" },
        ]}
      />
      <Suspense fallback={null}>
        <ShadowNav />
      </Suspense>
      <main className="space-y-6">
        <Suspense fallback={null}>{children}</Suspense>
      </main>
    </div>
  );
}
