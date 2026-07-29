"use client";

import { UseFormReturn } from "react-hook-form";
import { BentoCard } from "@/components/ui/bento-card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, Users, Activity, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Simple visual checkbox that avoids Radix compose-refs React 19 bug
function VisualCheckbox({
  checked,
  className,
}: {
  checked?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-sm border border-zinc-300",
        checked ? "border-zinc-950 bg-zinc-950" : "bg-white",
        className
      )}
    >
      {checked && (
        <Check
          className="text-white"
          strokeWidth={3}
          style={{ width: "70%", height: "70%" }}
        />
      )}
    </div>
  );
}

import { MemberFormValues } from "./member-form-types";
import { DateSelectorField } from "./DateSelectorField";

interface MemberFormStep1Props {
  form: UseFormReturn<MemberFormValues>;
  isActive: boolean;
  isRecoveryBranch: boolean;
}

export function MemberFormStep1({
  form,
  isActive,
  isRecoveryBranch,
}: MemberFormStep1Props) {
  if (!isActive) return null;

  const isClubMember = form.watch("isClubMember");
  const isRecoveryMember = form.watch("isRecoveryMember");
  const isGuest = form.watch("isGuest");
  const isCoach = form.watch("isCoach");
  const isGuestOnly = isGuest && !isClubMember && !isRecoveryMember && !isCoach;

  return (
    <BentoCard className="rounded-3xl border-zinc-100 p-5 shadow-none duration-300 animate-in fade-in slide-in-from-right-4 sm:rounded-4xl sm:p-8">
      {!isRecoveryBranch && (
        <div className="mb-8 border-b border-zinc-100 pb-8">
          <FormLabel className="mb-4 block text-[10px] font-medium tracking-[0.2em] text-zinc-500 uppercase sm:text-[11px]">
            Роли на профила (може да изберете повече от една) *
          </FormLabel>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div
              onClick={() =>
                form.setValue("isClubMember", !isClubMember, {
                  shouldValidate: true,
                })
              }
              className={cn(
                "relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 p-4 transition-all",
                isClubMember
                  ? "border-zinc-950 bg-zinc-50 dark:border-white dark:bg-zinc-900"
                  : "border-zinc-100 bg-white hover:border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950"
              )}
            >
              <div className="absolute top-3 right-3">
                <VisualCheckbox checked={isClubMember} />
              </div>
              <Users
                className={cn(
                  "mb-2 size-6",
                  isClubMember
                    ? "text-zinc-950 dark:text-white"
                    : "text-zinc-400"
                )}
              />
              <span
                className={cn(
                  "text-xs font-semibold tracking-wider uppercase",
                  isClubMember
                    ? "text-zinc-950 dark:text-white"
                    : "text-zinc-500"
                )}
              >
                Клубен Член
              </span>
              <span className="mt-1 text-center text-[10px] text-zinc-400">
                Пълно досие с документи
              </span>
            </div>

            <div
              onClick={() =>
                form.setValue("isRecoveryMember", !isRecoveryMember, {
                  shouldValidate: true,
                })
              }
              className={cn(
                "relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 p-4 transition-all",
                isRecoveryMember
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
                  : "border-zinc-100 bg-white hover:border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950"
              )}
            >
              <div className="absolute top-3 right-3">
                <VisualCheckbox checked={isRecoveryMember} />
              </div>
              <Activity
                className={cn(
                  "mb-2 size-6",
                  isRecoveryMember
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-zinc-400"
                )}
              />
              <span
                className={cn(
                  "text-xs font-semibold tracking-wider uppercase",
                  isRecoveryMember
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-zinc-500"
                )}
              >
                Възстановяване
              </span>
              <span className="mt-1 text-center text-[10px] text-zinc-400">
                Досие + Здравен статус
              </span>
            </div>

            <div
              onClick={() =>
                form.setValue("isGuest", !isGuest, { shouldValidate: true })
              }
              className={cn(
                "relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 p-4 transition-all",
                isGuest
                  ? "border-amber-500 bg-amber-50 dark:bg-amber-950/20"
                  : "border-zinc-100 bg-white hover:border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950"
              )}
            >
              <div className="absolute top-3 right-3">
                <VisualCheckbox checked={isGuest} />
              </div>
              <User
                className={cn(
                  "mb-2 size-6",
                  isGuest
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-zinc-400"
                )}
              />
              <span
                className={cn(
                  "text-xs font-semibold tracking-wider uppercase",
                  isGuest
                    ? "text-amber-700 dark:text-amber-400"
                    : "text-zinc-500"
                )}
              >
                Външен / Гост
              </span>
              <span className="mt-1 text-center text-[10px] text-zinc-400">
                Бърз профил (име и телефон)
              </span>
            </div>
            <div
              onClick={() =>
                form.setValue("isCoach", !isCoach, { shouldValidate: true })
              }
              className={cn(
                "relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 p-4 transition-all",
                isCoach
                  ? "border-amber-500 bg-amber-50 dark:bg-amber-950/20"
                  : "border-zinc-100 bg-white hover:border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950"
              )}
            >
              <div className="absolute top-3 right-3">
                <VisualCheckbox checked={!!isCoach} />
              </div>
              <Activity
                className={cn(
                  "mb-2 size-6",
                  isCoach
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-zinc-400"
                )}
              />
              <span
                className={cn(
                  "text-xs font-semibold tracking-wider uppercase",
                  isCoach
                    ? "text-amber-700 dark:text-amber-400"
                    : "text-zinc-500"
                )}
              >
                Треньор
              </span>
              <span className="mt-1 text-center text-[10px] text-zinc-400">
                Треньорски права
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex items-center gap-2">
        <User className="size-4 text-zinc-400" strokeWidth={1.5} />
        <h3 className="text-[10px] font-medium tracking-[0.2em] text-zinc-400 uppercase sm:text-[11px]">
          Стъпка 1: Основна информация
        </h3>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
        <FormField
          name="firstName"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-medium tracking-[0.2em] text-zinc-500 uppercase sm:text-[11px]">
                Име *
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="h-11 rounded-xl border-zinc-100 bg-zinc-50/50 text-sm focus:bg-white focus:ring-0 sm:h-12"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="lastName"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-medium tracking-[0.2em] text-zinc-500 uppercase sm:text-[11px]">
                Фамилия *
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="h-11 rounded-xl border-zinc-100 bg-zinc-50/50 text-sm focus:bg-white focus:ring-0 sm:h-12"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {isClubMember && (
          <FormField
            name="middleName"
            control={form.control}
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel className="text-[10px] font-medium tracking-[0.2em] text-zinc-500 uppercase sm:text-[11px]">
                  Презиме
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value || ""}
                    className="h-11 rounded-xl border-zinc-100 bg-zinc-50/50 text-sm focus:bg-white focus:ring-0 sm:h-12"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {!isGuestOnly && (
          <>
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-medium tracking-[0.2em] text-zinc-500 uppercase sm:text-[11px]">
                    Пол
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <SelectTrigger className="h-11 rounded-xl border-zinc-100 bg-zinc-50/50 text-sm focus:bg-white focus:ring-0 sm:h-12">
                      <SelectValue placeholder="Изберете пол" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-zinc-100">
                      <SelectItem value="male">Мъж</SelectItem>
                      <SelectItem value="female">Жена</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DateSelectorField
              control={form.control}
              name="dateOfBirth"
              label="Дата на раждане"
              yearCount={90}
            />
            <DateSelectorField
              control={form.control}
              name="registrationDate"
              label="Дата на регистрация (Опц.)"
              yearCount={10}
            />
          </>
        )}
      </div>

      {/* --- ADDED FOR PUBLIC TEAM PAGE --- */}
      {isClubMember && (
        <div className="mt-8 grid grid-cols-1 gap-5 border-t border-zinc-100 pt-8 sm:grid-cols-2 sm:gap-6 dark:border-zinc-800">
          <FormField
            name="avatarUrl"
            control={form.control}
            render={({ field }) => (
              <FormItem className="sm:col-span-1">
                <FormLabel className="text-[10px] font-medium tracking-[0.2em] text-zinc-500 uppercase sm:text-[11px]">
                  Снимка за профила (път)
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value || ""}
                    placeholder="напр. /team/ivan.jpg"
                    className="h-11 rounded-xl border-zinc-100 bg-zinc-50/50 text-sm focus:bg-white focus:ring-0 sm:h-12"
                  />
                </FormControl>
                <p className="mt-1.5 text-[11px] leading-relaxed font-medium text-amber-600/80">
                  Важно: Името на файла трябва да е на латиница, без интервали
                  (напр. veronika.jpg). Снимката трябва да е предварително
                  качена в папка public/team/.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          {(() => {
            const showOnPublicTeam = form.watch("showOnPublicTeam");
            return (
              <div
                className="mt-auto flex h-auto min-h-11 cursor-pointer flex-row items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 sm:col-span-1 sm:min-h-12"
                onClick={() =>
                  form.setValue("showOnPublicTeam", !showOnPublicTeam, {
                    shouldValidate: true,
                  })
                }
              >
                <div className="space-y-1">
                  <p className="text-[11px] font-medium text-zinc-700">
                    Показвай в публичния отбор
                  </p>
                  <p className="text-[10px] leading-relaxed font-normal text-zinc-400">
                    Ако е избрано, ще се показва на страница /club/team.
                  </p>
                </div>
                <VisualCheckbox
                  checked={showOnPublicTeam}
                  className="pointer-events-none size-5 data-checked:bg-emerald-500"
                />
              </div>
            );
          })()}
        </div>
      )}
    </BentoCard>
  );
}
