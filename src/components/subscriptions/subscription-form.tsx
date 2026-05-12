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
import { Loader2 } from "lucide-react";
import { Member, Subscription, ClubService } from "@/types";
import { useState, useEffect } from "react";

const subscriptionSchema = z
  .object({
    memberId: z.string().min(1, "Моля, изберете член."),
    serviceId: z.string().min(1, "Моля, изберете услуга."),
    status: z.enum(["active", "inactive", "cancelled", "pending_payment"]),
    pricePaid: z
      .number()
      .min(1, { message: "Сумата трябва да е положително число." }),
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
  const selectedServiceObj = services.find((s) => s.id === selectedServiceId);
  const billingPeriod = selectedServiceObj?.billingPeriod || null;

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

  const onSubmit = (data: SubscriptionFormValues) => {
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
      price: selectedService.price,
      serviceName: selectedService.name,
      totalPaymentsCount: totalPaymentsCount,
      currency: selectedService.currency,
    };
    onSave(subscriptionData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="memberId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Член</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Изберете член" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.firstName} {member.lastName}
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
          name="serviceId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Услуга</FormLabel>
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
                  <SelectTrigger>
                    <SelectValue placeholder="Изберете услуга" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
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
          name="pricePaid"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Платена сума</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="1"
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
              <FormLabel>Статус</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Изберете статус" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Активен</SelectItem>
                  <SelectItem value="pending_payment">
                    Чакащо плащане
                  </SelectItem>
                  <SelectItem value="inactive">Изтекъл</SelectItem>
                  <SelectItem value="cancelled">Анулиран</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedServiceId && (
          <div className="space-y-4 rounded-md bg-blue-50/50 p-4 border border-blue-100">
            <h3 className="text-sm font-semibold text-blue-900">
              Период на валидност
            </h3>
            {billingPeriod === "Месечен" && (
              <FormItem>
                <FormLabel>За кой месец се отнася?</FormLabel>
                <FormControl>
                  <Input
                    type="month"
                    value={periodMonth}
                    onChange={(e) => setPeriodMonth(e.target.value)}
                  />
                </FormControl>
              </FormItem>
            )}
            {billingPeriod === "Годишен" && (
              <FormItem>
                <FormLabel>За коя година се отнася?</FormLabel>
                <FormControl>
                  <Input
                    type="number"
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
                <FormLabel>Дата на посещение</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={periodDate}
                    onChange={(e) => setPeriodDate(e.target.value)}
                  />
                </FormControl>
              </FormItem>
            )}
            <div className="text-xs text-blue-700/80 pt-2 font-medium flex flex-col gap-1">
              <span>
                Начало: <b>{new Date(startDate).toLocaleDateString("bg-BG")}</b>
              </span>
              <span>
                Край: <b>{new Date(endDate).toLocaleDateString("bg-BG")}</b>
              </span>
            </div>
          </div>
        )}

        <input type="hidden" {...form.register("startDate")} />
        <input type="hidden" {...form.register("endDate")} />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Отказ
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Запис
          </Button>
        </div>
      </form>
    </Form>
  );
}
