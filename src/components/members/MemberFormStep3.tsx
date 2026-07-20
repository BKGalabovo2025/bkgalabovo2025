"use client";

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
import { FileText, Check } from "lucide-react";
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
        "shrink-0 rounded-md border border-zinc-300 flex items-center justify-center",
        checked ? "bg-zinc-950 border-zinc-950" : "bg-white",
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
    <BentoCard className="p-5 sm:p-8 border-zinc-100 shadow-none rounded-3xl sm:rounded-4xl animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="h-4 w-4 text-zinc-400" strokeWidth={1.5} />
        <h3 className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-400">
          {isRecoveryMember
            ? "Стъпка 3: Здравно досие и бележки"
            : "Стъпка 3: Допълнителни данни"}
        </h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
        {isClubMember && (
          <>
            <FormField
              name="educationInstitution"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                    Учебно заведение
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
            <FormField
              control={form.control}
              name="apparelSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                    Размер екипировка
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ""}
                      placeholder="напр. M, L, XL"
                      className="h-11 sm:h-12 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0 text-sm"
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
                  <FormLabel className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                    Ниво на умения
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value || undefined}
                  >
                    <SelectTrigger className="h-11 sm:h-12 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0 text-sm">
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
                  <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
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
              <FormLabel className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                Статус
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger className="h-11 sm:h-12 rounded-xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0 text-sm">
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
              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 pt-6 border-t border-zinc-100 mt-2">
                <div
                  className="flex flex-row items-start space-x-3 space-y-0 rounded-2xl border border-zinc-100 p-4 sm:p-5 bg-zinc-50/30 cursor-pointer"
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
                    className="h-5 w-5"
                  />
                  <div className="space-y-1 leading-none">
                    <p className="text-sm font-medium text-zinc-950">
                      Декларация
                    </p>
                    <p className="text-[10px] font-light uppercase tracking-wider text-zinc-400">
                      Подписана декларация
                    </p>
                  </div>
                </div>
                <div
                  className="flex flex-row items-start space-x-3 space-y-0 rounded-2xl border border-zinc-100 p-4 sm:p-5 bg-zinc-50/30 cursor-pointer"
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
                    className="h-5 w-5"
                  />
                  <div className="space-y-1 leading-none">
                    <p className="text-sm font-medium text-zinc-950">
                      Медицинско
                    </p>
                    <p className="text-[10px] font-light uppercase tracking-wider text-zinc-400">
                      Предадено за годината
                    </p>
                  </div>
                </div>
                <div
                  className="flex flex-row items-start space-x-3 space-y-0 rounded-2xl border border-zinc-100 p-4 sm:p-5 bg-zinc-50/30 cursor-pointer"
                  onClick={() =>
                    form.setValue("isLicensed", !isLicensed, {
                      shouldValidate: true,
                    })
                  }
                >
                  <VisualCheckbox checked={isLicensed} className="h-5 w-5" />
                  <div className="space-y-1 leading-none">
                    <p className="text-sm font-medium text-zinc-950">
                      Картотека
                    </p>
                    <p className="text-[10px] font-light uppercase tracking-wider text-zinc-400">
                      Картотекиран в БФБ
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

        {(isRecoveryMember || isClubMember) && (
          <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 pt-6 border-t border-zinc-100 mt-2">
            {isRecoveryMember && (
              <FormField
                name="healthConditionNotes"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                      Здравно състояние / Предишни травми
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ""}
                        rows={4}
                        placeholder="Опишете предишни травми, операции, алергии или други важни състояния..."
                        className="rounded-2xl border-zinc-200 bg-white focus:bg-white focus:ring-primary focus:border-primary resize-none p-4 text-sm shadow-sm"
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
                  <FormLabel className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                    Общи Бележки
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      rows={4}
                      className="rounded-2xl border-zinc-100 bg-zinc-50/50 focus:bg-white focus:ring-0 resize-none p-4 font-light text-sm"
                    />
                  </FormControl>
                  <FormDescription className="text-[10px] font-light uppercase tracking-wider text-zinc-400 ml-1">
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
