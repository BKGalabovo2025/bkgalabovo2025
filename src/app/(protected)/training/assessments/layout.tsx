import { Metadata } from "next";
import React, { Suspense } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { AssessmentsNav } from "@/components/training/assessments/AssessmentsNav";

export const metadata: Metadata = {
  title: "Тестове и Оценяване | Тренировъчен процес",
  description:
    "Бадминтон тестове по методиката на BWF за различни възрастови групи.",
};

export default function AssessmentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-24 duration-700 animate-in fade-in">
      <PageHeader
        title="Тестове и Оценяване (BWF)"
        description="Официална методика на Световната федерация по бадминтон (BWF) за оценка на физически и технически качества."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Тренировки", href: "/training/planner" },
          { label: "Оценяване (BWF)" },
        ]}
      />
      <Suspense fallback={null}>
        <AssessmentsNav />
      </Suspense>
      <main className="space-y-6">
        <Suspense fallback={null}>{children}</Suspense>
      </main>
    </div>
  );
}
