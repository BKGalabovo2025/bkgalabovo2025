import { Metadata } from "next";
import React, { Suspense } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { TheoryNav } from "@/components/training/theory/TheoryNav";

export const metadata: Metadata = {
  title: "Теория и Викторини | Тренировъчен процес",
  description:
    "Детска бадминтон академия — конструктор на тестове, теоретични въпроси и система за рецензия.",
};

export default function TheoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-24 duration-700 animate-in fade-in">
      <PageHeader
        title="Теория и Викторини"
        description="Конструктор на интерактивни тестове, правила на бадминтона, тактика и проверка на знанията."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Тренировки", href: "/training/planner" },
          { label: "Теория" },
        ]}
      />
      <Suspense fallback={null}>
        <TheoryNav />
      </Suspense>
      <main className="space-y-6">
        <Suspense fallback={null}>{children}</Suspense>
      </main>
    </div>
  );
}
