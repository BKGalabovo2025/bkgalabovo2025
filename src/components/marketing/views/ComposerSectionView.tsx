"use client";

import React from "react";

import { MarketingComposerTab } from "@/app/(protected)/marketing/components/MarketingComposerTab";
import { useMarketingContext } from "@/components/marketing/MarketingContext";

export function ComposerSectionView() {
  const {
    allRecipients,
    templates,
    selectedTemplateForComposer,
    handleSendBatch,
    isSending,
    idToken,
    siteId,
  } = useMarketingContext();

  return (
    <div className="space-y-4 focus-visible:outline-hidden">
      <MarketingComposerTab
        recipients={allRecipients}
        templates={templates}
        selectedTemplate={selectedTemplateForComposer}
        onSendBatch={handleSendBatch}
        isSending={isSending}
        idToken={idToken}
        siteId={siteId}
      />
    </div>
  );
}
