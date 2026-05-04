"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Timestamp } from "firebase/firestore";
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
import { Loader2, Plus } from "lucide-react";
import { createReservation, updateReservation } from "@/lib/reservations";
import { toast } from "sonner";
import { getCourtPrice } from "@/services/general-services";
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
  const [courtPricePerHour, setCourtPricePerHour] = useState<number>(10);

  useEffect(() => {
    const fetchPrice = async () => {
      const price = await getCourtPrice();
      setCourtPricePerHour(price);
    };
    if (isOpen) {
      fetchPrice();
    }
  }, [isOpen]);

  const isEditMode = !!reservation;

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
      return durationHours * courtPricePerHour;
    }
    return 0;
  }, [startTime, endTime, courtPricePerHour]);

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
    setIsSaving(true);
    try {
      const dataToSave = {
        currency: "EUR",
        ...values,
        startTime: Timestamp.fromDate(values.startTime),
        endTime: Timestamp.fromDate(values.endTime),
        totalPrice: price, // store in Euro directly
      };

      if (isEditMode) {
        await updateReservation(reservation.id, dataToSave);
        toast.success("Резервацията е актуализирана успешно!");
      } else {
        const result = await createReservation({ ...dataToSave, status: "unpaid" });
        if (result.emailSent) {
          toast.success("Резервацията е създадена успешно!");
        } else {
          toast.success("Резервацията е създадена!", {
            description: "Възникна проблем с изпращането на потвърждение по имейл.",
          });
        }
      }
      onSave?.();
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to save reservation:", error);
      if (error instanceof Error) {
        toast.error(error.message || "Възникна грешка при запазването.");
      } else {
        toast.error("Възникна грешка при запазването.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-xl rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white dark:bg-zinc-900 max-h-[90vh] flex flex-col">
        <DialogHeader className="p-10 pb-0">
          <DialogTitle className="text-3xl font-black font-heading text-zinc-900 dark:text-white flex items-center gap-3">
            <Plus className="h-8 w-8 text-blue-600" />
            {isEditMode ? "Редактиране на резервация" : "Нова резервация"}
          </DialogTitle>
          <DialogDescription className="text-lg text-zinc-500 font-medium">
            {isEditMode
              ? "Променете данните по-долу и кликнете 'Запази промените'."
              : "Попълнете данните, за да създадете нова резервация."}
          </DialogDescription>
        </DialogHeader>
        <div className="px-10 pb-10 pt-6 overflow-y-auto flex-1 custom-scrollbar">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="clientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-400 font-black uppercase tracking-widest text-[10px] ml-1">Име на клиент</FormLabel>
                  <FormControl>
                    <Input placeholder="Иван Иванов" className="h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-zinc-800 font-medium" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="clientPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-400 font-black uppercase tracking-widest text-[10px] ml-1">Телефон</FormLabel>
                    <FormControl>
                      <Input placeholder="0888123456" className="h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-zinc-800 font-medium" {...field} />
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
                    <FormLabel className="text-zinc-400 font-black uppercase tracking-widest text-[10px] ml-1">Имейл</FormLabel>
                    <FormControl>
                      <Input placeholder="ivan@email.com" className="h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-zinc-800 font-medium" {...field} />
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
                  <FormLabel className="text-zinc-400 font-black uppercase tracking-widest text-[10px] ml-1">Корт</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(parseInt(value, 10))
                    }
                    value={field.value ? String(field.value) : ""}
                  >
                    <FormControl>
                      <SelectTrigger className="h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-zinc-800 font-bold">
                        <SelectValue placeholder="Изберете корт..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-2xl border-zinc-100 dark:border-zinc-800 shadow-2xl">
                      {Array.from({ length: 6 }, (_, i) => i + 1).map((num) => (
                        <SelectItem key={num} value={String(num)} className="rounded-xl font-bold py-3">
                          Корт {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-zinc-400 font-black uppercase tracking-widest text-[10px] ml-1">Начален час</FormLabel>
                    <Input
                      type="datetime-local"
                      className="h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-zinc-800 font-medium"
                      value={
                        field.value
                          ? new Date(
                              field.value.getTime() -
                                field.value.getTimezoneOffset() * 60000
                            )
                              .toISOString()
                              .slice(0, 16)
                          : ""
                      }
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-zinc-400 font-black uppercase tracking-widest text-[10px] ml-1">Краен час</FormLabel>
                    <Input
                      type="datetime-local"
                      className="h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-zinc-800 font-medium"
                      value={
                        field.value
                          ? new Date(
                              field.value.getTime() -
                                field.value.getTimezoneOffset() * 60000
                            )
                              .toISOString()
                              .slice(0, 16)
                          : ""
                      }
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
              <span className="text-zinc-500 font-bold">Цена за престоя:</span>
              <span className="text-3xl font-black font-heading text-zinc-900 dark:text-white">
                {price.toFixed(2)} €
              </span>
            </div>
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-14 rounded-2xl border-zinc-200 dark:border-zinc-800 font-black text-xs uppercase tracking-widest"
                onClick={() => setIsOpen(false)}
              >
                Отказ
              </Button>
              <Button type="submit" disabled={isSaving} className="flex-1 h-14 rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-black text-xs uppercase tracking-widest shadow-xl shadow-zinc-900/20">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? "Запази промените" : "Запази резервация"}
              </Button>
            </div>
          </form>
        </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
