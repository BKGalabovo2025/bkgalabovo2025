"use client";

import { useRouter } from "next/navigation";
import React from "react";

import { MarketingTemplatesTab } from "@/app/(protected)/marketing/components/MarketingTemplatesTab";
import { useMarketingContext } from "@/components/marketing/MarketingContext";

export function TemplatesSectionView() {
  const router = useRouter();
  const {
    templates,
    setSelectedTemplateForComposer,
    handleCreateTemplate,
    handleUpdateTemplate,
    handleDeleteTemplate,
  } = useMarketingContext();

  return (
    <div className="space-y-4 focus-visible:outline-hidden">
      <MarketingTemplatesTab
        templates={templates}
        onSelectTemplate={(tmpl) => {
          setSelectedTemplateForComposer(tmpl);
          router.push("/marketing/composer");
        }}
        onCreateTemplate={handleCreateTemplate}
        onUpdateTemplate={handleUpdateTemplate}
        onDeleteTemplate={handleDeleteTemplate}
      />
    </div>
  );
}
