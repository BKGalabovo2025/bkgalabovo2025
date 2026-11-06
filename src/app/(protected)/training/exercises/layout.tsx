import { Metadata } from "next";
import React, { Suspense } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { ExercisesNav } from "@/components/training/exercises/ExercisesNav";

export const metadata: Metadata = {
  title: "База с Упражнения | Тренировъчен процес",
  description: "Официална база с упражнения от BWF и създаване на собствени.",
};

export default function ExercisesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-24 duration-700 animate-in fade-in">
      <PageHeader
        title="База с Упражнения"
        description="Официални упражнения и твои собствени методики."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Тренировки", href: "/training/planner" },
          { label: "Упражнения" },
        ]}
      />
      <ExercisesNav />
      <main className="space-y-6">
        <Suspense fallback={null}>{children}</Suspense>
      </main>
    </div>
  );
}
