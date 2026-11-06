"use client";

import {
  Clock,
  Loader2,
  Mail,
  Megaphone,
  PhoneCall,
  RefreshCw,
  Users,
} from "lucide-react";
import React from "react";

import { PageHeader } from "@/components/layout/page-header";
import { CallLogDialog } from "@/components/marketing/CallLogDialog";
import { QuickEmailDialog } from "@/components/marketing/QuickEmailDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { useMarketingContext } from "./MarketingContext";
import { MarketingNav } from "./MarketingNav";

interface MarketingLayoutClientProps {
  children: React.ReactNode;
}

export function MarketingLayoutClient({
  children,
}: MarketingLayoutClientProps) {
  const {
    siteId,
    idToken,
    isLoading,
    allRecipients,
    kpiData,
    templates,
    callingContact,
    emailingRecipients,
    isEmailDialogOpen,
    setCallingContact,
    setIsEmailDialogOpen,
    setSelectedContactIds,
    loadData,
    handleCallLogged,
  } = useMarketingContext();

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-3 sm:px-6 lg:px-8 pb-12 duration-500 animate-in fade-in">
      {/* 1. Page Header */}
      <PageHeader
        title="Маркетинг & CRM Център"
        description="Директна комуникация, телефонни обаждания и официални имейли до състезатели, родители и клиенти."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Маркетинг & CRM", href: "/marketing" },
        ]}
      />

      {/* Top Banner Toolbar */}
      <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-zinc-200/80 bg-white p-3 sm:p-3.5 shadow-xs sm:flex-row sm:items-center dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-600 to-indigo-700 text-white shadow-xs">
            <Megaphone className="size-4.5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-zinc-950 uppercase sm:text-lg dark:text-white">
              Маркетинг & CRM Център
            </h1>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Телефонни обаждания, брандирани имейли, дневник на комуникацията и
              шаблони
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => loadData()}
            disabled={isLoading}
            className="h-8 rounded-lg border-zinc-200 bg-white px-2.5 text-xs font-semibold text-zinc-700 shadow-xs hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
            title="Презареди данни и шаблони"
          >
            <RefreshCw
              className={`mr-1.5 size-3.5 ${isLoading ? "animate-spin text-indigo-600 dark:text-indigo-400" : ""}`}
            />
            Обнови
          </Button>
          <Badge
            variant="outline"
            className="rounded-lg border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-800 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300"
          >
            {allRecipients.length} обединени контакта
          </Badge>
        </div>
      </div>

      {/* 2. Top KPI Analytics Bar */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        {/* Total Contacts */}
        <Card className="rounded-xl sm:rounded-2xl border-zinc-200/80 bg-white p-2.5 sm:p-3 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                Общо контакти
              </span>
              <div className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">
                {isLoading ? "—" : kpiData.total}
              </div>
            </div>
            <div className="flex size-8.5 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
              <Users className="size-4" />
            </div>
          </div>
        </Card>

        {/* Calls Logged */}
        <Card className="rounded-xl sm:rounded-2xl border-zinc-200/80 bg-white p-2.5 sm:p-3 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                Проведени разговори
              </span>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {isLoading ? "—" : kpiData.calls}
              </div>
            </div>
            <div className="flex size-8.5 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
              <PhoneCall className="size-4" />
            </div>
          </div>
        </Card>

        {/* Emails Sent */}
        <Card className="rounded-xl sm:rounded-2xl border-zinc-200/80 bg-white p-2.5 sm:p-3 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                Изпратени имейли
              </span>
              <div className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {isLoading ? "—" : kpiData.emails}
              </div>
            </div>
            <div className="flex size-8.5 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Mail className="size-4" />
            </div>
          </div>
        </Card>

        {/* Pending Contacts */}
        <Card className="rounded-xl sm:rounded-2xl border-zinc-200/80 bg-white p-2.5 sm:p-3 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                Чакащи за контакт
              </span>
              <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
                {isLoading ? "—" : kpiData.pending}
              </div>
            </div>
            <div className="flex size-8.5 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
              <Clock className="size-4" />
            </div>
          </div>
        </Card>
      </div>

      {/* 3. Navigation Subpages Bar */}
      <div className="sticky top-16 z-20 -mx-1 flex flex-col gap-2 backdrop-blur-md sm:top-20 sm:flex-row sm:items-center sm:justify-between p-1">
        <MarketingNav templatesCount={templates.length} />
      </div>

      {/* 4. Section Content */}
      <div className="duration-300 animate-in fade-in-50">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-blue-600 dark:text-blue-400" />
          </div>
        ) : (
          children
        )}
      </div>

      {/* Call Log Dialog */}
      <CallLogDialog
        contact={callingContact}
        isOpen={Boolean(callingContact)}
        onClose={() => setCallingContact(null)}
        onLogged={handleCallLogged}
      />

      {/* Quick Email Dialog (Single or Group) */}
      <QuickEmailDialog
        recipients={emailingRecipients}
        templates={templates}
        isOpen={isEmailDialogOpen}
        onClose={() => setIsEmailDialogOpen(false)}
        idToken={idToken}
        siteId={siteId}
        onSuccess={() => {
          setSelectedContactIds(new Set());
          loadData();
        }}
      />
    </div>
  );
}
