/* eslint-disable sonarjs/no-nested-conditional */
 
 
"use client";

import {
  useForm,
  SubmitHandler,
  ControllerRenderProps,
  UseFormReturn,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  TournamentSchema,
  Tournament,
  MATCH_FORMAT_PRESETS,
} from "@/types/tournament.types";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { Textarea } from "@/components/ui/textarea";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Star, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const CATEGORIES = [
  { id: "singles", label: "Единично" },
  { id: "doubles", label: "Двойки" },
  { id: "mixed", label: "Смесени двойки" },
] as const;

type TournamentFormValues = z.infer<typeof TournamentSchema>;

interface TournamentFormProps {
  onSave: (data: TournamentFormValues) => Promise<void>;
  onClose: () => void;
  initialData?: Tournament;
}

export function TournamentForm({
  onSave,
  onClose,
  initialData,
}: TournamentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form: UseFormReturn<TournamentFormValues> =
    useForm<TournamentFormValues>({
      resolver: zodResolver(TournamentSchema),
      defaultValues: {
        title: initialData?.title ?? "",
        description: initialData?.description ?? "",
        startDate: initialData?.startDate ?? new Date().toISOString(),
        endDate: initialData?.endDate ?? new Date().toISOString(),
        location: initialData?.location ?? "",
        status: initialData?.status ?? "upcoming",
        format: initialData?.format ?? "berger",
        categories: initialData?.categories ?? [],
        matchFormatId: initialData?.matchFormatId ?? "official_21",
        countsForRanking: initialData?.countsForRanking ?? true,
        pointsMultiplier: initialData?.pointsMultiplier ?? 1,
        entryFee: initialData?.entryFee ?? 0,
      },
    });

  const onSubmit: SubmitHandler<TournamentFormValues> = async (data) => {
    setIsSubmitting(true);
    try {
      await onSave(data);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategoryToggle = (
    itemId: string,
    currentValues: string[] | undefined,
    onChange: (vals: string[]) => void,
    isChecked: boolean
  ) => {
    const current = currentValues || [];
    const next = isChecked
      ? current.filter((v) => v !== itemId)
      : [...current, itemId];
    onChange(next);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
          <FormField<TournamentFormValues, "title">
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
                  Име на турнира
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Напр. Пролетен турнир Гълъбово 2026"
                    {...field}
                    className="h-14 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-sm font-light shadow-none focus-visible:ring-primary"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField<TournamentFormValues, "startDate">
            control={form.control}
            name="startDate"
            render={({
              field,
            }: {
              field: ControllerRenderProps<TournamentFormValues, "startDate">;
            }) => (
              <FormItem>
                <FormLabel className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
                  Начална дата
                </FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    value={field.value ? field.value.split("T")[0] : ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const date = e.target.value
                        ? new Date(e.target.value).toISOString()
                        : "";
                      field.onChange(date);
                    }}
                    className="h-14 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-sm font-light shadow-none focus-visible:ring-primary"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField<TournamentFormValues, "endDate">
            control={form.control}
            name="endDate"
            render={({
              field,
            }: {
              field: ControllerRenderProps<TournamentFormValues, "endDate">;
            }) => (
              <FormItem>
                <FormLabel className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
                  Крайна дата
                </FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    value={field.value ? field.value.split("T")[0] : ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const date = e.target.value
                        ? new Date(e.target.value).toISOString()
                        : "";
                      field.onChange(date);
                    }}
                    className="h-14 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-sm font-light shadow-none focus-visible:ring-primary"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField<TournamentFormValues, "location">
            control={form.control}
            name="location"
            render={({
              field,
            }: {
              field: ControllerRenderProps<TournamentFormValues, "location">;
            }) => (
              <FormItem>
                <FormLabel className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
                  Локация
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Напр. Спортна зала Гълъбово"
                    {...field}
                    className="h-14 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-sm font-light shadow-none focus-visible:ring-primary"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField<TournamentFormValues, "format">
            control={form.control}
            name="format"
            render={({
              field,
            }: {
              field: ControllerRenderProps<TournamentFormValues, "format">;
            }) => (
              <FormItem>
                <FormLabel className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
                  Формат на игра
                </FormLabel>
                <div className="relative">
                  <select
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    className="h-14 w-full rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-4 text-sm font-light shadow-none outline-none focus-visible:ring-1 focus-visible:ring-primary appearance-none cursor-pointer text-zinc-900 dark:text-white"
                  >
                    <option value="berger">Групи (Бергер)</option>
                    <option value="knockout">Елиминация</option>
                    <option value="mixed">Смесен</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 text-zinc-400">
                    <ChevronDown className="h-4 w-4" strokeWidth={1.5} />
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField<TournamentFormValues, "status">
            control={form.control}
            name="status"
            render={({
              field,
            }: {
              field: ControllerRenderProps<TournamentFormValues, "status">;
            }) => (
              <FormItem className="md:col-span-2">
                <FormLabel className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
                  Статус на събитието
                </FormLabel>
                <div className="relative">
                  <select
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    className="h-14 w-full rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-4 text-sm font-light shadow-none outline-none focus-visible:ring-1 focus-visible:ring-primary appearance-none cursor-pointer text-zinc-900 dark:text-white"
                  >
                    <option value="upcoming">Предстоящ</option>
                    <option value="registration_open">Записване</option>
                    <option value="ongoing">В ход</option>
                    <option value="completed">Приключил</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 text-zinc-400">
                    <ChevronDown className="h-4 w-4" strokeWidth={1.5} />
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="md:col-span-2 space-y-6 p-8 rounded-4xl bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-900">
            <div className="flex items-center justify-between">
              <div>
                <FormLabel className="text-base font-light text-zinc-900 dark:text-white flex items-center gap-3">
                  <span className="p-2 bg-primary/5 rounded-lg text-primary">
                    💰
                  </span>{" "}
                  Такса за участие
                </FormLabel>
                <p className="text-[11px] text-zinc-400 uppercase tracking-wider mt-1 font-medium">
                  Турнирът изисква ли такса?
                </p>
              </div>
              <input
                type="checkbox"
                id="hasFee"
                checked={form.watch("entryFee") > 0}
                onChange={(e) => {
                  const checked = e.target.checked;
                  if (!checked) form.setValue("entryFee", 0);
                  else if (form.getValues("entryFee") === 0)
                    form.setValue("entryFee", 10);
                }}
                className="h-6 w-6 rounded border-zinc-300 cursor-pointer accent-zinc-950"
              />
            </div>

            {form.watch("entryFee") > 0 && (
              <FormField<TournamentFormValues, "entryFee">
                control={form.control}
                name="entryFee"
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<
                    TournamentFormValues,
                    "entryFee"
                  >;
                }) => (
                  <FormItem className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <FormLabel className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
                      Сума в Евро (€)
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          {...field}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            field.onChange(Number(e.target.value))
                          }
                          className="h-14 pr-12 rounded-xl border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-light shadow-none"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-300 font-light">
                          €
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          <FormField<TournamentFormValues, "matchFormatId">
            control={form.control}
            name="matchFormatId"
            render={({
              field,
            }: {
              field: ControllerRenderProps<
                TournamentFormValues,
                "matchFormatId"
              >;
            }) => (
              <FormItem className="md:col-span-2 p-8 rounded-4xl bg-primary/2 border border-primary/10">
                <div className="mb-6">
                  <FormLabel className="text-base font-light text-zinc-900 dark:text-white flex items-center gap-3">
                    <span className="p-2 bg-primary/5 rounded-lg text-primary">
                      🏸
                    </span>{" "}
                    Система за точкуване
                  </FormLabel>
                  <p className="text-[11px] text-zinc-400 uppercase tracking-wider mt-1 font-medium">
                    Резултатите ще се валидират спрямо избрания формат.
                  </p>
                </div>
                <div className="relative">
                  <select
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    className="h-14 w-full rounded-xl border border-primary/10 bg-white dark:bg-zinc-950 px-4 text-sm font-light shadow-none outline-none focus-visible:ring-1 focus-visible:ring-primary appearance-none cursor-pointer text-zinc-900 dark:text-white"
                  >
                    {MATCH_FORMAT_PRESETS.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 text-zinc-400">
                    <ChevronDown className="h-4 w-4" strokeWidth={1.5} />
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField<TournamentFormValues, "countsForRanking">
            control={form.control}
            name="countsForRanking"
            render={({
              field,
            }: {
              field: ControllerRenderProps<
                TournamentFormValues,
                "countsForRanking"
              >;
            }) => (
              <FormItem className="md:col-span-2 p-8 rounded-4xl bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-900 flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <FormLabel className="text-base font-light text-zinc-900 dark:text-white flex items-center gap-3">
                    <Star
                      className="h-5 w-5 text-amber-400"
                      strokeWidth={1.5}
                    />
                    Ранглиста
                  </FormLabel>
                  <p className="text-[11px] text-zinc-400 uppercase tracking-wider font-medium">
                    Резултатите носят точки за класирането
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="h-6 w-6 rounded border-zinc-300 cursor-pointer accent-zinc-950"
                />
              </FormItem>
            )}
          />

          <FormField<TournamentFormValues, "pointsMultiplier">
            control={form.control}
            name="pointsMultiplier"
            render={({
              field,
            }: {
              field: ControllerRenderProps<
                TournamentFormValues,
                "pointsMultiplier"
              >;
            }) => (
              <FormItem>
                <FormLabel className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
                  Коефициент
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.5"
                    {...field}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      field.onChange(Number(e.target.value))
                    }
                    className="h-14 rounded-xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-sm font-light shadow-none"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField<TournamentFormValues, "categories">
            control={form.control}
            name="categories"
            render={({
              field,
            }: {
              field: ControllerRenderProps<TournamentFormValues, "categories">;
            }) => (
              <FormItem className="md:col-span-2 p-8 rounded-4xl border border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950">
                <div className="mb-8">
                  <FormLabel className="text-base font-light text-zinc-900 dark:text-white">
                    Категории
                  </FormLabel>
                  <p className="text-[11px] text-zinc-400 uppercase tracking-wider font-medium mt-1">
                    Изберете дисциплини за провеждане
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {CATEGORIES.map((item) => {
                    const isChecked = field.value?.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "flex flex-row items-center space-x-4 space-y-0 p-4 rounded-2xl border transition-all cursor-pointer",
                          isChecked
                            ? "bg-primary/5 border-primary/20 text-primary"
                            : "bg-zinc-50/50 border-zinc-100 text-zinc-500 hover:bg-zinc-50"
                        )}
                        onClick={() => handleCategoryToggle(item.id, field.value, field.onChange, isChecked)}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleCategoryToggle(item.id, field.value, field.onChange, !e.target.checked)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-5 w-5 rounded border-zinc-300 cursor-pointer accent-zinc-950"
                        />
                        <FormLabel className="text-xs font-medium uppercase tracking-widest cursor-pointer">
                          {item.label}
                        </FormLabel>
                      </div>
                    );
                  })}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField<TournamentFormValues, "description">
            control={form.control}
            name="description"
            render={({
              field,
            }: {
              field: ControllerRenderProps<TournamentFormValues, "description">;
            }) => (
              <FormItem className="md:col-span-2">
                <FormLabel className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
                  Описание / Бележки
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Допълнителна информация за турнира..."
                    {...field}
                    className="min-h-[120px] rounded-2xl border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-sm font-light shadow-none focus-visible:ring-primary p-6"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4 pt-10 border-t border-zinc-50 dark:border-zinc-900">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl h-12 px-8 font-medium uppercase tracking-widest text-[10px] text-zinc-400 hover:text-zinc-600"
          >
            Отказ
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl h-12 px-10 font-medium uppercase tracking-widest text-[11px] bg-primary text-white hover:bg-primary/90 shadow-none"
          >
            {isSubmitting
              ? "Обработка..."
              : initialData
                ? "Запази промените"
                : "Създай турнир"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
