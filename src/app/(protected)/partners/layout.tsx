import { Award } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import React, { Suspense } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { PartnersNav } from "@/components/partners/PartnersNav";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Партньори & Спонсори | БК Гълъбово",
  description:
    "Управление на клубни партньори, спонсори, институции, лога и видимост в клубните документи и ваучери.",
};

export default function PartnersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6 pb-12 duration-500 animate-in fade-in">
      <PageHeader
        title="Партньори & Спонсори"
        description="Официални институционални, спортни и търговски партньори на клуба, лога и присъствие в издаваните документи и ваучери."
        breadcrumbs={[
          { label: "Табло", href: "/dashboard" },
          { label: "Управление" },
          { label: "Партньори & Спонсори" },
        ]}
      >
        <Button
          asChild
          variant="outline"
          size="sm"
          className="rounded-xl text-xs font-semibold dark:border-zinc-800"
        >
          <Link
            href="/certificates/issue"
            title="Партньорите се визуализират в дипломите и ваучерите"
          >
            <Award className="mr-1.5 size-3.5" />
            Дипломи & ваучери
          </Link>
        </Button>
      </PageHeader>
      <PartnersNav />
      <main className="space-y-6">
        <Suspense fallback={null}>{children}</Suspense>
      </main>
    </div>
  );
}
