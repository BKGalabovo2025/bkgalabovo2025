"use client";

import { Phone } from "lucide-react";
import { UseFormReturn } from "react-hook-form";

import { BentoCard } from "@/components/ui/bento-card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { MemberFormValues } from "./member-form-types";

interface MemberFormStep2Props {
  form: UseFormReturn<MemberFormValues>;
  isActive: boolean;
}

export function MemberFormStep2({ form, isActive }: MemberFormStep2Props) {
  if (!isActive) return null;

  const isGuest = form.watch("isGuest");
  const isClubMember = form.watch("isClubMember");
  const isRecoveryMember = form.watch("isRecoveryMember");
  const isGuestOnly = isGuest && !isClubMember && !isRecoveryMember;

  const hasEmergencyContact = form.watch("hasEmergencyContact");
  const parentName = form.watch("parentName");
  const parentPhone = form.watch("parentPhone");

  const handleCopyFromParent = () => {
    if (parentName) {
      form.setValue("emergencyContactName", parentName);
    }
    if (parentPhone) {
      form.setValue("emergencyContactPhone", parentPhone);
    }
    form.clearErrors(["emergencyContactName", "emergencyContactPhone"]);
  };

  const handleSelectRole = (role: string) => {
    form.setValue("emergencyContactRole", role);
    if ((role === "mother" || role === "father") && parentName) {
      form.setValue("emergencyContactName", parentName);
      if (parentPhone) {
        form.setValue("emergencyContactPhone", parentPhone);
      }
      form.clearErrors(["emergencyContactName", "emergencyContactPhone"]);
    }
  };

  return (
    <BentoCard className="rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-none duration-300 animate-in fade-in slide-in-from-right-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-4 flex items-center gap-2">
        <Phone className="size-4 text-zinc-400" strokeWidth={1.5} />
        <h3 className="text-[10px] font-medium tracking-[0.2em] text-zinc-400 uppercase sm:text-[11px]">
          Стъпка 2: Контакти
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
        <FormField
          name="phone"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-medium tracking-[0.2em] text-zinc-500 uppercase sm:text-[11px]">
                Телефон
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

        <FormField
          name="email"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-medium tracking-[0.2em] text-zinc-500 uppercase sm:text-[11px]">
                Имейл
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  {...field}
                  value={field.value || ""}
                  className="h-11 rounded-xl border-zinc-100 bg-zinc-50/50 text-sm focus:bg-white focus:ring-0 sm:h-12"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!isGuestOnly && (
          <FormField
            name="address"
            control={form.control}
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel className="text-[10px] font-medium tracking-[0.2em] text-zinc-500 uppercase sm:text-[11px]">
                  Адрес
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

        {/* 1. Родител / Настойник */}
        {!isGuestOnly && (
          <div className="mt-4 border-t border-zinc-100 pt-6 sm:col-span-2">
            <h4 className="mb-2 text-[10px] font-medium tracking-[0.2em] text-zinc-400 uppercase sm:text-[11px]">
              Родител / Настойник (за контакт и родителски портал)
            </h4>
            <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormField
                  name="parentName"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
                        Име и фамилия
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="Име на родител"
                          className="h-10 rounded-xl border-zinc-200 bg-white text-xs focus:bg-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="parentPhone"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
                        Телефон на родител
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="напр. 0888 123 456"
                          className="h-10 rounded-xl border-zinc-200 bg-white text-xs focus:bg-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="parentEmail"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
                        Ел. поща на родител
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          {...field}
                          value={field.value || ""}
                          placeholder="roditel@example.com"
                          className="h-10 rounded-xl border-zinc-200 bg-white text-xs focus:bg-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. Спешен Контакт */}
        {!isGuestOnly && (
          <div className="mt-2 border-t border-zinc-100 pt-6 sm:col-span-2">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="text-[10px] font-medium tracking-[0.2em] text-zinc-400 uppercase sm:text-[11px]">
                  Спешен Контакт
                </h4>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Посочете лице за връзка при спешни случаи.
                </p>
              </div>

              {/* Отметка за включване на спешен контакт */}
              <FormField
                name="hasEmergencyContact"
                control={form.control}
                render={({ field }) => (
                  <label className="flex items-center gap-2 cursor-pointer select-none rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2 text-xs font-semibold text-zinc-800 transition-all hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-200">
                    <Checkbox
                      checked={Boolean(field.value)}
                      onCheckedChange={(checked) => {
                        const val = Boolean(checked);
                        field.onChange(val);
                        if (
                          val &&
                          parentName &&
                          !form.getValues("emergencyContactName")
                        ) {
                          handleCopyFromParent();
                        }
                        if (!val) {
                          form.clearErrors([
                            "emergencyContactName",
                            "emergencyContactPhone",
                          ]);
                        }
                      }}
                      className="size-4"
                    />
                    <span>Посочи лице за спешен контакт</span>
                  </label>
                )}
              />
            </div>

            {hasEmergencyContact ? (
              <div className="rounded-2xl border border-amber-200/80 bg-amber-50/30 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
                {/* Бърз избор / прехвърляне от Родител / Настойник */}
                {parentName && (
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-200/60 bg-blue-50/60 p-3 dark:border-blue-900/40 dark:bg-blue-950/30">
                    <div className="text-xs text-blue-950 dark:text-blue-200">
                      <span className="text-zinc-500 dark:text-zinc-400">
                        Родител от профила:
                      </span>{" "}
                      <strong className="font-bold">{parentName}</strong>{" "}
                      {parentPhone ? (
                        <span className="font-mono">({parentPhone})</span>
                      ) : (
                        ""
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyFromParent}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-blue-500"
                    >
                      📋 Избери този родител за спешен контакт
                    </button>
                  </div>
                )}

                {/* Избор дали това да е Майката или Бащата */}
                <div className="mb-4">
                  <FormLabel className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
                    Кой да бъде спешен контакт? (Майка / Баща / Друг) *
                  </FormLabel>
                  <FormField
                    name="emergencyContactRole"
                    control={form.control}
                    render={({ field }) => (
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {[
                          { id: "mother", label: "👩 Майка" },
                          { id: "father", label: "👨 Баща" },
                          { id: "other", label: "👤 Друг / Настойник" },
                        ].map((role) => {
                          const isSelected =
                            (field.value || "mother") === role.id;
                          return (
                            <button
                              key={role.id}
                              type="button"
                              onClick={() => handleSelectRole(role.id)}
                              className={cn(
                                "rounded-xl px-3 py-1.5 text-xs font-bold transition-all",
                                isSelected
                                  ? "bg-amber-600 text-white shadow-xs"
                                  : "bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                              )}
                            >
                              {role.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    name="emergencyContactName"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-medium tracking-[0.2em] text-zinc-700 uppercase sm:text-[11px] dark:text-zinc-300">
                          Име на контакт *
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            placeholder="Име и фамилия"
                            className="h-10 rounded-xl border-zinc-200 bg-white text-xs focus:bg-white sm:h-11"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="emergencyContactPhone"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-medium tracking-[0.2em] text-zinc-700 uppercase sm:text-[11px] dark:text-zinc-300">
                          Телефон на контакт *
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            placeholder="напр. 0888 123 456"
                            className="h-10 rounded-xl border-zinc-200 bg-white text-xs focus:bg-white sm:h-11"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-zinc-400 italic">
                Не е посочен спешен контакт (полетата не са задължителни).
              </p>
            )}
          </div>
        )}
      </div>
    </BentoCard>
  );
}
