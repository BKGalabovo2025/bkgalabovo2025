"use client";

import { Inbox, Mail, Search, X } from "lucide-react";
import React from "react";

import { ContactCard } from "@/components/marketing/ContactCard";
import { useMarketingContext } from "@/components/marketing/MarketingContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ContactsSectionView() {
  const {
    filteredContacts,
    selectedContactIds,
    contactSearch,
    contactBranchFilter,
    contactStatusFilter,
    contactSegmentFilter,
    setContactSearch,
    setContactBranchFilter,
    setContactStatusFilter,
    setContactSegmentFilter,
    setCallingContact,
    handleOpenSingleEmail,
    handleOpenBulkEmail,
    toggleSelectAllFiltered,
    handleContactStatusChange,
  } = useMarketingContext();

  return (
    <div className="space-y-3 sm:space-y-3.5 focus-visible:outline-hidden">
      {/* Controls Bar: Filters & Search */}
      <div className="space-y-2.5 rounded-2xl border border-zinc-200 bg-white p-3 sm:p-3.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
            <Input
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              placeholder="Търсене по име, родител, дете, телефон, имейл или бележка..."
              className="h-8.5 rounded-xl pl-8.5 text-xs font-medium"
            />
            {contactSearch && (
              <button
                onClick={() => setContactSearch("")}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Branch Selector */}
          <div className="flex items-center gap-2">
            <Select
              value={contactBranchFilter}
              onValueChange={setContactBranchFilter}
            >
              <SelectTrigger className="h-8.5 w-38 sm:w-42 rounded-xl text-xs font-semibold">
                <SelectValue placeholder="Всички бази" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">🌐 Всички бази</SelectItem>
                <SelectItem value="bkgalabovo">🏸 БК Гълъбово</SelectItem>
                <SelectItem value="recoveryzone">💆 Recovery Zone</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Secondary Filter Chips & Bulk Action */}
        <div className="flex flex-col gap-2 pt-1 border-t border-zinc-100 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Status Filter */}
            <Select
              value={contactStatusFilter}
              onValueChange={setContactStatusFilter}
            >
              <SelectTrigger className="h-7.5 w-32 rounded-lg text-[11px] font-medium">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent className="rounded-xl text-xs">
                <SelectItem value="all">Всички статуси</SelectItem>
                <SelectItem value="pending">⏳ Чакащи контакт</SelectItem>
                <SelectItem value="contacted">📞 Проведен разговор</SelectItem>
                <SelectItem value="confirmed">✅ Потвърдени</SelectItem>
                <SelectItem value="declined">❌ Отказали</SelectItem>
                <SelectItem value="no_answer">📵 Без отговор</SelectItem>
              </SelectContent>
            </Select>

            {/* Segment Filter */}
            <Select
              value={contactSegmentFilter}
              onValueChange={setContactSegmentFilter}
            >
              <SelectTrigger className="h-7.5 w-32 rounded-lg text-[11px] font-medium">
                <SelectValue placeholder="Сегмент" />
              </SelectTrigger>
              <SelectContent className="rounded-xl text-xs">
                <SelectItem value="all">Всички сегменти</SelectItem>
                <SelectItem value="athletes">🏸 Състезатели</SelectItem>
                <SelectItem value="recovery">💆 Recovery Zone</SelectItem>
                <SelectItem value="members">👥 Треньори/Членове</SelectItem>
              </SelectContent>
            </Select>

            {(contactSearch ||
              contactBranchFilter !== "all" ||
              contactStatusFilter !== "all" ||
              contactSegmentFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setContactSearch("");
                  setContactBranchFilter("all");
                  setContactStatusFilter("all");
                  setContactSegmentFilter("all");
                }}
                className="h-7.5 rounded-lg px-2 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                <X className="mr-1 size-3" />
                Изчисти
              </Button>
            )}
          </div>

          {/* Bulk Selection Actions */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-zinc-500">
              Показани: {filteredContacts.length}
            </span>

            {filteredContacts.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectAllFiltered}
                  className="h-7.5 rounded-lg border-zinc-200 text-[11px] font-semibold text-zinc-700 shadow-2xs hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200"
                >
                  {selectedContactIds.size === filteredContacts.length
                    ? "Откажи всички"
                    : "Избери всички"}
                </Button>

                {selectedContactIds.size > 0 && (
                  <Button
                    size="sm"
                    onClick={handleOpenBulkEmail}
                    className="h-7.5 rounded-lg bg-indigo-600 px-3 text-[11px] font-bold text-white shadow-xs hover:bg-indigo-700"
                  >
                    <Mail className="mr-1.5 size-3" />
                    Имейл ({selectedContactIds.size})
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Contacts List Grid */}
      {filteredContacts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 py-12 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
          <Inbox className="mx-auto mb-2 size-8 text-zinc-300 dark:text-zinc-700" />
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
            Няма намерени контакти
          </h3>
          <p className="mx-auto mt-0.5 max-w-sm text-xs text-zinc-500">
            Опитайте да изчистите или промените филтрите за търсене.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 sm:gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filteredContacts.map((contact) => (
            <div key={contact.id} className="group relative">
              <ContactCard
                contact={contact}
                onCallLog={(c) => setCallingContact(c)}
                onEmail={(c) => handleOpenSingleEmail(c)}
                onStatusChange={handleContactStatusChange}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
