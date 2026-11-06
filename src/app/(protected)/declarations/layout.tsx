import { Printer } from "lucide-react";
import { Metadata } from "next";
import React from "react";

import { BLANK_DECLARATION_PDF_URL } from "@/components/declarations/declaration-sections";
import { DeclarationsNav } from "@/components/declarations/DeclarationsNav";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Декларации за съгласие | БК Гълъбово",
  description: "Управление и принтиране на декларации за информирано съгласие.",
};

export default function DeclarationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6 pb-12 duration-500 animate-in fade-in">
      <PageHeader
        title="Декларации за съгласие"
        description="Управление и принтиране на декларации за информирано съгласие."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Декларации" },
        ]}
      >
        <Button asChild className="w-full sm:w-auto print:hidden">
          <a
            href={BLANK_DECLARATION_PDF_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Printer className="mr-2 size-4" />
            Разпечатай празен шаблон
          </a>
        </Button>
      </PageHeader>
      <DeclarationsNav />
      <main className="space-y-6">{children}</main>
    </div>
  );
}
