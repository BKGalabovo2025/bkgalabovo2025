"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { zodResolver } from "@hookform/resolvers/zod";
import { differenceInCalendarDays } from "date-fns";
import { AlertTriangle, FileText, Save } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
          participantsIds:
            initialData.participantsIds &&
            initialData.participantsIds.length > 0
              ? initialData.participantsIds
              : participantIds,
          usDecision: initialData.usDecision || "",
          usDecisionDate: initialData.usDecisionDate || "",
          usProtocolNumber: initialData.usProtocolNumber || "",
          usDecisionNotes: initialData.usDecisionNotes || "",
          usMeetingLocation: initialData.usMeetingLocation || "",
          usMeetingTime: initialData.usMeetingTime || "",
          usBoardMembers: initialData.usBoardMembers || "",
          usMeetingChair: initialData.usMeetingChair || "",
          usMeetingSecretary: initialData.usMeetingSecretary || "",
          protocolText: initialData.protocolText || "",
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
          usMeetingLocation: "",
          usMeetingTime: "",
          usBoardMembers: "",
          usMeetingChair: "",
          usMeetingSecretary: "",
          protocolText: "",
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

  const currentParticipantsIds: string[] =
    form.watch("participantsIds") && form.watch("participantsIds").length > 0
      ? form.watch("participantsIds")
      : initialData?.participantsIds && initialData.participantsIds.length > 0
        ? initialData.participantsIds
        : participantIds;

  const effectiveParticipantsList = currentParticipantsIds
    .map((id: string) => membersDict[id])
    .filter(Boolean) as Member[];

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

      const effectiveParticipantsIds: string[] =
        values.participantsIds && values.participantsIds.length > 0
          ? values.participantsIds
          : initialData?.participantsIds &&
              initialData.participantsIds.length > 0
            ? initialData.participantsIds
            : participantIds;

      const tripPayload = {
        ...values,
        participantsIds: effectiveParticipantsIds,
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
          : initialData.usDecision;
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

        // Номерът на заповедта/решението се присвоява автоматично от businessTripService.createTrip
        void newTripId;
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
      <DialogContent className="flex max-h-[92dvh] sm:max-h-[85vh] w-[calc(100%-1.25rem)] sm:w-full sm:max-w-2xl lg:max-w-3xl flex-col gap-0 overflow-hidden rounded-2xl sm:rounded-3xl border border-zinc-200/80 bg-white p-0 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 [&>button:last-child]:top-3.5 [&>button:last-child]:right-3.5 sm:[&>button:last-child]:top-4 sm:[&>button:last-child]:right-4">
        {/* Fixed Sticky Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-zinc-100 bg-zinc-50/50 px-4 py-3 sm:px-6 sm:py-4 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="flex items-center gap-3 pr-8">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
              <FileText className="size-4.5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="truncate text-base font-bold text-zinc-900 sm:text-lg dark:text-white">
                {isEditMode
                  ? "Редактиране на Решение на УС и Заповед за командировка"
                  : "Създаване на Решение на УС и Заповед за командировка"}
              </DialogTitle>
              <DialogDescription className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                Решение на УС, делегация, финансови параметри и транспорт (в €)
              </DialogDescription>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit as any)}
            className="flex flex-1 flex-col overflow-hidden min-h-0"
          >
            <div className="custom-scrollbar flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-6 min-h-0">
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
                              placeholder="Автоматично (напр. 1-ПР) или ръчно"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control as any}
                      name="usMeetingTime"
                      render={({ field }: any) => (
                        <FormItem>
                          <FormLabel>Час на заседание на УС</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="напр. 18:00 ч."
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
                      name="usMeetingLocation"
                      render={({ field }: any) => (
                        <FormItem>
                          <FormLabel>Място на провеждане</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="напр. гр. Гълъбово, в седалището"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control as any}
                      name="usMeetingChair"
                      render={({ field }: any) => (
                        <FormItem>
                          <FormLabel>Председателстващ заседанието</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Име на председателя (по подразбиране: МОЛ)"
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
                      name="usMeetingSecretary"
                      render={({ field }: any) => (
                        <FormItem>
                          <FormLabel>Протоколчик</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Име на протоколчика"
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
                    name="usBoardMembers"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel>Присъстващи членове на УС</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Списък с присъстващи членове на УС за Протокола..."
                            rows={2}
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription className="text-[11px]">
                          Ако не е попълнено, ще се използва стандартният кворум
                          на клуба.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                            автоматично като приложение към Доклада за
                            извършената работа.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="col-span-2 flex flex-col justify-center space-y-2 rounded-md border p-3 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">
                      Командировани състезатели (
                      {effectiveParticipantsList.length})
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {effectiveParticipantsList.length} състезатели
                    </Badge>
                  </div>
                  {effectiveParticipantsList.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {effectiveParticipantsList.map((m) => (
                        <Badge
                          key={m.id}
                          variant="secondary"
                          className="text-xs font-normal px-2 py-0.5"
                        >
                          {m.firstName} {m.lastName}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">
                      Няма добавени състезатели към събитието.
                    </span>
                  )}
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
                            🚗 Лично МПС (с разрешение в Заповедта)
                          </SelectItem>
                          <SelectItem value="club_paid">
                            🚌 Клубен / Нает транспорт
                          </SelectItem>
                          <SelectItem value="free">
                            🎫 Безплатен / Организиран транспорт
                          </SelectItem>
                          <SelectItem value="public">
                            🚆 Обществен транспорт (влак, автобус, самолет)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription className="mt-2 rounded bg-sky-50 p-2 text-[11px] leading-relaxed text-sky-700 dark:bg-sky-950/30 dark:text-sky-400">
                        {field.value === "fuel_only" && (
                          <>
                            🚗 <strong>Лично МПС:</strong> Избира се при
                            пътуване с личен автомобил. В Заповедта се вписва
                            изрично разрешение за ползване на лично МПС с
                            посочените данни (марка, рег. №, вид гориво и
                            разходна норма). Разходът за гориво се отчита по
                            официални норми срещу представен Пътен лист (Отчет
                            за гориво) и разходооправдателен документ
                            (фактура/касов бон за гориво на името на клуба).
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
                            🎫{" "}
                            <strong>Безплатен / Организиран транспорт:</strong>{" "}
                            Избира се, когато БФ Бадминтон, общината или
                            домакинът осигурява безплатен превоз. В Заповедта се
                            изписва „Транспортът е организиран и осигурен
                            безплатно.&quot; Колоната{" "}
                            <strong>„Пътни пари&quot; е 0.00 €</strong> за
                            всички участници.
                          </>
                        )}
                        {field.value === "public" && (
                          <>
                            🚆{" "}
                            <strong>
                              Обществен транспорт (влак, автобус, самолет):
                            </strong>{" "}
                            Избира се при пътуване с обществен транспорт. В
                            Заповедта се разпорежда представяне на оригинални
                            билети за отиване и връщане от командированите лица.
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

                {/* Режим на пътуване (Ежедневно прибиране без нощувка VS Еднократно с престой) */}
                <div className="col-span-2 rounded-xl border border-amber-200/80 bg-amber-50/50 p-4 space-y-3 dark:border-amber-900/50 dark:bg-amber-950/20">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-semibold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                        🔄 Режим на пътуване
                      </FormLabel>
                      <p className="text-xs text-amber-800/90 dark:text-amber-300/80">
                        Определя дали отборът пътува всеки състезателен ден (без
                        нощувка) или отива еднократно с преспиване на място.
                      </p>
                    </div>
                  </div>

                  <FormField
                    control={form.control as any}
                    name="vehicle.commuteMode"
                    render={({ field }: any) => (
                      <FormItem className="space-y-2">
                        <Select
                          value={field.value || "single"}
                          onValueChange={(val) => {
                            field.onChange(val);
                            const singleKm =
                              form.getValues("vehicle.singleRoundTripKm") ||
                              form.getValues("vehicle.distanceKm") ||
                              0;
                            const plannedDays = Math.max(
                              1,
                              differenceInCalendarDays(
                                new Date(
                                  form.getValues("endDate") || event.endDate
                                ),
                                new Date(
                                  form.getValues("startDate") || event.startDate
                                )
                              ) + 1
                            );
                            if (val === "daily_commute") {
                              if (
                                !form.getValues("vehicle.singleRoundTripKm") &&
                                singleKm > 0
                              ) {
                                form.setValue(
                                  "vehicle.singleRoundTripKm",
                                  singleKm
                                );
                              }
                              form.setValue(
                                "vehicle.plannedTripsCount",
                                plannedDays
                              );
                              form.setValue(
                                "vehicle.distanceKm",
                                singleKm * plannedDays
                              );
                            } else {
                              form.setValue("vehicle.plannedTripsCount", 1);
                              form.setValue("vehicle.distanceKm", singleKm);
                            }
                          }}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white dark:bg-zinc-900">
                              <SelectValue placeholder="Изберете режим" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="single">
                              🏨 Еднократно пътуване (1 курс с престой /
                              преспиване на място)
                            </SelectItem>
                            <SelectItem value="daily_commute">
                              🚗 Ежедневно пътуване (всеки ден отиване и връщане
                              без нощувка)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-[11px] leading-relaxed text-amber-900 dark:text-amber-200">
                          {field.value === "daily_commute" ? (
                            <>
                              ✓ <strong>Ежедневно пътуване:</strong> Отборът се
                              връща в Гълъбово след всеки състезателен ден
                              (напр. турнири в Първомай, Хасково, Казанлък).
                              Въведете разстоянието за{" "}
                              <strong>1 пълен курс (отиване и връщане)</strong>{" "}
                              — системата автоматично го умножава по броя
                              състезателни дни. При по-ранно отпадане, курсовете
                              се коригират лесно във ведомостта!
                            </>
                          ) : (
                            <>
                              ✓ <strong>Еднократно пътуване:</strong> Отборът
                              отива в началото и се връща в края на участието
                              (общо 1 курс отиване и връщане, напр. турнир в
                              София или Варна). Дори клубът да не поема нощувки
                              (напр. безплатен хотел или спане при близки),
                              курсът остава точно един.
                            </>
                          )}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Полета за километри според избрания режим */}
                  {form.watch("vehicle.commuteMode") === "daily_commute" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <FormField
                        control={form.control as any}
                        name="vehicle.singleRoundTripKm"
                        render={({ field }: any) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium">
                              Разстояние за 1 пълен курс (отиване и връщане в
                              км)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Напр. 140 (Гълъбово - Първомай - Гълъбово)"
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  field.onChange(val);
                                  const plannedDays = Math.max(
                                    1,
                                    differenceInCalendarDays(
                                      new Date(
                                        form.getValues("endDate") ||
                                          event.endDate
                                      ),
                                      new Date(
                                        form.getValues("startDate") ||
                                          event.startDate
                                      )
                                    ) + 1
                                  );
                                  form.setValue(
                                    "vehicle.plannedTripsCount",
                                    plannedDays
                                  );
                                  form.setValue(
                                    "vehicle.distanceKm",
                                    val * plannedDays
                                  );
                                }}
                              />
                            </FormControl>
                            <FormDescription className="text-[10px]">
                              Въведете общо за 1 ден (отиване до турнира +
                              връщане вкъщи).
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control as any}
                        name="vehicle.distanceKm"
                        render={({ field }: any) => {
                          const plannedDays = Math.max(
                            1,
                            differenceInCalendarDays(
                              new Date(
                                form.getValues("endDate") || event.endDate
                              ),
                              new Date(
                                form.getValues("startDate") || event.startDate
                              )
                            ) + 1
                          );
                          return (
                            <FormItem>
                              <FormLabel className="text-xs font-medium">
                                Общо планирани км ({plannedDays}{" "}
                                {plannedDays === 1 ? "курс" : "курса"})
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  readOnly
                                  className="bg-zinc-100 font-semibold dark:bg-zinc-800"
                                  {...field}
                                  value={field.value ?? ""}
                                />
                              </FormControl>
                              <FormDescription className="text-[10px]">
                                Изчислява се автоматично: {plannedDays} дни × 1
                                курс.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                    </div>
                  ) : (
                    <FormField
                      control={form.control as any}
                      name="vehicle.distanceKm"
                      render={({ field }: any) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium">
                            Общо разстояние (в двете посоки в км)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Напр. 500 (Гълъбово - София - Гълъбово)"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                field.onChange(val);
                                form.setValue("vehicle.singleRoundTripKm", val);
                                form.setValue("vehicle.plannedTripsCount", 1);
                              }}
                            />
                          </FormControl>
                          <FormDescription className="text-[10px]">
                            Въведете общите километри за целия турнир (отиване в
                            началото + прибиране в края).
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {transportType === "public" && (
                  <div className="col-span-2 rounded-xl border border-sky-200 bg-sky-50/70 p-4 space-y-3 dark:border-sky-900/50 dark:bg-sky-950/20">
                    <FormLabel className="text-sm font-semibold text-sky-950 dark:text-sky-200 flex items-center gap-1.5">
                      🚆 Обществен транспорт — билети
                    </FormLabel>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FormField
                        control={form.control as any}
                        name="publicTransportDailyFareEUR"
                        render={({ field }: any) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium">
                              Цена на двупосочен билет за 1 човек за 1 ден (€)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.5"
                                placeholder="Напр. 8.00"
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormDescription className="text-[10px]">
                              Стойност на билета за отиване и връщане на 1
                              състезател/треньор.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {transportType === "fuel_only" && (
                  <>
                    <div className="col-span-2 rounded-lg border border-sky-200 bg-sky-50/80 p-3 text-xs text-sky-900 dark:border-sky-900/50 dark:bg-sky-950/20 dark:text-sky-200">
                      <p className="font-semibold">
                        ✓ Изрично разрешение за лично МПС в Заповедта:
                      </p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-sky-800 dark:text-sky-300">
                        В Заповедта за командировка ще бъде вписано изрично
                        разрешение за използване на лично МПС с посочените
                        данни. Разходът за гориво се отчита по официални
                        разходни норми срещу пътен лист и разходооправдателен
                        документ.
                      </p>
                    </div>
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
                            еднодневен турнир наблизо, когато храната и
                            нощувките са за сметка на участниците.
                          </>
                        )}
                        {field.value === "food_only" && (
                          <>
                            🍽️ <strong>Само дневни пари:</strong> Клубът поема
                            дневните пари (€{" "}
                            {form.watch("financials.perDiemRateEUR")} / лице /
                            ден). Транспортът{" "}
                            <strong>е без разход за клуба</strong> – напр.
                            безплатен организиран бус или пътуване с
                            федерационен превоз. Нощувки не се поемат.
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
                            🚗🍽️ <strong>Транспорт + Дневни пари:</strong>{" "}
                            Клубът поема гориво/пътни и дневни пари за храна.
                            Нощувки
                            <strong> не се поемат</strong> – напр. еднодневно
                            или с нощувка при роднини/приятели без хотелски
                            разход. Колоната „Квартирни&quot; е 0.00 €.
                          </>
                        )}
                        {field.value === "transport_food_sleep" && (
                          <>
                            ✅ <strong>Пълен пакет:</strong> Клубът поема всички
                            командировъчни разходи – транспорт, дневни пари и
                            квартирни (нощувки). Стандартен избор за многодневен
                            държавен или международен турнир с хотел и пътуване
                            с МПС. Ведомостта съдържа всички колони попълнени.
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
                              e.target.value
                                ? Number(e.target.value)
                                : undefined
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription className="mt-2 rounded bg-blue-50 p-2 text-[11px] leading-tight text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
                        💡 Оставете празно, за да се ползва сумата по закон (€
                        {form.watch("financials.perDiemRateEUR")}). Това е
                        сумата <strong>НА ЧОВЕК за 1 ДЕН</strong>.
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
                        <FormLabel className="text-base">
                          Входна такса
                        </FormLabel>
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
                        <FormLabel>
                          Входна такса за 1 състезател (EUR)
                        </FormLabel>
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
                            {((field.value || 0) * participantsCount).toFixed(
                              2
                            )}{" "}
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
                              ? new Date(field.value)
                                  .toISOString()
                                  .split("T")[0]
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
                      <p className="font-semibold">
                        Юридическо несъответствие!
                      </p>
                      <p>
                        Датата на заповедта (
                        {watchedOrderDate
                          ? new Date(watchedOrderDate).toLocaleDateString(
                              "bg-BG"
                            )
                          : "—"}
                        ) е СЛЕД датата на събитието (
                        {new Date(event.startDate).toLocaleDateString("bg-BG")})
                        . По Наредбата за командировките, заповедта трябва да
                        бъде издадена <strong>преди</strong> започването на
                        пътуването.
                      </p>
                      <p className="text-amber-600 dark:text-amber-400">
                        Можете да продължите запазването, но документът за тази
                        командировка може да не бъде приет от счетоводството.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Fixed Sticky Footer */}
            <div className="shrink-0 flex items-center justify-end gap-2.5 border-t border-zinc-100 bg-zinc-50/80 px-4 py-3 sm:px-6 sm:py-3.5 dark:border-zinc-800 dark:bg-zinc-900/60">
              <Button
                type="button"
                variant="ghost"
                className="h-10 rounded-xl px-5 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                onClick={() => onOpenChange(false)}
              >
                Отказ
              </Button>
              <Button
                type="submit"
                className="h-10 rounded-xl bg-zinc-900 px-6 text-xs font-bold text-white shadow-sm transition-all hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
              >
                <Save className="mr-2 size-4" />
                {isEditMode ? "Запази промените" : "Създай Чернова"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
