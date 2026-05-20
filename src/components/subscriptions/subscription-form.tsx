/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, Loader2 } from "lucide-react";
import { Member, Subscription, ClubService } from "@/types";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { MembershipSuggestions } from "./MembershipSuggestions";
import { getSubscriptionsByMemberId } from "@/services/subscription-service";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const subscriptionSchema = z
  .object({
    memberId: z.string().min(1, "Моля, изберете член."),
    serviceId: z.string().min(1, "Моля, изберете услуга."),
    status: z.enum(["active", "inactive", "cancelled", "pending_payment"]),
    pricePaid: z
      .number()
      .min(0, { message: "Сумата не може да бъде отрицателна." }),
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Моля, въведете валидна начална дата.",
    }),
    endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Моля, въведете валидна крайна дата.",
    }),
    paymentHistory: z.array(
      z.object({
        date: z.string(),
        amount: z.number(),
        paymentId: z.string(),
      })
    ),
    paymentsMadeCount: z.number(),
    licenseGranted: z.boolean(),
    apparelGranted: z.boolean(),
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: "Крайната дата не може да бъде преди началната.",
    path: ["endDate"],
  });

type SubscriptionFormValues = z.infer<typeof subscriptionSchema>;

interface SubscriptionFormProps {
  members: Member[];
  services: ClubService[];
  onSave: (data: Omit<Subscription, "id" | "siteId">) => void;
  onClose: () => void;
  initialData?: Subscription;
  isSaving?: boolean;
}

export function SubscriptionForm({
  members,
  services,
  onSave,
  onClose,
  initialData,
  isSaving,
}: SubscriptionFormProps) {
  const [periodMonth, setPeriodMonth] = useState(() =>
    initialData
      ? initialData.startDate.substring(0, 7)
      : new Date().toISOString().substring(0, 7)
  );
  const [periodYear, setPeriodYear] = useState(() =>
    initialData
      ? new Date(initialData.startDate).getFullYear().toString()
      : new Date().getFullYear().toString()
  );
  const [periodDate, setPeriodDate] = useState(() =>
    initialData
      ? initialData.startDate.substring(0, 10)
      : new Date().toISOString().substring(0, 10)
  );
  const [customServiceName, setCustomServiceName] = useState<
    string | undefined
  >(undefined);
  const [customPrice, setCustomPrice] = useState<number | undefined>(undefined);

  const form = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          startDate: initialData.startDate.split("T")[0],
          endDate: initialData.endDate.split("T")[0],
        }
      : {
          memberId: "",
          serviceId: "",
          status: "pending_payment",
          pricePaid: 0,
          startDate: new Date().toISOString().split("T")[0],
          endDate: new Date(
            new Date().setFullYear(new Date().getFullYear() + 1)
          )
            .toISOString()
            .split("T")[0], // Default to one year from now
          paymentHistory: [],
          paymentsMadeCount: 0,
          licenseGranted: false,
          apparelGranted: false,
        },
  });

  const selectedServiceId = useWatch({
    control: form.control,
    name: "serviceId",
  });
  const startDate = useWatch({ control: form.control, name: "startDate" });
  const endDate = useWatch({ control: form.control, name: "endDate" });
  const selectedMemberId = useWatch({
    control: form.control,
    name: "memberId",
  });
  const selectedMemberObj = members.find((m) => m.id === selectedMemberId);
  const selectedServiceObj = services.find((s) => s.id === selectedServiceId);
  const billingPeriod = selectedServiceObj?.billingPeriod || null;

  const [memberSubscriptions, setMemberSubscriptions] = useState<
    Subscription[]
  >([]);

  useEffect(() => {
    let isMounted = true;
    if (selectedMemberId) {
      getSubscriptionsByMemberId(selectedMemberId)
        .then((subs) => {
          if (isMounted) setMemberSubscriptions(subs);
        })
        .catch(() => {
          if (isMounted) setMemberSubscriptions([]);
        });
    } else {
      setMemberSubscriptions([]);
    }
    return () => {
      isMounted = false;
    };
  }, [selectedMemberId]);

  useEffect(() => {
    if (!billingPeriod) {
      form.setValue("startDate", periodDate);
      form.setValue("endDate", periodDate);
    } else if (billingPeriod === "Месечен") {
      const [y, m] = periodMonth.split("-");
      if (y && m) {
        form.setValue("startDate", `${y}-${m}-01`);
        const lastDay = new Date(parseInt(y), parseInt(m), 0).getDate();
        form.setValue(
          "endDate",
          `${y}-${m}-${lastDay.toString().padStart(2, "0")}`
        );
      }
    } else if (billingPeriod === "Годишен") {
      if (periodYear) {
        form.setValue("startDate", `${periodYear}-01-01`);
        form.setValue("endDate", `${periodYear}-12-31`);
      }
    }
  }, [billingPeriod, periodMonth, periodYear, periodDate, form]);

  const [step, setStep] = useState(1);

  const onSubmit = (data: SubscriptionFormValues) => {
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    const selectedService = services.find((s) => s.id === data.serviceId);
    if (!selectedService) {
      form.setError("serviceId", {
        type: "manual",
        message: "Моля, изберете валидна услуга.",
      });
      return;
    }

    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    let totalPaymentsCount = 0;

    if (selectedService.billingPeriod === "Месечен") {
      const monthDiff =
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth());
      totalPaymentsCount = monthDiff + 1;
    } else if (selectedService.billingPeriod === "Годишен") {
      totalPaymentsCount = end.getFullYear() - start.getFullYear() + 1;
    } else {
      totalPaymentsCount = 1;
    }

    const subscriptionData: Omit<Subscription, "id" | "siteId"> = {
      ...data,
      price: customPrice ?? selectedService.price,
      serviceName: customServiceName ?? selectedService.name,
      totalPaymentsCount: totalPaymentsCount,
      currency: selectedService.currency,
    };
    onSave(subscriptionData);
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8 px-2">
      {[
        { n: 1, label: "Член" },
        { n: 2, label: "План" },
        { n: 3, label: "Плащане" },
      ].map((s) => (
        <div
          key={s.n}
          className="flex flex-col items-center gap-2 flex-1 relative"
        >
          <div
            className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all z-10",
              step === s.n
                ? "bg-zinc-950 text-white shadow-lg scale-110"
                : step > s.n
                  ? "bg-emerald-500 text-white"
                  : "bg-zinc-100 text-zinc-400"
            )}
          >
            {step > s.n ? "✓" : s.n}
          </div>
          <span
            className={cn(
              "text-[9px] uppercase tracking-widest font-bold",
              step >= s.n ? "text-zinc-900" : "text-zinc-400"
            )}
          >
            {s.label}
          </span>
          {s.n < 3 && (
            <div
              className={cn(
                "absolute top-4 left-[60%] w-[80%] h-px",
                step > s.n ? "bg-emerald-500" : "bg-zinc-100"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {renderStepIndicator()}

        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <FormField
              control={form.control}
              name="memberId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">
                    Изберете член на клуба
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="rounded-xl h-12 border-zinc-100 bg-zinc-50/50">
                        <SelectValue placeholder="Търсене на член..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-xl border-zinc-100">
                      {members.map((member) => (
                        <SelectItem
                          key={member.id}
                          value={member.id}
                          className="rounded-lg"
                        >
                          {member.firstName} {member.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedMemberObj ? (
              <div className="animate-in fade-in zoom-in-95 duration-500">
                <MembershipSuggestions
                  member={selectedMemberObj}
                  services={services}
                  memberSubscriptions={memberSubscriptions}
                  onSelectService={(serviceId, price, suggestedName, month) => {
                    form.setValue("serviceId", serviceId);
                    form.setValue("pricePaid", price);
                    setCustomPrice(price);
                    if (suggestedName) {
                      setCustomServiceName(suggestedName);
                    }
                    if (month) {
                      setPeriodMonth(month);
                    }
                    setStep(2);
                    toast.success("Интелигентно предложение приложено!");
                  }}
                />
              </div>
            ) : (
              <div className="p-8 border border-dashed border-zinc-200 rounded-3xl text-center bg-zinc-50/30">
                <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-medium">
                  Изберете член, за да видите умни предложения
                </p>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <FormField
              control={form.control}
              name="serviceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">
                    Изберете услуга от каталога
                  </FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      const service = services.find((s) => s.id === value);
                      if (service) {
                        form.setValue("pricePaid", service.price);
                      }
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="rounded-xl h-12 border-zinc-100 bg-zinc-50/50">
                        <SelectValue placeholder="Изберете услуга" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-xl border-zinc-100">
                      {services.map((service) => (
                        <SelectItem
                          key={service.id}
                          value={service.id}
                          className="rounded-lg"
                        >
                          {service.name} — {service.price} {service.currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedServiceId && (
              <div className="space-y-6 p-6 rounded-3xl bg-zinc-50/50 border border-zinc-100 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">
                    Период на валидност
                  </h3>
                  <Badge
                    variant="outline"
                    className="bg-white rounded-full text-[9px] uppercase font-bold text-primary border-primary/20"
                  >
                    {billingPeriod || "Еднократно"}
                  </Badge>
                </div>

                {billingPeriod === "Месечен" && (
                  <FormItem>
                    <FormLabel className="text-[11px] font-medium text-zinc-600">
                      Месец на валидност
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="month"
                        className="rounded-xl border-zinc-100 bg-white"
                        value={periodMonth}
                        onChange={(e) => setPeriodMonth(e.target.value)}
                      />
                    </FormControl>
                  </FormItem>
                )}

                {billingPeriod === "Годишен" && (
                  <FormItem>
                    <FormLabel className="text-[11px] font-medium text-zinc-600">
                      Година на валидност
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        className="rounded-xl border-zinc-100 bg-white"
                        min="2020"
                        max="2100"
                        value={periodYear}
                        onChange={(e) => setPeriodYear(e.target.value)}
                      />
                    </FormControl>
                  </FormItem>
                )}

                {!billingPeriod && (
                  <FormItem>
                    <FormLabel className="text-[11px] font-medium text-zinc-600">
                      Дата на посещение
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="rounded-xl border-zinc-100 bg-white"
                        value={periodDate}
                        onChange={(e) => setPeriodDate(e.target.value)}
                      />
                    </FormControl>
                  </FormItem>
                )}

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="p-3 bg-white rounded-2xl border border-zinc-100">
                    <p className="text-[8px] uppercase tracking-widest text-zinc-400 font-bold mb-1">
                      От дата
                    </p>
                    <p className="text-xs font-semibold">
                      {new Date(startDate).toLocaleDateString("bg-BG")}
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-2xl border border-zinc-100">
                    <p className="text-[8px] uppercase tracking-widest text-zinc-400 font-bold mb-1">
                      До дата
                    </p>
                    <p className="text-xs font-semibold">
                      {new Date(endDate).toLocaleDateString("bg-BG")}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="p-6 rounded-3xl bg-zinc-950 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <CheckCircle className="h-24 w-24" />
              </div>
              <p className="text-[10px] uppercase tracking-widest font-black text-zinc-500 mb-4">
                Резюме на плащането
              </p>
              <div className="space-y-4 relative z-10">
                <div>
                  <h4 className="text-xl font-light">
                    {selectedMemberObj?.firstName} {selectedMemberObj?.lastName}
                  </h4>
                  <p className="text-zinc-400 text-xs mt-1">
                    {selectedServiceObj?.name}
                  </p>
                </div>
                <div className="pt-4 border-t border-white/10 flex items-end justify-between">
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">
                      Обща сума
                    </p>
                    <p className="text-3xl font-black tracking-tighter">
                      {form.getValues("pricePaid")}{" "}
                      {selectedServiceObj?.currency || "EUR"}
                    </p>
                  </div>
                  <Badge className="bg-emerald-500 text-white border-none rounded-full px-3 py-1 text-[10px] font-black uppercase mb-1">
                    {form.getValues("status") === "active"
                      ? "Платено"
                      : "Чакащо"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="pricePaid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">
                      Потвърдете сума
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        className="rounded-xl h-11 border-zinc-100 bg-zinc-50/50"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value, 10) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">
                      Статус на плащане
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="rounded-xl h-11 border-zinc-100 bg-zinc-50/50">
                          <SelectValue placeholder="Изберете статус" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl">
                        <SelectItem
                          value="active"
                          className="text-emerald-600 font-bold"
                        >
                          Платено / Активно
                        </SelectItem>
                        <SelectItem value="pending_payment">
                          Чакащо плащане
                        </SelectItem>
                        <SelectItem value="inactive">Изтекло</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        <input type="hidden" {...form.register("startDate")} />
        <input type="hidden" {...form.register("endDate")} />

        <div className="flex justify-between items-center pt-6 border-t border-zinc-100 mt-8">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="rounded-xl border-zinc-200 text-xs font-bold uppercase tracking-widest h-11 px-6 hover:bg-zinc-50"
            >
              Назад
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="rounded-xl text-xs font-bold uppercase tracking-widest h-11 px-6"
            >
              Отказ
            </Button>
          )}

          <Button
            type="submit"
            disabled={
              isSaving ||
              (step === 1 && !selectedMemberId) ||
              (step === 2 && !selectedServiceId)
            }
            className={cn(
              "rounded-xl text-xs font-bold uppercase tracking-widest h-11 px-10 transition-all",
              step === 3
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
                : "bg-zinc-950 text-white hover:bg-zinc-800"
            )}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {step === 3 ? "Финализиране" : "Продължи"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
