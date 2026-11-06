import { Metadata } from "next";
import React, { Suspense } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { BeepTestNav } from "@/components/training/beep-test/BeepTestNav";

export const metadata: Metadata = {
  title: "Бийп Тест | Тренировъчен процес",
  description:
    "Модул за измерване на аеробния капацитет (VO2 Max) на състезателите.",
};

export default function BeepTestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-24 duration-700 animate-in fade-in">
      <PageHeader
        title="Бийп Тест (VO2 Max)"
        description="Мулти-степенен тест за физическа издръжливост и аеробен капацитет."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Тренировки", href: "/training/planner" },
          { label: "Бийп Тест" },
        ]}
      />
      <Suspense fallback={null}>
        <BeepTestNav />
      </Suspense>
      <main className="space-y-6">
        <Suspense fallback={null}>{children}</Suspense>
      </main>
    </div>
  );
}
