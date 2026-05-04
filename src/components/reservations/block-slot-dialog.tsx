"use client";

import React, { useState, useEffect } from "react";
import { Timestamp } from "firebase/firestore";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";

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
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Lock } from "lucide-react";
import { createBlockedSlot, updateBlockedSlot } from "@/lib/reservations";
import { BlockedSlot } from "@/types/reservation";

const blockSlotSchema = z
  .object({
    title: z
      .string()
      .min(3, { message: "Причината трябва да е поне 3 символа." }),
    startTime: z.date(),
    endTime: z.date(),
    courtIds: z.array(z.number()).min(1, "Трябва да изберете поне един корт."),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "Крайният час трябва да е след началния.",
    path: ["endTime"],
  });

interface BlockSlotDialogProps {
  children: React.ReactNode;
  slot?: BlockedSlot; // Existing slot for edit mode
  courtCount: number;
  onSave?: () => void;
}

export const BlockSlotDialog: React.FC<BlockSlotDialogProps> = ({
  children,
  slot,
  courtCount,
  onSave,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isEditMode = !!slot;

  const form = useForm<z.infer<typeof blockSlotSchema>>({
    resolver: zodResolver(blockSlotSchema),
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        form.reset({
          title: slot.title,
          startTime: slot.startTime.toDate(),
          endTime: slot.endTime.toDate(),
          courtIds:
            slot.courtIds.length > 0
              ? slot.courtIds
              : Array.from({ length: courtCount }, (_, i) => i + 1),
        });
      } else {
        form.reset({
          title: "",
          courtIds: [],
          startTime: undefined,
          endTime: undefined,
        });
      }
    }
  }, [isOpen, isEditMode, slot, form, courtCount]);

  async function onSubmit(values: z.infer<typeof blockSlotSchema>) {
    setIsSaving(true);
    try {
      const dataToSave = {
        ...values,
        startTime: Timestamp.fromDate(values.startTime),
        endTime: Timestamp.fromDate(values.endTime),
      };

      if (isEditMode) {
        await updateBlockedSlot(slot.id, dataToSave);
        toast.success("Блокираните часове са актуализирани!");
      } else {
        await createBlockedSlot(dataToSave);
        toast.success("Часовете са блокирани успешно!");
      }
      onSave?.();
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to save blocked slot:", error);
      if (error instanceof Error) {
        toast.error(error.message || "Възникна грешка при запазването.");
      } else {
        toast.error("Възникна грешка при запазването.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  const allCourtIds = Array.from({ length: courtCount }, (_, i) => i + 1);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-xl rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white dark:bg-zinc-900 max-h-[90vh] flex flex-col">
        <DialogHeader className="p-10 pb-0">
          <DialogTitle className="text-3xl font-black font-heading text-zinc-900 dark:text-white flex items-center gap-3">
            <Lock className="h-8 w-8 text-blue-600" />
            {isEditMode
              ? "Редактиране на блокирани часове"
              : "Блокиране на часове"}
          </DialogTitle>
          <DialogDescription className="text-lg text-zinc-500 font-medium">
            {isEditMode
              ? "Променете данните и натиснете 'Запази промените'."
              : "Изберете период и кортове, които да бъдат блокирани."}
          </DialogDescription>
        </DialogHeader>
        <div className="px-10 pb-10 pt-6 overflow-y-auto flex-1 custom-scrollbar">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Причина</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Напр. Поддръжка, Турнир..."
                      {...field}
                    />
                  </FormControl>
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
                    <FormLabel className="text-zinc-400 font-black uppercase tracking-widest text-[10px] ml-1">Начало</FormLabel>
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
                    <FormLabel className="text-zinc-400 font-black uppercase tracking-widest text-[10px] ml-1">Край</FormLabel>
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
            <FormField
              control={form.control}
              name="courtIds"
              render={({ field }) => (
                <FormItem className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between mb-4">
                    <FormLabel className="text-zinc-900 dark:text-white font-black font-heading text-lg">Кортове</FormLabel>
                    <div className="flex items-center space-x-2 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                      <Checkbox
                        id="all-courts"
                        checked={field.value.length === courtCount}
                        onCheckedChange={(checked) =>
                          field.onChange(checked ? allCourtIds : [])
                        }
                      />
                      <label htmlFor="all-courts" className="text-xs font-black uppercase tracking-widest">
                        Всички
                      </label>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {allCourtIds.map((id) => (
                      <FormField
                        key={id}
                        control={form.control}
                        name="courtIds"
                        render={({ field: innerField }) => (
                          <FormItem
                            key={id}
                            className="flex items-center space-x-3 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm"
                          >
                            <FormControl>
                              <Checkbox
                                checked={innerField.value?.includes(id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? innerField.onChange([
                                        ...innerField.value,
                                        id,
                                      ])
                                    : innerField.onChange(
                                        innerField.value?.filter(
                                          (value) => value !== id
                                        )
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-bold text-sm">
                              Корт {id}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                {isEditMode ? "Запази промените" : "Блокирай"}
              </Button>
            </div>
          </form>
        </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
