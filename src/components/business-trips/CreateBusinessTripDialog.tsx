"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Save } from "lucide-react";
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
import { BusinessTrip, BusinessTripSchema } from "@/types/business-trip.types";
import { ScheduleEvent } from "@/types/index";
import { Member } from "@/types/member.types";

// Ние разширяваме базовата схема с полета, които съществуват само в UI формата
const FormSchema = BusinessTripSchema.extend({
  expensesCoverage: z.enum([
    "transport_only",
    "food_only",
    "food_and_sleep",
    "transport_and_food",
    "transport_food_sleep",
  ]),
  hasEntryFee: z.boolean().default(false),
  entryFeePerPersonEUR: z.number().min(0).optional(),
});

type FormValues = z.infer<typeof FormSchema>;

export interface CreateBusinessTripDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: ScheduleEvent;
  membersDict: Record<string, Member>;
  onSuccess?: () => void;
  /** Ако е подадено, диалогът работи в режим „Редактиране“ */
  initialData?: BusinessTrip;
}

export function CreateBusinessTripDialog({
  open,
  onOpenChange,
  event,
  membersDict,
  onSuccess,
  initialData,
}: CreateBusinessTripDialogProps) {
  const { user } = useAuth();
  const isEditMode = !!initialData;

  // Намираме всички деца/състезатели, които участват (изключваме треньорите)
  const participantIds = event.attendees
    .map((e) => e.memberId)
    .filter((id) => {
      const member = membersDict[id];
      return member && !member.isCoach;
    });
  const participantsCount = participantIds.length;

  const coachOptions: Member[] = Object.values(membersDict).filter(
    (m: Member) => m.isCoach
  );

  const getInitialExpensesCoverage = () => {
    if (!initialData) return "food_and_sleep";
    const rate = initialData.financials.perDiemRateEUR ?? 0;
    if (rate > 15) return "food_and_sleep";
    if (rate > 0) return "food_only";
    return "transport_only";
  };

  const form = useForm<any>({
    resolver: zodResolver(FormSchema) as any,
    defaultValues: initialData
      ? {
          // Режим Редактиране — презареждаме съществуващите стойности
          ...initialData,
          expensesCoverage: getInitialExpensesCoverage(),
          hasEntryFee: !!initialData.financials.entryFeeEUR,
          entryFeePerPersonEUR:
            initialData.financials.entryFeeEUR && participantsCount > 0
              ? initialData.financials.entryFeeEUR / participantsCount
              : 0,
        }
      : {
          siteId: "bkgalabovo",
          eventId: event.id,
          title: `Командировка: ${event.title}`,
          destination: event.location || "",
          startDate: event.startDate,
          endDate: event.endDate,
          coachId: user?.uid || "",
          participantsIds: participantIds,
          transportType: "club_paid",
          expensesCoverage: "food_and_sleep",
          financials: {
            perDiemRateEUR: 22,
            accommodationRateEUR: 0,
            entryFeeEUR: 0,
            isCommercialActivity: false,
          },
          vehicle: {
            distanceKm: 0,
          },
          status: "draft",
          orderDate: new Date().toISOString(),
          hasEntryFee: false,
          entryFeePerPersonEUR: 0,
        },
  });

  // Наблюдаваме промяната във "Покрити разходи", за да преизчислим дневните пари
  const coverage = form.watch("expensesCoverage");
  const transportType = form.watch("transportType");

  useEffect(() => {
    let baseRate = 0;
    if (coverage === "food_only" || coverage === "transport_and_food") {
      baseRate = 11; // 50% без нощувка (Наредба 2026)
    } else if (
      coverage === "food_and_sleep" ||
      coverage === "transport_food_sleep"
    ) {
      baseRate = 22; // С нощувка (Наредба 2026)
    }
    form.setValue("financials.perDiemRateEUR", baseRate);
  }, [coverage, form]);

  // Предупреждение: Датата на заповедта трябва да е преди започването на събитието
  const watchedOrderDate = form.watch("orderDate");
  const isOrderDateAfterEvent =
    watchedOrderDate && event.startDate
      ? new Date(watchedOrderDate) > new Date(event.startDate)
      : false;

  const onSubmit = async (values: FormValues) => {
    try {
      const selectedCoach = coachOptions.find(
        (c: Member) => c.id === values.coachId
      );
      const coachName = selectedCoach
        ? `${selectedCoach.firstName} ${selectedCoach.lastName}`
        : user?.displayName || "Неизвестен";
      const coachRole = selectedCoach?.isCoach ? "Треньор" : "Ръководител";

      if (isEditMode && initialData?.id) {
        // Режим Редактиране
        await businessTripService.updateTrip(initialData.id, {
          ...values,
          coachName,
          coachRole,
          orderDate: values.orderDate,
          financials: {
            ...values.financials,
            entryFeeEUR: values.hasEntryFee
              ? (values.entryFeePerPersonEUR || 0) * participantsCount
              : 0,
          },
        } as any);
        toast.success("Командировката е актуализирана успешно!");
      } else {
        // Режим Създаване
        await businessTripService.createTrip({
          ...values,
          coachName,
          coachRole,
          siteId: values.siteId || "default",
          orderDate: values.orderDate,
          financials: {
            ...values.financials,
            entryFeeEUR: values.hasEntryFee
              ? (values.entryFeePerPersonEUR || 0) * participantsCount
              : 0,
          },
        } as any);
        toast.success("Командировката е създадена успешно като чернова!");
      }

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
          <DialogTitle>
            {isEditMode
              ? "Редактиране на Командировка"
              : "Генериране на Командировка"}
          </DialogTitle>
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
                render={({ field }: any) => (
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
                render={({ field }: any) => (
                  <FormItem className="col-span-2 sm:col-span-1">
                    <FormLabel>Място на провеждане (Дестинация)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="organizer"
                render={({ field }: any) => (
                  <FormItem className="col-span-2 sm:col-span-1">
                    <FormLabel>Организатор (напр. БФ Бадминтон)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Организатор..."
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="hostClub"
                render={({ field }: any) => (
                  <FormItem className="col-span-2 sm:col-span-1">
                    <FormLabel>Клуб домакин</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Клуб домакин..."
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="usDecision"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Решение на УС (за Отчета)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Напр. № 12 от 15.03"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="col-span-2 flex flex-col justify-center space-y-1 rounded-md border p-3">
                <span className="text-xs text-muted-foreground">
                  Командировани състезатели
                </span>
                <span className="text-sm font-medium">
                  {participantsCount} състезатели
                </span>
              </div>

              <FormField
                control={form.control as any}
                name="coachId"
                render={({ field }: any) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Ръководител / Командировано лице</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Изберете треньор/ръководител" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {coachOptions.map((coach: Member) => (
                          <SelectItem key={coach.id} value={coach.id!}>
                            {coach.firstName} {coach.lastName} (
                            {coach.isCoach ? "Треньор" : "Ръководител"})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-4">
              <FormField
                control={form.control as any}
                name="transportType"
                render={({ field }: any) => (
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
                render={({ field }: any) => (
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

              {transportType === "fuel_only" && (
                <>
                  <FormField
                    control={form.control as any}
                    name="vehicle.brand"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel>Марка МПС</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Напр. Toyota"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control as any}
                    name="vehicle.regNumber"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel>Рег. номер</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Напр. CB1234AB"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control as any}
                    name="vehicle.fuelNorm"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel>Разход (л/100км)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="Напр. 6.5"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control as any}
                    name="vehicle.fuelType"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel>Вид гориво</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Изберете" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="бензин А-95">
                              бензин А-95
                            </SelectItem>
                            <SelectItem value="дизелово гориво">
                              дизелово гориво
                            </SelectItem>
                            <SelectItem value="газ">газ (LPG)</SelectItem>
                            <SelectItem value="метан">метан (CNG)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-4">
              <FormField
                control={form.control as any}
                name="expensesCoverage"
                render={({ field }: any) => (
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
                        <SelectItem value="food_only">Само храна</SelectItem>
                        <SelectItem value="food_and_sleep">
                          Храна + Нощувки
                        </SelectItem>
                        <SelectItem value="transport_and_food">
                          Транспорт + Храна
                        </SelectItem>
                        <SelectItem value="transport_food_sleep">
                          Транспорт + Храна + Нощувки
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
                render={({ field }: any) => (
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
                    <FormDescription className="mt-2 rounded bg-blue-50 p-2 text-[11px] leading-tight text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
                      💡 Оставете празно, за да се ползва сумата по закон (€
                      {form.watch("financials.perDiemRateEUR")}). Това е сумата{" "}
                      <strong>НА ЧОВЕК за 1 ДЕН</strong>.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="financials.accommodationRateEUR"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Квартирни пари (за 1 нощувка в EUR)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Напр. 15.00"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : 0
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription className="mt-2 rounded bg-blue-50 p-2 text-[11px] leading-tight text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
                      💡 Тук се въвежда цена{" "}
                      <strong>НА ЧОВЕК за 1 нощувка</strong>. Ако знаете само
                      общата сума за всички, най-лесно е да въведете{" "}
                      <strong>0</strong> тук, а да добавите общата сума накрая
                      като &quot;Разход&quot; (Фактура).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="hasEntryFee"
                render={({ field }: any) => (
                  <FormItem className="col-span-2 flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Входна такса</FormLabel>
                      <FormDescription>
                        Маркирайте, ако клубът поема таксите за участие
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

              {form.watch("hasEntryFee") && (
                <FormField
                  control={form.control as any}
                  name="entryFeePerPersonEUR"
                  render={({ field }: any) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Входна такса за 1 състезател (EUR)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Напр. 15.00"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? Number(e.target.value) : 0
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription className="text-[11px]">
                        Смята се автоматично: {field.value || 0} EUR ×{" "}
                        {participantsCount} състезатели =
                        <strong className="ml-1 text-emerald-600">
                          Общо{" "}
                          {((field.value || 0) * participantsCount).toFixed(2)}{" "}
                          EUR
                        </strong>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control as any}
                name="financials.isCommercialActivity"
                render={({ field }: any) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Стопанска дейност
                      </FormLabel>
                      <FormDescription>
                        Отбележете, ако събитието е свързано с реклама, наеми
                        или друга стопанска дейност.
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

              <FormField
                control={form.control as any}
                name="status"
                render={({ field }: any) => (
                  <FormItem className="rounded-lg border p-4">
                    <div className="mb-2 space-y-0.5">
                      <FormLabel className="text-base">
                        Статус на командировката
                      </FormLabel>
                      <FormDescription>
                        За вътрешно проследяване
                      </FormDescription>
                    </div>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Изберете статус" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Чернова</SelectItem>
                        <SelectItem value="approved">Одобрена</SelectItem>
                        <SelectItem value="completed">Отчетена</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* ── Дата на Заповедта ── */}
            <div className="space-y-3 rounded-lg border border-dashed p-4">
              <FormField
                control={form.control as any}
                name="orderDate"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Дата на Заповедта
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        за PDF документа
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={
                          field.value
                            ? new Date(field.value).toISOString().split("T")[0]
                            : ""
                        }
                        onChange={(e) => {
                          const d = e.target.value;
                          field.onChange(
                            d ? new Date(d).toISOString() : undefined
                          );
                        }}
                      />
                    </FormControl>
                    <FormDescription className="text-[10px]">
                      Тази дата ще се отпечата в заглавието «ЗАПОВЕД № ... /
                      дата». По закон тя трябва да е ПРЕДИ събитието.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Предупреждение — показва се динамично */}
              {isOrderDateAfterEvent && (
                <div className="flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <div className="space-y-1 text-xs">
                    <p className="font-semibold">Юридическо несъответствие!</p>
                    <p>
                      Датата на заповедта (
                      {watchedOrderDate
                        ? new Date(watchedOrderDate).toLocaleDateString("bg-BG")
                        : "—"}
                      ) е СЛЕД датата на събитието (
                      {new Date(event.startDate).toLocaleDateString("bg-BG")}) .
                      По Наредбата за командировките, заповедта трябва да бъде
                      издадена <strong>преди</strong> започването на пътуването.
                    </p>
                    <p className="text-amber-600 dark:text-amber-400">
                      Можете да продължите запазването, но документът за тази
                      командировка може да не бъде приет от счетоводството.
                    </p>
                  </div>
                </div>
              )}
            </div>

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
                {isEditMode ? "Запази промените" : "Създай Чернова"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
