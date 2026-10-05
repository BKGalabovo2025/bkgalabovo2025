"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, FileText, Save } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
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
          usDecision: initialData.usDecision || "",
          usDecisionDate: initialData.usDecisionDate || "",
          usProtocolNumber: initialData.usProtocolNumber || "",
          usDecisionNotes: initialData.usDecisionNotes || "",
          reportText: initialData.reportText || "",
          attachMatchProtocols: initialData.attachMatchProtocols ?? false,
          expensesCoverage:
            initialData.expensesCoverage || getInitialExpensesCoverage(),
          hasEntryFee:
            initialData.financials.hasEntryFee ??
            Boolean(
              initialData.financials.entryFeeEUR &&
              initialData.financials.entryFeeEUR > 0
            ),
          entryFeePerPersonEUR:
            initialData.financials.entryFeeEUR && participantsCount > 0
              ? initialData.financials.entryFeeEUR / participantsCount
              : initialData.financials.entryFeeEUR || 0,
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
            hasEntryFee: false,
            isCommercialActivity: false,
          },
          vehicle: {
            distanceKm: 0,
          },
          status: "draft",
          orderDate: new Date().toISOString(),
          usDecision: "",
          usDecisionDate: new Date().toISOString().split("T")[0],
          usProtocolNumber: "",
          usDecisionNotes: "",
          reportText: "",
          attachMatchProtocols: false,
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

  const computeTotalEntryFee = (
    hasEntryFee: boolean,
    perPerson: number | undefined,
    count: number
  ): number => {
    if (!hasEntryFee) return 0;
    const rate = perPerson || 0;
    return count > 0 ? rate * count : rate;
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const selectedCoach = coachOptions.find(
        (c: Member) => c.id === values.coachId
      );
      const coachName = selectedCoach
        ? `${selectedCoach.firstName} ${selectedCoach.lastName}`
        : user?.displayName || "Неизвестен";
      const coachRole = selectedCoach?.isCoach ? "Треньор" : "Ръководител";

      const computedEntryFee = computeTotalEntryFee(
        Boolean(values.hasEntryFee),
        values.entryFeePerPersonEUR,
        participantsCount
      );

      const tripPayload = {
        ...values,
        coachName,
        coachRole,
        orderDate: values.orderDate,
        usDecision: values.usDecision?.trim() || undefined,
        usDecisionDate: values.usDecisionDate?.trim() || undefined,
        usProtocolNumber: values.usProtocolNumber?.trim() || undefined,
        usDecisionNotes: values.usDecisionNotes?.trim() || undefined,
        reportText: values.reportText?.trim() || undefined,
        attachMatchProtocols: Boolean(values.attachMatchProtocols),
        financials: {
          ...values.financials,
          hasEntryFee: Boolean(values.hasEntryFee),
          entryFeeEUR: computedEntryFee,
        },
      };

      if (isEditMode && initialData?.id) {
        // Режим Редактиране
        const defaultDecision = values.usDecision?.trim()
          ? values.usDecision.trim()
          : initialData.usDecision ||
            `${initialData.id.substring(0, 6).toUpperCase()}-УС`;
        await businessTripService.updateTrip(initialData.id, {
          ...tripPayload,
          usDecision: defaultDecision,
        } as any);
        toast.success("Командировката е актуализирана успешно!");
      } else {
        // Режим Създаване
        const newTripId = await businessTripService.createTrip({
          ...tripPayload,
          siteId: values.siteId || "default",
        } as any);

        if (!values.usDecision?.trim() && newTripId) {
          const autoDecision = `${newTripId.substring(0, 6).toUpperCase()}-УС`;
          await businessTripService.updateTrip(newTripId, {
            usDecision: autoDecision,
          });
        }
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
              ? "Редактиране на Решение на УС и Заповед за командировка"
              : "Създаване на Решение на УС и Заповед за командировка"}
          </DialogTitle>
          <DialogDescription>
            Въведете или коригирайте решението на Управителния съвет, състава на
            делегацията, финансовите параметри и транспортните условия за това
            състезание. Всички суми са в Евро (€).
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

              {/* ── РЕШЕНИЕ НА УПРАВИТЕЛНИЯ СЪВЕТ (УС) ── */}
              <div className="col-span-2 space-y-4 rounded-xl border border-blue-100 bg-blue-50/40 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-blue-600 dark:text-blue-400" />
                  <h4 className="text-sm font-semibold text-blue-950 dark:text-blue-200">
                    Решение на Управителния съвет (УС)
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground">
                  Данни за заседанието на Управителния съвет, на което е взето
                  решението за одобряване на участието и финансовото
                  обезпечаване.
                </p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <FormField
                    control={form.control as any}
                    name="usDecision"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel>Номер на Решение</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Напр. 12-УС или № 12"
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
                    name="usDecisionDate"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel>Дата на заседание на УС</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
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
                    name="usProtocolNumber"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel>Протокол № от заседание</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Напр. 05/2026"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control as any}
                  name="usDecisionNotes"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>
                        Допълнителни решения / бележки на УС (по избор)
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Въведете допълнителни точки от решението или специални указания на УС..."
                          rows={2}
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription className="text-[11px]">
                        Ако са въведени, ще се отпечатат като отделна точка в
                        Решението на УС (DOC 0).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="reportText"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>
                        Доклад за извършената работа / спортни резултати (по
                        избор)
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="По избор въведете текст на доклада (напр. по-ранно отпадане, 1 нощувка вместо 2, постигнати резултати). Ако остане празно, ще се генерира стандартен шаблон..."
                          rows={2}
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription className="text-[11px]">
                        Отпечатва се в Доклада за извършената работа (DOC 5).
                        Може да се редактира и по-късно през диалога за
                        управление.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="attachMatchProtocols"
                  render={({ field }: any) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="cursor-pointer text-xs font-medium">
                          Прилагам официални протоколи от срещите на
                          състезателите
                        </FormLabel>
                        <FormDescription className="text-[11px]">
                          Ако е отбелязано, протоколите от турнира се описват
                          автоматично като приложение към Доклада за извършената
                          работа.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

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
                        <SelectItem value="fuel_only">
                          🚗 Лично МПС (гориво)
                        </SelectItem>
                        <SelectItem value="club_paid">
                          🚌 Клубен / Нает транспорт
                        </SelectItem>
                        <SelectItem value="free">
                          🎫 Безплатен / Организиран транспорт
                        </SelectItem>
                        <SelectItem value="public">
                          🚆 Обществен транспорт (автобус/влак)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="mt-2 rounded bg-sky-50 p-2 text-[11px] leading-relaxed text-sky-700 dark:bg-sky-950/30 dark:text-sky-400">
                      {field.value === "fuel_only" && (
                        <>
                          🚗 <strong>Лично МПС:</strong> Избира се, когато
                          треньорът, родител или представител на клуба пътува
                          със собствен автомобил. В Заповедта се изписва марка,
                          рег. №, вид гориво и норма л/100 км{" "}
                          <strong>съгласно чл. 13 от НКС</strong>.
                          Счетоводството изисква фактура за гориво на името на
                          клуба и{" "}
                          <strong>попълнен Пътен лист/Отчет за гориво</strong>.
                        </>
                      )}
                      {field.value === "club_paid" && (
                        <>
                          🚌 <strong>Клубен / Нает транспорт:</strong> Избира
                          се, когато клубът използва собствен бус или наема
                          специализиран превозвач. В Заповедта се изписва
                          „клубен транспорт / нает превоз&quot;. Горивото или
                          наемът се отчитат с{" "}
                          <strong>
                            фактура директно към счетоводството на клуба
                          </strong>
                          . Пътните пари на участниците са 0.00 €.
                        </>
                      )}
                      {field.value === "free" && (
                        <>
                          🎫 <strong>Безплатен / Организиран транспорт:</strong>{" "}
                          Избира се, когато БФ Бадминтон, общината или домакинът
                          осигурява безплатен превоз. В Заповедта се изписва
                          „Транспортът е организиран и осигурен безплатно.&quot;
                          Колоната <strong>„Пътни пари&quot; е 0.00 €</strong>{" "}
                          за всички участници.
                        </>
                      )}
                      {field.value === "public" && (
                        <>
                          🚆 <strong>Обществен транспорт:</strong> Избира се при
                          пътуване с междуградски автобус или БДЖ. В Заповедта
                          се изписва „обществен транспорт (автобус / влак),
                          срещу оригинални билети&quot;. Счетоводството изисква{" "}
                          <strong>
                            физическите билети за отиване и връщане
                          </strong>{" "}
                          от всеки участник.
                        </>
                      )}
                      {!field.value && (
                        <>⚠️ Моля, изберете начин на придвижване.</>
                      )}
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
                        <SelectItem value="food_only">
                          Само дневни пари
                        </SelectItem>
                        <SelectItem value="food_and_sleep">
                          Дневни пари + Нощувки
                        </SelectItem>
                        <SelectItem value="transport_and_food">
                          Транспорт + Дневни пари
                        </SelectItem>
                        <SelectItem value="transport_food_sleep">
                          Транспорт + Дневни пари + Нощувки
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="mt-2 rounded bg-amber-50 p-2 text-[11px] leading-relaxed text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                      {field.value === "transport_only" && (
                        <>
                          🚗 <strong>Само транспорт:</strong> Клубът поема
                          единствено разходите за гориво или пътни билети.
                          Дневни и квартирни пари{" "}
                          <strong>НЕ се изплащат</strong>. Избира се за
                          еднодневен турнир наблизо, когато храната и нощувките
                          са за сметка на участниците.
                        </>
                      )}
                      {field.value === "food_only" && (
                        <>
                          🍽️ <strong>Само дневни пари:</strong> Клубът поема
                          дневните пари (€{" "}
                          {form.watch("financials.perDiemRateEUR")} / лице /
                          ден). Транспортът{" "}
                          <strong>е без разход за клуба</strong> – напр.
                          безплатен организиран бус или пътуване с федерационен
                          превоз. Нощувки не се поемат.
                        </>
                      )}
                      {field.value === "food_and_sleep" && (
                        <>
                          🛏️ <strong>Дневни пари + Нощувки:</strong> Клубът
                          поема дневните пари и квартирните разходи срещу
                          фактура. Транспортът е осигурен безплатно от
                          организатора или федерацията и{" "}
                          <strong>не се начислява</strong>. Пътните пари в
                          Ведомостта са 0.00 €.
                        </>
                      )}
                      {field.value === "transport_and_food" && (
                        <>
                          🚗🍽️ <strong>Транспорт + Дневни пари:</strong> Клубът
                          поема гориво/пътни и дневни пари за храна. Нощувки
                          <strong> не се поемат</strong> – напр. еднодневно или
                          с нощувка при роднини/приятели без хотелски разход.
                          Колоната „Квартирни&quot; е 0.00 €.
                        </>
                      )}
                      {field.value === "transport_food_sleep" && (
                        <>
                          ✅ <strong>Пълен пакет:</strong> Клубът поема всички
                          командировъчни разходи – транспорт, дневни пари и
                          квартирни (нощувки). Стандартен избор за многодневен
                          държавен или международен турнир с хотел и пътуване с
                          МПС. Ведомостта съдържа всички колони попълнени.
                        </>
                      )}
                      {!field.value && (
                        <>⚠️ Моля, изберете какви разходи поема клубът.</>
                      )}
                    </FormDescription>
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
