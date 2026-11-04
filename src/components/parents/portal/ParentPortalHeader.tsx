"use client";

import { Cake, Check, KeyRound, Link2, LogOut, Users } from "lucide-react";
import Image from "next/image";
import React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useParentPortalContext } from "./ParentPortalContext";

export function ParentPortalHeader() {
  const {
    portal,
    copiedLink,
    handleCopyPortalLink,
    setChangePwdOpen,
    handleLogout,
    handleSelectChild,
    isBirthdayToday,
  } = useParentPortalContext();

  const { parent, children, selectedChild, selectedChildId } = portal;

  return (
    <div className="space-y-4">
      {/* ── Top Bento Header Bar ─────────────────────────────────────────── */}
      <header className="rounded-3xl border border-zinc-200/80 bg-white/95 p-4 sm:p-5 shadow-xs backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/90 transition-all">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative size-12 shrink-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xs dark:border-zinc-800 dark:bg-zinc-950">
              <Image
                src="/icons/LOGO.jpg"
                alt="Бадминтон Клуб Гълъбово"
                fill
                sizes="48px"
                className="object-contain p-1"
                priority
              />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-black tracking-wider text-blue-600 uppercase dark:text-blue-400">
                  Родителски портал
                </span>
                <span className="size-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                <span className="text-[11px] text-zinc-500 truncate">
                  СНЦ „Бадминтон клуб Гълъбово“
                </span>
              </div>
              <h1 className="text-lg font-black tracking-tight text-zinc-900 dark:text-white sm:text-xl truncate">
                Здравейте, {parent?.name || "Родител"}!
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Golden Hybrid: Copy direct link button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleCopyPortalLink()}
              className={cn(
                "h-9 gap-1.5 rounded-xl border-zinc-200 text-xs font-semibold shadow-2xs transition-all",
                copiedLink
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
              )}
              title="Копирай директен линк към профила на детето и текущия таб"
            >
              {copiedLink ? (
                <>
                  <Check size={13} className="text-emerald-600" />
                  <span>Копиран!</span>
                </>
              ) : (
                <>
                  <Link2 size={13} className="text-zinc-500" />
                  <span>Копирай линк</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setChangePwdOpen(true)}
              className="h-9 gap-1.5 rounded-xl border-blue-200/80 bg-blue-50/60 text-xs font-semibold text-blue-800 hover:bg-blue-100 dark:border-blue-800/40 dark:bg-blue-950/30 dark:text-blue-300 shadow-2xs"
            >
              <KeyRound size={13} />
              <span className="hidden sm:inline">Смяна на парола</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="h-9 gap-1.5 rounded-xl text-xs font-semibold text-zinc-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
            >
              <LogOut size={13} />
              <span>Изход</span>
            </Button>
          </div>
        </div>

        {/* ── Sibling Switcher (When parent has multiple children) ───────────── */}
        {children.length > 1 && (
          <div className="mt-4 pt-3.5 border-t border-zinc-100 dark:border-zinc-800/80">
            <div className="flex items-center gap-1.5 mb-2 px-1">
              <Users size={12} className="text-zinc-400" />
              <p className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                Деца в семейството ({children.length}):
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {children.map((child) => {
                const isSelected = child.id === selectedChildId;
                return (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => handleSelectChild(child.id)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-2xl border px-3.5 py-2 text-left transition-all cursor-pointer",
                      isSelected
                        ? "border-blue-600 bg-blue-50/80 text-blue-950 shadow-xs ring-2 ring-blue-500/30 dark:border-blue-500 dark:bg-blue-950/50 dark:text-blue-100"
                        : "border-zinc-200/80 bg-zinc-50/70 text-zinc-600 hover:bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-400 dark:hover:bg-zinc-900"
                    )}
                  >
                    <Avatar className="size-7 rounded-xl border border-white dark:border-zinc-800">
                      <AvatarImage
                        src={child.avatarUrl || ""}
                        alt={child.fullName}
                      />
                      <AvatarFallback className="text-[10px] font-bold">
                        {child.firstName[0]}
                        {child.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs font-bold leading-tight">
                        {child.fullName}
                      </p>
                      {child.trainingGroup ? (
                        <p className="text-[9px] text-zinc-400 font-medium">
                          {child.trainingGroup}
                        </p>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* ── Birthday Card 🎉 ────────────────────────────────────────── */}
      {isBirthdayToday && selectedChild && (
        <div className="relative overflow-hidden rounded-3xl border border-amber-300/80 bg-linear-to-r from-amber-50 via-rose-50 to-amber-50 p-5 shadow-xs dark:border-amber-700/50 dark:from-amber-950/30 dark:via-rose-950/20 dark:to-amber-950/30">
          <div className="relative z-10 flex flex-col items-center gap-3.5 text-center sm:flex-row sm:text-left">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md">
              <Cake className="size-6 animate-bounce" />
            </div>
            <div className="space-y-0.5">
              <h2 className="text-base font-black tracking-tight text-amber-950 dark:text-amber-200 sm:text-lg">
                Честит Рожден Ден, {selectedChild.firstName}! 🎂🎈
              </h2>
              <p className="text-xs text-amber-900/80 dark:text-amber-300/80 leading-relaxed font-medium">
                От целия екип на Бадминтон Клуб Гълъбово ти пожелаваме крепко
                здраве, спортен дух, много спечелени геймове и шампионски купи!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
