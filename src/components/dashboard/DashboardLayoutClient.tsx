"use client";

import { RefreshCw } from "lucide-react";
import React from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/language-context";
import { cn } from "@/lib/utils";

import { useDashboardContext } from "./DashboardContext";
import { DashboardNav } from "./DashboardNav";

interface DashboardLayoutClientProps {
  children: React.ReactNode;
}

export function DashboardLayoutClient({
  children,
}: DashboardLayoutClientProps) {
  const { language } = useLanguage();
  const { firstName, displayGreeting, refreshing, handleRefresh } =
    useDashboardContext();

  return (
    <div className="space-y-4 pb-12 duration-500 animate-in fade-in">
      <PageHeader
        title={firstName}
        description={displayGreeting}
        breadcrumbs={[{ label: "Начало" }]}
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="flex size-9 shrink-0 items-center justify-center rounded-xl border-zinc-200 transition-all hover:bg-zinc-50 shadow-2xs dark:border-zinc-800 dark:hover:bg-zinc-800"
            onClick={() => handleRefresh(false)}
            disabled={refreshing}
            aria-label={
              language === "bg" ? "Обнови таблото" : "Refresh dashboard"
            }
            title={language === "bg" ? "Обнови таблото" : "Refresh dashboard"}
          >
            <RefreshCw
              className={cn(
                "size-3.5 text-zinc-600 transition-transform duration-500 dark:text-zinc-300",
                refreshing && "animate-spin"
              )}
            />
          </Button>
        </div>
      </PageHeader>

      {/* Hierarchical Subpage Navigation */}
      <DashboardNav />

      {/* Subpage View Container */}
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
