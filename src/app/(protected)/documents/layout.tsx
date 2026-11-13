"use client";

import { usePathname } from "next/navigation";
import React from "react";

import {
  DOCUMENT_SECTIONS,
  getActiveDocumentSectionId,
} from "@/components/documents/document-sections";
import { DocumentsNav } from "@/components/documents/DocumentsNav";
import { PageHeader } from "@/components/layout/page-header";

export default function DocumentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const activeSectionId = getActiveDocumentSectionId(pathname);
  const activeSection = DOCUMENT_SECTIONS.find((s) => s.id === activeSectionId);

  const breadcrumbs: { label: string; href?: string }[] = [
    { label: "Начало", href: "/dashboard" },
    { label: "Документи", href: "/documents" },
  ];

  if (activeSection) {
    breadcrumbs.push({ label: activeSection.label });
  }

  return (
    <div className="flex-1 space-y-5 max-w-7xl mx-auto pb-20 duration-700 animate-in fade-in">
      <PageHeader
        title="Документи, Бланки & Регистър"
        description="Централно управление на клубни образци и подписи. Всички редакции обновяват бланките напред във времето, запазвайки пълната юридическа сила на вече подписаните документи."
        breadcrumbs={breadcrumbs}
      />

      {/* Hierarchical Subpage Navigation */}
      <DocumentsNav />

      {/* Subpage View */}
      <main className="space-y-4">{children}</main>
    </div>
  );
}
