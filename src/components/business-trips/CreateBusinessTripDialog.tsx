"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
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
import { useAuth } from "@/context/auth-context";
import { businessTripService } from "@/services/business-trip-service";
import { BusinessTripSchema } from "@/types/business-trip.types";
import { Member } from "@/types/member.types";
import { Tournament, TournamentEntry } from "@/types/tournament.types";

// Ние разширяваме базовата схема с полета, които съществуват само в UI формата
const FormSchema = BusinessTripSchema.extend({
  expensesCoverage: z.enum(["transport_only", "food_only", "food_and_sleep"]),
});

type FormValues = z.infer<typeof FormSchema>;

export interface CreateBusinessTripDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournament: Tournament;
  entries: TournamentEntry[];
  membersDict: Record<string, Member>;
  onSuccess?: () => void;
}

export function CreateBusinessTripDialog({
  open,
  onOpenChange,
  tournament,
  entries,
  onSuccess,
}: CreateBusinessTripDialogProps) {
  const { user } = useAuth();

  // Намираме всички деца/състезатели, които участват
  const participantIds = entries.map((e) => e.memberId);
  const participantsCount = participantIds.length;

  const form = useForm<any>({
    resolver: zodResolver(FormSchema) as any,
    defaultValues: {
      siteId: tournament.id || "default-site", // Ideally this should be from context
      eventId: tournament.id,
      title: `Командировка: ${tournament.title}`,
      destination: tournament.location || "",
      startDate: tournament.startDate,
      endDate: tournament.endDate,
      coachId: user?.uid || "", // Командировано лице (треньорът)
      participantsIds: participantIds,
      transportType: "club_paid",
      expensesCoverage: "food_and_sleep",
      financials: {
        perDiemRateEUR: 20.45, // ~40 BGN default for sleepover
        accommodationRateEUR: 0,
        isCommercialActivity: false,
      },
      vehicle: {
        distanceKm: 0,
      },
      status: "draft",
    },
  });

  // Наблюдаваме промяната във "Покрити разходи", за да преизчислим дневните пари
  const coverage = form.watch("expensesCoverage");

  useEffect(() => {
    let baseRate = 0;
    if (coverage === "food_only") {
      baseRate = 10.23; // ~20 BGN
    } else if (coverage === "food_and_sleep") {
      baseRate = 20.45; // ~40 BGN
    }
    form.setValue("financials.perDiemRateEUR", baseRate);
  }, [coverage, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      await businessTripService.createTrip({
        ...values,
        siteId: values.siteId || "default",
      } as any);

      toast.success("Командировката е създадена успешно като чернова!");
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Възникна грешка при запазването.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Генериране на Командировка</DialogTitle>
          <DialogDescription>
            Системата автоматично извлече данните от турнира. Моля, прегледайте
            и допълнете транспортните детайли. Всички суми са в Евро (€).
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit as any)}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control as any}
                name="title"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Основание за пътуването (Заглавие)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="destination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Място на провеждане (Дестинация)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col justify-center space-y-1 rounded-md border p-3">
                <span className="text-xs text-muted-foreground">
                  Командировани лица
                </span>
                <span className="text-sm font-medium">
                  1 Ръководител, {participantsCount} състезатели
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-4">
              <FormField
                control={form.control as any}
                name="transportType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Вид транспорт</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Изберете транспорт" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="club_paid">
                          Клубен/Нает транспорт
                        </SelectItem>
                        <SelectItem value="free">
                          Безплатен транспорт
                        </SelectItem>
                        <SelectItem value="fuel_only">
                          Гориво (Лично/Служебно МПС)
                        </SelectItem>
                        <SelectItem value="public">
                          Обществен транспорт
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-[10px]">
                      {field.value === "club_paid" &&
                        "Осигурен от клуба чрез фактура за превоз/автобус."}
                      {field.value === "free" &&
                        "Напр. осигурен от организатора. Не се изплащат пътни."}
                      {field.value === "fuel_only" &&
                        "Ще се генерира Пътен лист. Плаща се само горивото."}
                      {field.value === "public" &&
                        "Възстановяват се суми срещу билети за влак/автобус."}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="vehicle.distanceKm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Разстояние (в км)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription className="text-[10px]">
                      Въведете ръчно (общо в двете посоки).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-4">
              <FormField
                control={form.control as any}
                name="expensesCoverage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Покрити разходи</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Покрити разходи" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="transport_only">
                          Само транспорт
                        </SelectItem>
                        <SelectItem value="food_only">
                          Храна (без нощувка)
                        </SelectItem>
                        <SelectItem value="food_and_sleep">
                          Храна + Нощувка
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="financials.perDiemOverrideEUR"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Дневни пари (EUR)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder={`По закон: €${form.watch("financials.perDiemRateEUR")}`}
                        {...field}
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription className="text-[10px]">
                      Оставете празно за законовата сума (€
                      {form.watch("financials.perDiemRateEUR")}).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control as any}
              name="financials.isCommercialActivity"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Стопанска дейност
                    </FormLabel>
                    <FormDescription>
                      Отбележете, ако събитието е свързано с реклама, наеми или
                      друга стопанска дейност.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Отказ
              </Button>
              <Button type="submit">
                <Save className="mr-2 size-4" />
                Създай Чернова
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
