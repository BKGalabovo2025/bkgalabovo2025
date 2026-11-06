"use client";

import React from "react";

import { MarketingHistoryTab } from "@/app/(protected)/marketing/components/MarketingHistoryTab";
import { useMarketingContext } from "@/components/marketing/MarketingContext";

export function HistorySectionView() {
  const { history, stats, handleDeleteLog, handleClearHistory } =
    useMarketingContext();

  return (
    <div className="space-y-4 focus-visible:outline-hidden">
      <MarketingHistoryTab
        history={history}
        stats={stats}
        onDeleteLog={handleDeleteLog}
        onClearHistory={handleClearHistory}
      />
    </div>
  );
}
