import { Metadata } from "next";
import React, { Suspense } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { PlannerNav } from "@/components/training/planner/PlannerNav";

export const metadata: Metadata = {
  title: "Универсален Планировчик | Тренировъчен процес",
  description:
    "Планиране на тренировъчни сесии, лагери и проследяване на присъствия.",
};

export default function PlannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-24 duration-700 animate-in fade-in">
      <PageHeader
        title="Тренировъчен Планировчик"
        description="Планиране на тренировки, упражнения, структуриране на натоварването и история на проведените сесии."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Тренировки", href: "/training/planner" },
          { label: "Планировчик" },
        ]}
      />
      <Suspense fallback={null}>
        <PlannerNav />
      </Suspense>
      <main className="space-y-6">
        <Suspense fallback={null}>{children}</Suspense>
      </main>
    </div>
  );
}
