"use client";

import React, { useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { InquiriesTab } from "@/components/schedule/InquiriesTab";
import { useAppStore } from "@/store/use-app-store";

export default function InquiriesPageClient() {
  const [newCount, setNewCount] = useState(0);
  const { activeBranch } = useAppStore();
  const isRecovery = activeBranch === "recoveryzone";

  return (
    <div className="space-y-8 duration-500 animate-in fade-in">
      <PageHeader
        title={isRecovery ? "Запитвания за сесии" : "Запитвания от сайта"}
        description={
          isRecovery
            ? "Преглед и управление на запитванията за възстановителни процедури в Recovery Zone by ZM."
            : "Преглед и управление на запитванията от сайта (Бадминтон клуб Гълъбово & Recovery Zone by ZM)."
        }
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: isRecovery ? "Запитвания за сесии" : "Запитвания от сайта" },
        ]}
      >
        {newCount > 0 && (
          <div className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-500 dark:text-rose-400">
            <span className="size-2 animate-pulse rounded-full bg-rose-500" />
            <span>
              {newCount} {newCount === 1 ? "ново запитване" : "нови запитвания"}
            </span>
          </div>
        )}
      </PageHeader>

      <div className="pt-2">
        <InquiriesTab onNewCountChange={setNewCount} />
      </div>
    </div>
  );
}
