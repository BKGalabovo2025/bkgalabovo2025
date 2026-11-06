"use client";

import React from "react";

import { FeedbackTemplatesTab } from "@/app/(protected)/feedback/components/FeedbackTemplatesTab";
import { useFeedbackContext } from "@/components/feedback/FeedbackContext";

export function TemplatesSectionView() {
  const { templates, campaigns, siteId, loadData } = useFeedbackContext();

  return (
    <FeedbackTemplatesTab
      templates={templates}
      campaigns={campaigns}
      siteId={siteId}
      onRefresh={loadData}
    />
  );
}
