"use client";

import React from "react";

import { FeedbackSubmissionsTab } from "@/app/(protected)/feedback/components/FeedbackSubmissionsTab";
import { useFeedbackContext } from "@/components/feedback/FeedbackContext";

export function SubmissionsSectionView() {
  const { submissions, campaigns, loadData } = useFeedbackContext();

  return (
    <FeedbackSubmissionsTab
      submissions={submissions}
      campaigns={campaigns}
      onRefresh={loadData}
    />
  );
}
