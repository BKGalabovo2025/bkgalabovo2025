"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  TournamentSchema,
  Tournament,
  MATCH_FORMAT_PRESETS,
} from "@/types/tournament.types";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Save, X, Star } from "lucide-react";
import { useState } from "react";

const CATEGORIES = [
  { id: "singles", label: "Единично" },
  { id: "doubles", label: "Двойки" },
  { id: "mixed", label: "Смесени двойки" },
];

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

  const form = useForm<TournamentFormValues>({
    resolver: zodResolver(TournamentSchema) as any,
    defaultValues: initialData || {
      title: "",
      description: "",
      location: "",
      status: "upcoming",
      format: "berger",
      categories: [],
      matchFormatId: "official_21",
      countsForRanking: true,
      pointsMultiplier: 1,
      entryFee: 0,
    },
  });

  const onSubmit = async (data: TournamentFormValues) => {
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }: { field: any }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Име на турнира</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Напр. Пролетен турнир Гълъбово 2026"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Начална дата</FormLabel>
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
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Крайна дата</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    value={field.value ? field.value.split("T")[0] : ""}
                    onChange={(e) => {
                      const date = e.target.value
                        ? new Date(e.target.value).toISOString()
                        : "";
                      field.onChange(date);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Локация</FormLabel>
                <FormControl>
                  <Input placeholder="Напр. Спортна зала Гълъбово" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="format"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Формат на игра</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Избери формат" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="berger">
                      Групи (Система на Бергер)
                    </SelectItem>
                    <SelectItem value="knockout">
                      Директна Елиминация
                    </SelectItem>
                    <SelectItem value="mixed">
                      Смесен (Групи + Елиминация)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Статус</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Избери статус" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="upcoming">Предстоящ (Скрит)</SelectItem>
                    <SelectItem value="registration_open">
                      Отворено записване
                    </SelectItem>
                    <SelectItem value="ongoing">В ход (Играе се)</SelectItem>
                    <SelectItem value="completed">Приключил</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="md:col-span-2 space-y-4 border rounded-md p-4 bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <FormLabel className="text-base flex items-center gap-2 cursor-pointer">
                  💰 Такса за участие
                </FormLabel>
                <p className="text-[0.8rem] text-muted-foreground mt-1">
                  Турнирът изисква ли такса от участниците?
                </p>
              </div>
              <Checkbox
                id="hasFee"
                checked={form.watch("entryFee") > 0}
                onCheckedChange={(checked: boolean) => {
                  if (!checked) form.setValue("entryFee", 0);
                  else if (form.getValues("entryFee") === 0)
                    form.setValue("entryFee", 10);
                }}
                className="h-6 w-6"
              />
            </div>

            {form.watch("entryFee") > 0 && (
              <FormField
                control={form.control}
                name="entryFee"
                render={({ field }: { field: any }) => (
                  <FormItem className="animate-in fade-in slide-in-from-top-2 duration-200">
                    <FormLabel>Сума в Евро (€)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          {...field}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            field.onChange(Number(e.target.value))
                          }
                          className="pr-8"
                        />
                        <span className="absolute right-3 top-2.5 text-muted-foreground">
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

          <FormField
            control={form.control}
            name="matchFormatId"
            render={({ field }: { field: any }) => (
              <FormItem className="md:col-span-2 border rounded-md p-4 bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
                <div className="mb-3">
                  <FormLabel className="text-base flex items-center gap-2">
                    🏸 Система за точкуване
                  </FormLabel>
                  <p className="text-[0.8rem] text-muted-foreground mt-1">
                    Резултатите ще се валидират спрямо избрания формат.
                  </p>
                </div>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="bg-white dark:bg-zinc-950">
                      <SelectValue placeholder="Избери формат" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 z-50 max-h-[300px] overflow-y-auto">
                    {MATCH_FORMAT_PRESETS.map((preset: any) => (
                      <SelectItem key={preset.id} value={preset.id}>
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="countsForRanking"
            render={({ field }: { field: any }) => (
              <FormItem className="md:col-span-2 border rounded-md p-4 bg-muted/20 flex flex-row items-center justify-between">
                <div>
                  <FormLabel className="text-base flex items-center gap-2 cursor-pointer">
                    <Star className="h-4 w-4 text-yellow-500" />
                    Влиза в ранглистата
                  </FormLabel>
                  <p className="text-[0.8rem] text-muted-foreground mt-1">
                    Ако е включено, резултатите ще носят точки за класирането на
                    всеки участник.
                  </p>
                </div>
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="h-6 w-6"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pointsMultiplier"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Коефициент за точки</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.5"
                    {...field}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      field.onChange(Number(e.target.value))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categories"
            render={() => (
              <FormItem className="md:col-span-2 border rounded-md p-4 bg-muted/20">
                <div className="mb-4">
                  <FormLabel className="text-base">Категории</FormLabel>
                  <p className="text-[0.8rem] text-muted-foreground">
                    Изберете в кои дисциплини ще се провежда турнирът.
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {CATEGORIES.map((item) => (
                    <FormField
                      key={item.id}
                      control={form.control}
                      name="categories"
                      render={({ field }: { field: any }) => {
                        return (
                          <FormItem
                            key={item.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(item.id as any)}
                                onCheckedChange={(checked: boolean) => {
                                  return checked
                                    ? field.onChange([...field.value, item.id])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value: string) => value !== item.id
                                        )
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              {item.label}
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }: { field: any }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Описание / Бележки</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Допълнителна информация за турнира..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            <X className="mr-2 h-4 w-4" /> Отказ
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            {initialData ? "Запази промените" : "Създай турнир"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
