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
function VisualCheckbox({ checked, className }: { checked?: boolean; className?: string }) {
  return (
    <div className={cn(
      "shrink-0 rounded-sm border border-zinc-300 flex items-center justify-center",
      checked ? "bg-zinc-950 border-zinc-950" : "bg-white",
      className
    )}>
      {checked && <Check className="text-white" strokeWidth={3} style={{ width: "70%", height: "70%" }} />}
    </div>
  );
}

import { MemberFormValues } from "./member-form";

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
  const isGuestOnly = isGuest && !isClubMember && !isRecoveryMember;

  return (
    <BentoCard className="p-5 sm:p-8 border-zinc-100 shadow-none rounded-3xl sm:rounded-4xl animate-in fade-in slide-in-from-right-4 duration-300">
      {!isRecoveryBranch && (
        <div className="mb-8 pb-8 border-b border-zinc-100">
          <FormLabel className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500 block mb-4">
            Роли на профила (може да изберете повече от една) *
          </FormLabel>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              onClick={() => form.setValue("isClubMember", !isClubMember, { shouldValidate: true })}
              className={cn(
                "cursor-pointer flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all relative",
                isClubMember
                  ? "border-zinc-950 bg-zinc-50 dark:border-white dark:bg-zinc-900"
                  : "border-zinc-100 hover:border-zinc-200 bg-white dark:bg-zinc-950 dark:border-zinc-800"
              )}
            >
              <div className="absolute top-3 right-3">
                <VisualCheckbox checked={isClubMember} />
              </div>
              <Users
                className={cn(
                  "h-6 w-6 mb-2",
                  isClubMember
                    ? "text-zinc-950 dark:text-white"
                    : "text-zinc-400"
                )}
              />
              <span
                className={cn(
                  "text-xs font-semibold uppercase tracking-wider",
                  isClubMember
                    ? "text-zinc-950 dark:text-white"
                    : "text-zinc-500"
                )}
              >
                Клубен Член
              </span>
              <span className="text-[10px] text-zinc-400 text-center mt-1">
                Пълно досие с документи
              </span>
            </div>

            <div
              onClick={() => form.setValue("isRecoveryMember", !isRecoveryMember, { shouldValidate: true })}
              className={cn(
                "cursor-pointer flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all relative",
                isRecoveryMember
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
                  : "border-zinc-100 hover:border-zinc-200 bg-white dark:bg-zinc-950 dark:border-zinc-800"
              )}
            >
              <div className="absolute top-3 right-3">
                <VisualCheckbox checked={isRecoveryMember} />
              </div>
              <Activity
                className={cn(
                  "h-6 w-6 mb-2",
                  isRecoveryMember
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-zinc-400"
                )}
              />
              <span
                className={cn(
                  "text-xs font-semibold uppercase tracking-wider",
                  isRecoveryMember
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-zinc-500"
                )}
              >
                Възстановяване
              </span>
              <span className="text-[10px] text-zinc-400 text-center mt-1">
                Досие + Здравен статус
              </span>
            </div>

            <div
              onClick={() => form.setValue("isGuest", !isGuest, { shouldValidate: true })}
              className={cn(
                "cursor-pointer flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all relative",
                isGuest
                  ? "border-amber-500 bg-amber-50 dark:bg-amber-950/20"
                  : "border-zinc-100 hover:border-zinc-200 bg-white dark:bg-zinc-950 dark:border-zinc-800"
              )}
            >
              <div className="absolute top-3 right-3">
                <VisualCheckbox checked={isGuest} />
              </div>
              <User
                className={cn(
                  "h-6 w-6 mb-2",
                  isGuest
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-zinc-400"
                )}
              />
              <span
                className={cn(
                  "text-xs font-semibold uppercase tracking-wider",
                  isGuest
                    ? "text-amber-700 dark:text-amber-400"
                    : "text-zinc-500"
                )}
              >
                Външен / Гост
              </span>
              <span className="text-[10px] text-zinc-400 text-center mt-1">
                Бърз профил (име и телефон)
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-6">
        <User className="h-4 w-4 text-zinc-400" strokeWidth={1.5} />
        <h3 className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-400">
          Стъпка 1: Основна информация
        </h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
        <FormField
          name="firstName"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                Име *
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="h-11 sm:h-12 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0 text-sm"
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
              <FormLabel className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                Фамилия *
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="h-11 sm:h-12 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0 text-sm"
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
                <FormLabel className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                  Презиме
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value || ""}
                    className="h-11 sm:h-12 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0 text-sm"
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
                  <FormLabel className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                    Пол
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <SelectTrigger className="h-11 sm:h-12 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0 text-sm">
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
            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => {
                const years = Array.from({ length: 90 }, (_, i) =>
                  (new Date().getFullYear() - i).toString()
                );
                const months = [
                  { value: "01", label: "Януари" },
                  { value: "02", label: "Февруари" },
                  { value: "03", label: "Март" },
                  { value: "04", label: "Април" },
                  { value: "05", label: "Май" },
                  { value: "06", label: "Юни" },
                  { value: "07", label: "Юли" },
                  { value: "08", label: "Август" },
                  { value: "09", label: "Септември" },
                  { value: "10", label: "Октомври" },
                  { value: "11", label: "Ноември" },
                  { value: "12", label: "Декември" },
                ];
                const days = Array.from({ length: 31 }, (_, i) =>
                  (i + 1).toString().padStart(2, "0")
                );

                let curYear = "";
                let curMonth = "";
                let curDay = "";

                if (field.value) {
                  const val: unknown = field.value;
                  let valStr = String(val);
                  if (typeof val === "string") {
                    valStr = val.split("T")[0];
                  } else if (
                    val &&
                    typeof (val as { toDate?: () => Date }).toDate ===
                      "function"
                  ) {
                    valStr = (val as { toDate: () => Date })
                      .toDate()
                      .toISOString()
                      .split("T")[0];
                  } else if (val instanceof Date) {
                    valStr = val.toISOString().split("T")[0];
                  }
                  const parts = valStr.split("-");
                  curYear = parts[0] || "";
                  curMonth = parts[1] || "";
                  curDay = parts[2] || "";
                }

                const updateDate = (y: string, m: string, d: string) => {
                  if (!y) {
                    field.onChange(null);
                    return;
                  }
                  let val = y;
                  if (m) {
                    val += `-${m}`;
                    if (d) val += `-${d}`;
                  }
                  field.onChange(val);
                };

                return (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500 mt-0.5 mb-1.5">
                      Дата на раждане
                    </FormLabel>
                    <div className="grid grid-cols-3 gap-2">
                      <Select
                        onValueChange={(v) => updateDate(v, curMonth, curDay)}
                        value={curYear || ""}
                      >
                          <SelectTrigger className="h-11 sm:h-12 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0 text-sm">
                            <SelectValue placeholder="Година" />
                          </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {years.map((y) => (
                            <SelectItem key={y} value={y}>
                              {y}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        onValueChange={(v) =>
                          updateDate(curYear, v === "none" ? "" : v, curDay)
                        }
                        value={curMonth || "none"}
                      >
                          <SelectTrigger className="h-11 sm:h-12 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0 text-sm">
                            <SelectValue placeholder="Месец" />
                          </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Месец</SelectItem>
                          {months.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        onValueChange={(v) =>
                          updateDate(curYear, curMonth, v === "none" ? "" : v)
                        }
                        value={curDay || "none"}
                        disabled={!curMonth}
                      >
                          <SelectTrigger className="h-11 sm:h-12 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0 text-sm">
                            <SelectValue placeholder="Ден" />
                          </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Ден</SelectItem>
                          {days.map((d) => (
                            <SelectItem key={d} value={d}>
                              {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="registrationDate"
              render={({ field }) => {
                const years = Array.from({ length: 10 }, (_, i) =>
                  (new Date().getFullYear() - i).toString()
                );
                const months = [
                  { value: "01", label: "Януари" },
                  { value: "02", label: "Февруари" },
                  { value: "03", label: "Март" },
                  { value: "04", label: "Април" },
                  { value: "05", label: "Май" },
                  { value: "06", label: "Юни" },
                  { value: "07", label: "Юли" },
                  { value: "08", label: "Август" },
                  { value: "09", label: "Септември" },
                  { value: "10", label: "Октомври" },
                  { value: "11", label: "Ноември" },
                  { value: "12", label: "Декември" },
                ];
                const days = Array.from({ length: 31 }, (_, i) =>
                  (i + 1).toString().padStart(2, "0")
                );

                let curYear = "";
                let curMonth = "";
                let curDay = "";

                if (field.value) {
                  const val: unknown = field.value;
                  let valStr = String(val);
                  if (typeof val === "string") {
                    valStr = val.split("T")[0];
                  } else if (
                    val &&
                    typeof (val as { toDate?: () => Date }).toDate ===
                      "function"
                  ) {
                    valStr = (val as { toDate: () => Date })
                      .toDate()
                      .toISOString()
                      .split("T")[0];
                  } else if (val instanceof Date) {
                    valStr = val.toISOString().split("T")[0];
                  }
                  const parts = valStr.split("-");
                  curYear = parts[0] || "";
                  curMonth = parts[1] || "";
                  curDay = parts[2] || "";
                }

                // eslint-disable-next-line sonarjs/no-identical-functions
                const updateDate = (y: string, m: string, d: string) => {
                  if (!y) {
                    field.onChange(null);
                    return;
                  }
                  let val = y;
                  if (m) {
                    val += `-${m}`;
                    if (d) val += `-${d}`;
                  }
                  field.onChange(val);
                };

                return (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500 mt-0.5 mb-1.5">
                      Дата на регистрация (Опц.)
                    </FormLabel>
                    <div className="grid grid-cols-3 gap-2">
                      <Select
                        onValueChange={(v) => updateDate(v, curMonth, curDay)}
                        value={curYear || ""}
                      >
                          <SelectTrigger className="h-11 sm:h-12 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0 text-sm">
                            <SelectValue placeholder="Година" />
                          </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {years.map((y) => (
                            <SelectItem key={y} value={y}>
                              {y}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        onValueChange={(v) =>
                          updateDate(curYear, v === "none" ? "" : v, curDay)
                        }
                        value={curMonth || "none"}
                      >
                          <SelectTrigger className="h-11 sm:h-12 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0 text-sm">
                            <SelectValue placeholder="Месец" />
                          </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Месец</SelectItem>
                          {months.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        onValueChange={(v) =>
                          updateDate(curYear, curMonth, v === "none" ? "" : v)
                        }
                        value={curDay || "none"}
                        disabled={!curMonth}
                      >
                          <SelectTrigger className="h-11 sm:h-12 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0 text-sm">
                            <SelectValue placeholder="Ден" />
                          </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Ден</SelectItem>
                          {days.map((d) => (
                            <SelectItem key={d} value={d}>
                              {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </>
        )}
      </div>

      {/* --- ADDED FOR PUBLIC TEAM PAGE --- */}
      {isClubMember && (
        <div className="mt-8 pt-8 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
          <FormField
            name="avatarUrl"
            control={form.control}
            render={({ field }) => (
              <FormItem className="sm:col-span-1">
                <FormLabel className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                  Снимка за профила (път)
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value || ""}
                    placeholder="напр. /team/ivan.jpg"
                    className="h-11 sm:h-12 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0 text-sm"
                  />
                </FormControl>
                <p className="text-[11px] text-amber-600/80 mt-1.5 leading-relaxed font-medium">
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
                className="flex flex-row items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 sm:col-span-1 h-auto min-h-[44px] sm:min-h-[48px] mt-auto cursor-pointer"
                onClick={() => form.setValue("showOnPublicTeam", !showOnPublicTeam, { shouldValidate: true })}
              >
                <div className="space-y-1">
                  <p className="text-[11px] font-medium text-zinc-700">
                    Показвай в публичния отбор
                  </p>
                  <p className="text-[10px] text-zinc-400 font-normal leading-relaxed">
                    Ако е избрано, ще се показва на страница /club/team.
                  </p>
                </div>
                <VisualCheckbox
                  checked={showOnPublicTeam}
                  className="h-5 w-5 data-checked:bg-emerald-500 pointer-events-none"
                />
              </div>
            );
          })()}
        </div>
      )}
    </BentoCard>
  );
}
