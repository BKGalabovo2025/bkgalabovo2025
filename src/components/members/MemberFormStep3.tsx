"use client";

import { Check, FileText } from "lucide-react";
import { UseFormReturn } from "react-hook-form";

import { BentoCard } from "@/components/ui/bento-card";
import {
  FormControl,
  FormDescription,
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
import { Textarea } from "@/components/ui/textarea";
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
        "flex shrink-0 items-center justify-center rounded-md border border-zinc-300",
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

interface MemberFormStep3Props {
  form: UseFormReturn<MemberFormValues>;
  isActive: boolean;
}

export function MemberFormStep3({ form, isActive }: MemberFormStep3Props) {
  if (!isActive) return null;

  const isGuest = form.watch("isGuest");
  const isClubMember = form.watch("isClubMember");
  const isRecoveryMember = form.watch("isRecoveryMember");
  const isGuestOnly = isGuest && !isClubMember && !isRecoveryMember;

  if (isGuestOnly) return null;

  return (
    <BentoCard className="rounded-3xl border-zinc-100 p-5 shadow-none duration-300 animate-in fade-in slide-in-from-right-4 sm:rounded-4xl sm:p-8">
      <div className="mb-6 flex items-center gap-2">
        <FileText className="size-4 text-zinc-400" strokeWidth={1.5} />
        <h3 className="text-[10px] font-medium tracking-[0.2em] text-zinc-400 uppercase sm:text-[11px]">
          {isRecoveryMember
            ? "Стъпка 3: Здравно досие и бележки"
            : "Стъпка 3: Допълнителни данни"}
        </h3>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
        {isClubMember && (
          <>
            <FormField
              name="educationInstitution"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-medium tracking-[0.2em] text-zinc-500 uppercase sm:text-[11px]">
                    Учебно заведение
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
              control={form.control}
              name="apparelSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-medium tracking-[0.2em] text-zinc-500 uppercase sm:text-[11px]">
                    Размер екипировка
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ""}
                      placeholder="напр. M, L, XL"
                      className="h-11 rounded-xl border-zinc-100 bg-zinc-50/50 text-sm focus:bg-white focus:ring-0 sm:h-12"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="skillLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-medium tracking-[0.2em] text-zinc-500 uppercase sm:text-[11px]">
                    Ниво на умения
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value || undefined}
                  >
                    <SelectTrigger className="h-11 rounded-xl border-zinc-100 bg-zinc-50/50 text-sm focus:bg-white focus:ring-0 sm:h-12">
                      <SelectValue placeholder="Избери ниво" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-zinc-100">
                      <SelectItem value="beginner">Начално</SelectItem>
                      <SelectItem value="intermediate">Средно</SelectItem>
                      <SelectItem value="advanced">Напреднало</SelectItem>
                      <SelectItem value="professional">
                        Професионално
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="mt-1 text-[10px] leading-relaxed text-zinc-400">
                    Ако изберете &quot;Напреднало&quot; или
                    &quot;Професионално&quot;, в публичния отбор ще излиза като
                    &quot;Състезател&quot;, иначе &quot;Любител&quot;.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-medium tracking-[0.2em] text-zinc-500 uppercase sm:text-[11px]">
                Статус
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger className="h-11 rounded-xl border-zinc-100 bg-zinc-50/50 text-sm focus:bg-white focus:ring-0 sm:h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-zinc-100">
                  <SelectItem value="active">Активен</SelectItem>
                  <SelectItem value="inactive">Неактивен</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {isClubMember &&
          (() => {
            const hasSignedDeclaration = form.watch("hasSignedDeclaration");
            const hasMedicalCertificate = form.watch("hasMedicalCertificate");
            const isLicensed = form.watch("isLicensed");
            return (
              <div className="mt-2 grid grid-cols-1 gap-5 border-t border-zinc-100 pt-6 sm:col-span-2 sm:grid-cols-3 sm:gap-6">
                <div
                  className="flex cursor-pointer flex-row items-start space-y-0 space-x-3 rounded-2xl border border-zinc-100 bg-zinc-50/30 p-4 sm:p-5"
                  onClick={() =>
                    form.setValue(
                      "hasSignedDeclaration",
                      !hasSignedDeclaration,
                      { shouldValidate: true }
                    )
                  }
                >
                  <VisualCheckbox
                    checked={hasSignedDeclaration}
                    className="size-5"
                  />
                  <div className="space-y-1 leading-none">
                    <p className="text-sm font-medium text-zinc-950">
                      Декларация
                    </p>
                    <p className="text-[10px] font-light tracking-wider text-zinc-400 uppercase">
                      Подписана декларация
                    </p>
                  </div>
                </div>
                <div
                  className="flex cursor-pointer flex-row items-start space-y-0 space-x-3 rounded-2xl border border-zinc-100 bg-zinc-50/30 p-4 sm:p-5"
                  onClick={() =>
                    form.setValue(
                      "hasMedicalCertificate",
                      !hasMedicalCertificate,
                      { shouldValidate: true }
                    )
                  }
                >
                  <VisualCheckbox
                    checked={hasMedicalCertificate}
                    className="size-5"
                  />
                  <div className="space-y-1 leading-none">
                    <p className="text-sm font-medium text-zinc-950">
                      Медицинско
                    </p>
                    <p className="text-[10px] font-light tracking-wider text-zinc-400 uppercase">
                      Предадено за годината
                    </p>
                  </div>
                </div>
                <div
                  className="flex cursor-pointer flex-row items-start space-y-0 space-x-3 rounded-2xl border border-zinc-100 bg-zinc-50/30 p-4 sm:p-5"
                  onClick={() =>
                    form.setValue("isLicensed", !isLicensed, {
                      shouldValidate: true,
                    })
                  }
                >
                  <VisualCheckbox checked={isLicensed} className="size-5" />
                  <div className="space-y-1 leading-none">
                    <p className="text-sm font-medium text-zinc-950">
                      Картотека
                    </p>
                    <p className="text-[10px] font-light tracking-wider text-zinc-400 uppercase">
                      Картотекиран в БФБ
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

        {(isRecoveryMember || isClubMember) && (
          <div className="mt-2 grid grid-cols-1 gap-5 border-t border-zinc-100 pt-6 sm:col-span-2 sm:grid-cols-2 sm:gap-6">
            {isRecoveryMember && (
              <FormField
                name="healthConditionNotes"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-medium tracking-[0.2em] text-zinc-500 uppercase sm:text-[11px]">
                      Здравно състояние / Предишни травми
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ""}
                        rows={4}
                        placeholder="Опишете предишни травми, операции, алергии или други важни състояния..."
                        className="resize-none rounded-2xl border-zinc-200 bg-white p-4 text-sm shadow-sm focus:border-primary focus:bg-white focus:ring-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              name="notes"
              control={form.control}
              render={({ field }) => (
                <FormItem className={cn(!isRecoveryMember && "sm:col-span-2")}>
                  <FormLabel className="text-[10px] font-medium tracking-[0.2em] text-zinc-500 uppercase sm:text-[11px]">
                    Общи Бележки
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      rows={4}
                      className="resize-none rounded-2xl border-zinc-100 bg-zinc-50/50 p-4 text-sm font-light focus:bg-white focus:ring-0"
                    />
                  </FormControl>
                  <FormDescription className="ml-1 text-[10px] font-light tracking-wider text-zinc-400 uppercase">
                    Вътрешни бележки, видими само за администратори.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
      </div>
    </BentoCard>
  );
}
