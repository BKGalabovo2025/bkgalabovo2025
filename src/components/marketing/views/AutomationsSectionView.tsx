"use client";

import React from "react";

import { MarketingAutomationsTab } from "@/app/(protected)/marketing/components/MarketingAutomationsTab";
import { useMarketingContext } from "@/components/marketing/MarketingContext";

export function AutomationsSectionView() {
  const { automationRules, handleToggleAutomation } = useMarketingContext();

  return (
    <div className="space-y-4 focus-visible:outline-hidden">
      <MarketingAutomationsTab
        rules={automationRules}
        onToggleRule={handleToggleAutomation}
      />
    </div>
  );
}
