"use client";

import React from "react";

import { FeedbackCampaignsTab } from "@/app/(protected)/feedback/components/FeedbackCampaignsTab";
import { useFeedbackContext } from "@/components/feedback/FeedbackContext";

export function CampaignsSectionView() {
  const { campaigns, templates, events, siteId, loadData } =
    useFeedbackContext();

  return (
    <FeedbackCampaignsTab
      campaigns={campaigns}
      templates={templates}
      events={events}
      siteId={siteId}
      onRefresh={loadData}
    />
  );
}
