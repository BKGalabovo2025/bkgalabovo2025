import { Metadata } from "next";
import React, { Suspense } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { AnnualPlansNav } from "@/components/training/annual-plans/AnnualPlansNav";

export const metadata: Metadata = {
  title: "Едногодишни Планове | Тренировъчен процес",
  description:
    "BWF Периодизация, макроцикли и тренировъчни шаблони за развитие на състезатели.",
};

export default function AnnualPlansLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-24 duration-700 animate-in fade-in">
      <PageHeader
        title="Едногодишни Планове (BWF)"
        description="Макроцикли, мезоцикли и микроцикли за периодизация на състезателната подготовка."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Тренировки", href: "/training/planner" },
          { label: "Годишни планове" },
        ]}
      />
      <Suspense fallback={null}>
        <AnnualPlansNav />
      </Suspense>
      <main className="space-y-6">
        <Suspense fallback={null}>{children}</Suspense>
      </main>
    </div>
  );
}
