"use client";

import React, { useState, useEffect, useMemo } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  createReservationAction,
  updateReservationAction,
} from "@/lib/actions/reservations";
import { useAuth } from "@/context/auth-context";
import { formatPrice } from "@/lib/currency";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { useAppStore } from "@/store/use-app-store";
import { toast } from "sonner";
import { Reservation } from "@/types/reservation";

const reservationSchema = z
  .object({
    clientName: z
      .string()
      .min(2, { message: "Името трябва да е поне 2 символа." }),
    clientPhone: z.string().min(9, { message: "Невалиден телефонен номер." }),
    clientEmail: z.string().email({ message: "Невалиден имейл адрес." }),
    courtId: z.number().min(1, { message: "Моля, изберете корт" }).max(6),
    startTime: z.date(),
    endTime: z.date(),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "Крайният час трябва да е след началния.",
    path: ["endTime"],
  });

interface ReservationDialogProps {
  children: React.ReactNode;
  reservation?: Reservation; // Existing reservation for edit mode
  initialData?: Partial<z.infer<typeof reservationSchema>>; // For pre-filling new reservations
  onSave?: () => void; // Callback to refresh data
}

export const ReservationDialog: React.FC<ReservationDialogProps> = ({
  children,
  reservation,
  initialData,
  onSave,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const COURT_PRICE_PER_HOUR = 10;

  const isEditMode = !!reservation;
  const { idToken } = useAuth();
  const { activeBranch } = useAppStore();

  const form = useForm<z.infer<typeof reservationSchema>>({
    resolver: zodResolver(reservationSchema),
  });

  const { reset, control } = form;
  const startTime = useWatch({ control, name: "startTime" });
  const endTime = useWatch({ control, name: "endTime" });

  const price = useMemo(() => {
    if (startTime && endTime && endTime > startTime) {
      const durationHours =
        (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      return durationHours * COURT_PRICE_PER_HOUR;
    }
    return 0;
  }, [startTime, endTime]);

  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        reset({
          ...reservation,
          startTime: reservation.startTime.toDate(),
          endTime: reservation.endTime.toDate(),
        });
      } else {
        reset({
          clientName: "",
          clientPhone: "",
          clientEmail: "",
          ...initialData,
        });
      }
    }
  }, [isOpen, isEditMode, reservation, initialData, reset]);

  async function onSubmit(values: z.infer<typeof reservationSchema>) {
    if (!idToken) {
      toast.error("Грешка при оторизация");
      return;
    }

    setIsSaving(true);
    try {
      const dataToSave = {
        ...values,
        siteId: activeBranch,
        startTime: values.startTime.toISOString(),
        endTime: values.endTime.toISOString(),
        totalPrice: price,
        currency: "EUR",
      };

      let result;
      if (isEditMode) {
        result = await updateReservationAction(
          idToken,
          reservation.id,
          dataToSave
        );
      } else {
        result = await createReservationAction(idToken, {
          ...dataToSave,
          status: "unpaid",
        });
      }

      if (result.success) {
        toast.success(result.message);
        onSave?.();
        setIsOpen(false);
      } else {
        toast.error("Грешка", { description: result.message });
      }
    } catch (error) {
      console.error("Failed to save reservation:", error);
      toast.error("Възникна системна грешка при запазването.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Редактиране на резервация" : "Нова резервация"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Променете данните по-долу и кликнете 'Запази промените'."
              : "Попълнете данните, за да създадете нова резервация."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="clientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Име на клиент</FormLabel>
                  <FormControl>
                    <Input placeholder="Иван Иванов" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="clientPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Телефон</FormLabel>
                    <FormControl>
                      <Input placeholder="0888123456" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="clientEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Имейл</FormLabel>
                    <FormControl>
                      <Input placeholder="ivan@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="courtId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Корт</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(parseInt(value, 10))
                    }
                    value={field.value ? String(field.value) : ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Изберете корт..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.from({ length: 6 }, (_, i) => i + 1).map((num) => (
                        <SelectItem key={num} value={String(num)}>
                          Корт {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <DateTimePicker
                control={form.control}
                name="startTime"
                label="Начален час"
              />
              <DateTimePicker
                control={form.control}
                name="endTime"
                label="Краен час"
              />
            </div>
            <div className="pt-6 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
              <span className="text-[10px] font-medium uppercase tracking-widest3 text-zinc-400">
                Крайна сума
              </span>
              <div className="text-4xl font-light tracking-tight text-zinc-900 dark:text-zinc-100">
                {formatPrice(price)}
              </div>
            </div>
            <DialogFooter className="pt-6 gap-3">
              <Button
                type="button"
                variant="ghost"
                className="rounded-xl px-8 font-medium uppercase tracking-widest text-[11px] text-zinc-400 hover:text-zinc-900"
                onClick={() => setIsOpen(false)}
              >
                Отказ
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-primary hover:bg-primary/90 text-white rounded-xl px-8 font-medium uppercase tracking-widest text-[11px] shadow-none"
              >
                {isSaving && (
                  <Loader2
                    className="mr-2 h-3 w-3 animate-spin"
                    strokeWidth={2}
                  />
                )}
                {isEditMode ? "Запази промените" : "Запази резервация"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
