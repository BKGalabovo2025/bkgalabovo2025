"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, Star } from "lucide-react";
import { useState } from "react";
import {
  ControllerRenderProps,
  SubmitHandler,
  useForm,
  UseFormReturn,
} from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  MATCH_FORMAT_PRESETS,
  Tournament,
  TournamentSchema,
} from "@/types/tournament.types";

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
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-1 flex-col overflow-hidden min-h-0"
      >
        <div className="custom-scrollbar flex-1 overflow-y-auto overscroll-contain p-3.5 sm:p-4.5 space-y-3.5 min-h-0">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField<TournamentFormValues, "title">
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel className="text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
                    Име на турнира
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Напр. Пролетен турнир Гълъбово 2026"
                      {...field}
                      className="h-10 rounded-xl border-zinc-100 bg-zinc-50/50 text-xs sm:text-sm font-light shadow-none focus-visible:ring-primary dark:border-zinc-800 dark:bg-zinc-900/50"
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
                  <FormLabel className="text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
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
                      className="h-10 rounded-xl border-zinc-100 bg-zinc-50/50 text-xs sm:text-sm font-light shadow-none focus-visible:ring-primary dark:border-zinc-800 dark:bg-zinc-900/50"
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
                  <FormLabel className="text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
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
                      className="h-10 rounded-xl border-zinc-100 bg-zinc-50/50 text-xs sm:text-sm font-light shadow-none focus-visible:ring-primary dark:border-zinc-800 dark:bg-zinc-900/50"
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
                  <FormLabel className="text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
                    Локация
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Напр. Спортна зала Гълъбово"
                      {...field}
                      className="h-10 rounded-xl border-zinc-100 bg-zinc-50/50 text-xs sm:text-sm font-light shadow-none focus-visible:ring-primary dark:border-zinc-800 dark:bg-zinc-900/50"
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
                  <FormLabel className="text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
                    Формат на игра
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <select
                        id="tournament-format"
                        name="format"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="h-10 w-full cursor-pointer appearance-none rounded-xl border border-zinc-100 bg-zinc-50/50 px-3 text-xs sm:text-sm font-light text-zinc-900 shadow-none outline-none focus-visible:ring-1 focus-visible:ring-primary dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white"
                      >
                        <option value="berger">Групи (Бергер)</option>
                        <option value="knockout">Елиминация</option>
                        <option value="mixed">Смесен</option>
                      </select>
                      <div className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-zinc-400 opacity-50">
                        <ChevronDown className="size-4" strokeWidth={1.5} />
                      </div>
                    </div>
                  </FormControl>
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
                <FormItem className="sm:col-span-2">
                  <FormLabel className="text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
                    Статус на събитието
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <select
                        id="tournament-status"
                        name="status"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="h-10 w-full cursor-pointer appearance-none rounded-xl border border-zinc-100 bg-zinc-50/50 px-3 text-xs sm:text-sm font-light text-zinc-900 shadow-none outline-none focus-visible:ring-1 focus-visible:ring-primary dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white"
                      >
                        <option value="upcoming">Предстоящ</option>
                        <option value="registration_open">Записване</option>
                        <option value="ongoing">В ход</option>
                        <option value="completed">Приключил</option>
                      </select>
                      <div className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-zinc-400 opacity-50">
                        <ChevronDown className="size-4" strokeWidth={1.5} />
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3 rounded-2xl border border-zinc-100 bg-zinc-50/50 p-3.5 sm:p-4 sm:col-span-2 dark:border-zinc-900 dark:bg-zinc-900/30">
              <div className="flex items-center justify-between">
                <div>
                  <label
                    htmlFor="hasFee"
                    className="flex cursor-pointer items-center gap-2 text-sm font-medium text-zinc-900 dark:text-white"
                  >
                    <span className="rounded-md bg-primary/5 p-1 text-primary">
                      💰
                    </span>{" "}
                    Такса за участие
                  </label>
                  <p className="mt-0.5 text-[11px] font-medium tracking-wider text-zinc-400 uppercase">
                    Турнирът изисква ли такса?
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="hasFee"
                  name="hasFee"
                  checked={form.watch("entryFee") > 0}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    if (!checked) form.setValue("entryFee", 0);
                    else if (form.getValues("entryFee") === 0)
                      form.setValue("entryFee", 10);
                  }}
                  className="size-5 cursor-pointer rounded border-zinc-300 accent-zinc-950"
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
                    <FormItem className="duration-300 animate-in fade-in slide-in-from-top-2">
                      <FormLabel className="text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
                        Сума в Евро (€)
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            {...field}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) => field.onChange(Number(e.target.value))}
                            className="h-10 rounded-xl border-zinc-100 bg-white pr-10 text-xs sm:text-sm font-light shadow-none dark:border-zinc-800 dark:bg-zinc-950"
                          />
                          <span className="absolute top-1/2 right-3 -translate-y-1/2 font-light text-zinc-400 text-xs">
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
                <FormItem className="rounded-2xl border border-primary/10 bg-primary/2 p-3.5 sm:p-4 sm:col-span-2">
                  <div className="mb-2.5">
                    <FormLabel className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-white">
                      <span className="rounded-md bg-primary/5 p-1 text-primary">
                        🏸
                      </span>{" "}
                      Система за точкуване
                    </FormLabel>
                    <p className="mt-0.5 text-[11px] font-medium tracking-wider text-zinc-400 uppercase">
                      Резултатите ще се валидират спрямо избрания формат.
                    </p>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <select
                        id="tournament-matchFormatId"
                        name="matchFormatId"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="h-10 w-full cursor-pointer appearance-none rounded-xl border border-primary/10 bg-white px-3 text-xs sm:text-sm font-light text-zinc-900 shadow-none outline-none focus-visible:ring-1 focus-visible:ring-primary dark:bg-zinc-950 dark:text-white"
                      >
                        {MATCH_FORMAT_PRESETS.map((preset) => (
                          <option key={preset.id} value={preset.id}>
                            {preset.label}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-zinc-400 opacity-50">
                        <ChevronDown className="size-4" strokeWidth={1.5} />
                      </div>
                    </div>
                  </FormControl>
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
                <FormItem className="flex flex-row items-center justify-between rounded-2xl border border-zinc-100 bg-zinc-50/50 p-3.5 sm:p-4 sm:col-span-2 dark:border-zinc-900 dark:bg-zinc-900/30">
                  <div className="space-y-0.5">
                    <label
                      htmlFor="tournament-countsForRanking"
                      className="flex cursor-pointer items-center gap-2 text-sm font-medium text-zinc-900 dark:text-white"
                    >
                      <Star
                        className="size-4 text-amber-400"
                        strokeWidth={1.5}
                      />
                      Ранглиста
                    </label>
                    <p className="text-[11px] font-medium tracking-wider text-zinc-400 uppercase">
                      Резултатите носят точки за класирането
                    </p>
                  </div>
                  <FormControl>
                    <input
                      id="tournament-countsForRanking"
                      name="countsForRanking"
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="size-5 cursor-pointer rounded border-zinc-300 accent-zinc-950"
                    />
                  </FormControl>
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
                  <FormLabel className="text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
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
                      className="h-10 rounded-xl border-zinc-100 bg-zinc-50/50 text-xs sm:text-sm font-light shadow-none dark:border-zinc-800 dark:bg-zinc-900/50"
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
                field: ControllerRenderProps<
                  TournamentFormValues,
                  "categories"
                >;
              }) => (
                <FormItem className="rounded-2xl border border-zinc-100 bg-white p-3.5 sm:p-4 sm:col-span-2 dark:border-zinc-900 dark:bg-zinc-950">
                  <div className="mb-3">
                    <div className="text-sm font-medium text-zinc-900 dark:text-white">
                      Категории
                    </div>
                    <p className="mt-0.5 text-[11px] font-medium tracking-wider text-zinc-400 uppercase">
                      Изберете дисциплини за провеждане
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                    {CATEGORIES.map((item) => {
                      const isChecked = field.value?.includes(item.id);
                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "flex cursor-pointer flex-row items-center space-x-2.5 rounded-xl border p-2.5 transition-all",
                            isChecked
                              ? "border-primary/20 bg-primary/5 text-primary"
                              : "border-zinc-100 bg-zinc-50/50 text-zinc-500 hover:bg-zinc-50"
                          )}
                          onClick={() =>
                            handleCategoryToggle(
                              item.id,
                              field.value,
                              field.onChange,
                              isChecked
                            )
                          }
                        >
                          <input
                            id={`cat-${item.id}`}
                            name={`category-${item.id}`}
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) =>
                              handleCategoryToggle(
                                item.id,
                                field.value,
                                field.onChange,
                                !e.target.checked
                              )
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="size-4.5 cursor-pointer rounded border-zinc-300 accent-zinc-950"
                          />
                          <label
                            htmlFor={`cat-${item.id}`}
                            className="cursor-pointer text-xs font-medium tracking-wide"
                          >
                            {item.label}
                          </label>
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
                field: ControllerRenderProps<
                  TournamentFormValues,
                  "description"
                >;
              }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel className="text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
                    Описание / Бележки
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Допълнителна информация за турнира..."
                      {...field}
                      className="min-h-20 rounded-xl border-zinc-100 bg-zinc-50/50 p-3 text-xs sm:text-sm font-light shadow-none focus-visible:ring-primary dark:border-zinc-800 dark:bg-zinc-900/50"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Fixed Sticky Footer */}
        <div className="shrink-0 flex items-center justify-end gap-2 border-t border-zinc-100 bg-zinc-50/80 px-4 py-2.5 sm:px-5 sm:py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-9 rounded-xl px-4 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          >
            Отказ
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting}
            className="h-9 rounded-xl bg-primary px-5 text-xs font-bold text-white shadow-sm hover:bg-primary/90"
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
