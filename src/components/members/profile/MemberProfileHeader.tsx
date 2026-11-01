"use client";

import { ArrowLeft, Pencil, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { useMemberProfileContext } from "./MemberProfileContext";

function getFinancialStatusColor(
  isOverdue: boolean,
  hasLastPayment: boolean
): string {
  if (isOverdue) return "text-rose-600 dark:text-rose-400";
  if (!hasLastPayment) return "text-zinc-500";
  return "text-emerald-600 dark:text-emerald-400";
}

function getFinancialStatusLabel(
  isOverdue: boolean,
  hasLastPayment: boolean
): string {
  if (isOverdue) return "Дължи такса";
  if (!hasLastPayment) return "Няма продажби";
  return "Платено";
}

export function MemberProfileHeader() {
  const router = useRouter();
  const {
    member,
    fullName,
    ageGroup,
    isOverdue,
    overdueReason,
    lastPayment,
    avatarUrl,
    initials,
    setIsAiWorkoutModalOpen,
  } = useMemberProfileContext();

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-6">
        {/* Top Action Bar */}
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row sm:gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={() => router.push("/members")}
                className="h-10 w-full rounded-xl border-zinc-200 bg-white px-5 text-[11px] font-semibold tracking-wider text-zinc-700 uppercase shadow-2xs transition-all hover:bg-zinc-50 hover:text-zinc-950 sm:h-11 sm:w-auto dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <ArrowLeft className="mr-2.5 size-4" strokeWidth={1.75} />{" "}
                Всички членове
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Връщане към пълния регистър на членовете на клуба</p>
            </TooltipContent>
          </Tooltip>

          <div className="flex w-full items-center gap-2.5 sm:w-auto">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setIsAiWorkoutModalOpen(true)}
                  variant="outline"
                  className="h-10 w-full rounded-xl border-blue-200 bg-blue-50/70 px-4 text-[11px] font-semibold tracking-wider text-blue-700 uppercase shadow-2xs transition-all hover:bg-blue-100/80 sm:h-11 sm:w-auto dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/60"
                >
                  <Sparkles className="mr-2 size-4 text-blue-600 dark:text-blue-400" />
                  AI Тренировка
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Генериране на персонализиран тренировъчен план от AI треньора
                </p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  asChild
                  className="h-10 w-full rounded-xl bg-zinc-950 px-6 text-[11px] font-semibold tracking-wider text-white uppercase shadow-2xs transition-all hover:bg-zinc-800 sm:h-11 sm:w-auto dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
                >
                  <Link href={`/members/${member.id}/edit`}>
                    <Pencil className="mr-2 size-4" strokeWidth={1.75} />
                    Редактирай
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Редакция на личните данни, контакти и роля на члена</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Member Profile Hero Bento Card */}
        <div className="overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="relative h-28 w-full bg-linear-to-r from-zinc-100 via-zinc-50 to-zinc-100 sm:h-36 dark:from-zinc-900 dark:via-zinc-800/40 dark:to-zinc-900">
            <div className="absolute inset-0 bg-radial from-transparent to-zinc-100/40 dark:to-zinc-900/40" />
          </div>

          <div className="relative z-10 -mt-12 px-5 pb-6 sm:-mt-16 sm:px-8 sm:pb-8">
            <div className="flex flex-col items-center gap-5 text-center md:flex-row md:items-end md:gap-7 md:text-left">
              {/* Avatar */}
              <div className="group relative">
                <Avatar className="size-28 rounded-3xl border-4 border-white bg-zinc-50 shadow-md ring-1 ring-zinc-200/50 sm:size-36 sm:border-[6px] dark:border-zinc-900 dark:bg-zinc-800 dark:ring-zinc-800">
                  <AvatarImage
                    src={avatarUrl}
                    alt={fullName}
                    className="object-cover"
                  />
                  <AvatarFallback className="flex items-center justify-center bg-zinc-100 text-3xl font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Identity & Badges */}
              <div className="mb-1 flex-1 space-y-2 sm:mb-2 sm:space-y-3">
                <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
                  <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-4xl dark:text-zinc-50">
                    {fullName}
                  </h1>
                  {member.isCoach && (
                    <Badge className="border-none bg-amber-100 px-2.5 py-0.5 text-xs font-semibold tracking-wider text-amber-800 uppercase hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300">
                      Треньор
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-full px-3 py-0.5 text-[10px] font-semibold tracking-wider uppercase",
                          member.status === "active"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
                        )}
                      >
                        <span
                          className={cn(
                            "mr-1.5 inline-block size-1.5 rounded-full",
                            member.status === "active"
                              ? "bg-emerald-500"
                              : "bg-rose-500"
                          )}
                        />
                        {member.status === "active" ? "Активен" : "Неактивен"}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Текущ административен статус на членството в клуба</p>
                    </TooltipContent>
                  </Tooltip>

                  {ageGroup && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="outline"
                          className="rounded-full border-zinc-200 bg-zinc-50 px-3 py-0.5 text-[10px] font-semibold tracking-wider text-zinc-600 uppercase dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-400"
                        >
                          {ageGroup}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Възрастова състезателна група според годината на
                          раждане
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {member.isClubMember && (
                    <Badge
                      variant="outline"
                      className="rounded-full border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-[10px] font-medium text-zinc-500 uppercase dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-400"
                    >
                      БК Гълъбово
                    </Badge>
                  )}
                  {member.isRecoveryMember && (
                    <Badge
                      variant="outline"
                      className="rounded-full border-indigo-200 bg-indigo-50/60 px-2.5 py-0.5 text-[10px] font-medium text-indigo-700 uppercase dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300"
                    >
                      Recovery Zone
                    </Badge>
                  )}
                </div>
              </div>

              {/* Financial Status Bento */}
              <div className="w-full sm:w-auto">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-4 shadow-2xs sm:p-5 md:justify-start md:gap-5 dark:border-zinc-800 dark:bg-zinc-800/40">
                      <div>
                        <p className="mb-1 text-[10px] font-semibold tracking-wider text-zinc-400 uppercase dark:text-zinc-500">
                          Финансов статус
                        </p>
                        <div className="flex items-center gap-2.5">
                          <span
                            className={cn(
                              "text-sm font-bold tracking-wide",
                              getFinancialStatusColor(isOverdue, !!lastPayment)
                            )}
                          >
                            {getFinancialStatusLabel(isOverdue, !!lastPayment)}
                          </span>
                          {lastPayment && (
                            <>
                              <span className="size-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                {lastPayment.toLocaleDateString("bg-BG")}
                              </span>
                            </>
                          )}
                        </div>
                        {overdueReason && (
                          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                            {overdueReason}
                          </p>
                        )}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Информация за заплатени такси и дължими суми към клуба
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
