"use client";

import React, { useState, useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { DateTimePicker } from "@/components/ui/datetime-picker";

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
import { Loader2 } from "lucide-react";
import { createBlockedSlotAction } from "@/lib/actions/reservations";
import { useAuth } from "@/context/auth-context";
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
  const { idToken } = useAuth();

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
    if (!idToken) {
      toast.error("Грешка при оторизация");
      return;
    }

    setIsSaving(true);
    try {
      const dataToSave = {
        ...values,
        startTime: values.startTime.toISOString(),
        endTime: values.endTime.toISOString(),
      };

      if (isEditMode) {
        // We'll skip update for now or add it to actions if needed
        // For now let's just use create
        toast.error(
          "Редактирането на блокирани слотове все още не е мигрирано към сървърни действия."
        );
        // await updateBlockedSlot(slot.id, dataToSave);
      } else {
        const result = await createBlockedSlotAction(idToken, dataToSave);
        if (result.success) {
          toast.success(result.message);
        } else {
          toast.error(result.message);
        }
      }
      onSave?.();
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to save blocked slot:", error);
      toast.error("Възникна системна грешка.");
    } finally {
      setIsSaving(false);
    }
  }

  const allCourtIds = Array.from({ length: courtCount }, (_, i) => i + 1);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditMode
              ? "Редактиране на блокирани часове"
              : "Блокиране на часове"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Променете данните и натиснете 'Запази промените'."
              : "Изберете период и кортове, които да бъдат блокирани."}
          </DialogDescription>
        </DialogHeader>
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
            <div className="grid grid-cols-2 gap-4">
              <DateTimePicker
                control={form.control}
                name="startTime"
                label="Начало"
              />
              <DateTimePicker
                control={form.control}
                name="endTime"
                label="Край"
              />
            </div>
            <FormField
              control={form.control}
              name="courtIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Кортове</FormLabel>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="all-courts"
                      checked={field.value.length === courtCount}
                      onCheckedChange={(checked) =>
                        field.onChange(checked ? allCourtIds : [])
                      }
                    />
                    <label
                      htmlFor="all-courts"
                      className="text-[11px] font-medium uppercase tracking-widest text-zinc-500 cursor-pointer"
                    >
                      Всички
                    </label>
                  </div>
                  <div className="grid grid-cols-4 gap-2 pt-2">
                    {allCourtIds.map((id) => (
                      <FormField
                        key={id}
                        control={form.control}
                        name="courtIds"
                        render={({ field: innerField }) => (
                          <FormItem
                            key={id}
                            className="flex items-center space-x-2"
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
                            <FormLabel className="font-normal">
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
                {isEditMode ? "Запази промените" : "Блокирай"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
