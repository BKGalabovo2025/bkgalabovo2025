"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DateTimePicker } from "@/components/ui/datetime-picker";
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
import { useAuth } from "@/context/auth-context";
import {
  createBlockedSlotAction,
  updateBlockedSlotAction,
} from "@/lib/actions/reservations";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/use-app-store";
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
  const { getFreshToken } = useAuth();
  const { activeBranch } = useAppStore();

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
    const token = await getFreshToken(true);
    if (!token) {
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
      };

      if (isEditMode) {
        const result = await updateBlockedSlotAction(
          token,
          slot.id,
          dataToSave
        );
        if (result.success) {
          toast.success(result.message);
        } else {
          toast.error(result.message);
        }
      } else {
        const result = await createBlockedSlotAction(token, dataToSave);
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

  const handleCourtToggle = (
    id: number,
    currentValues: number[],
    onChange: (vals: number[]) => void
  ) => {
    const vals = currentValues || [];
    const isSelected = vals.includes(id);
    if (isSelected) {
      onChange(vals.filter((v: number) => v !== id));
    } else {
      onChange([...vals, id]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="rounded-4xl border-zinc-100 shadow-2xl sm:max-w-md dark:border-zinc-900">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-bold text-zinc-900 dark:text-white">
            {isEditMode
              ? "Редактиране на блокиран период"
              : "Блокиране на часове"}
          </DialogTitle>
          <DialogDescription className="text-xs font-medium tracking-wider text-zinc-500 uppercase">
            {isEditMode
              ? "Променете данните и натиснете 'Запази промените'."
              : "Изберете период и кортове, които да бъдат блокирани."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                    Причина
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Напр. Поддръжка, Турнир..."
                      className="h-12 rounded-2xl border-zinc-100 bg-zinc-50/50 font-medium transition-all focus:bg-white focus:ring-0"
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
                  <div className="mb-2 flex items-center justify-between">
                    <FormLabel className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                      Избор на кортове
                    </FormLabel>
                    <div className="flex items-center space-x-2 rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-1.5 dark:border-zinc-800 dark:bg-zinc-900">
                      <Checkbox
                        id="all-courts"
                        checked={field.value.length === courtCount}
                        onCheckedChange={(checked) =>
                          field.onChange(checked ? allCourtIds : [])
                        }
                        className="rounded-md"
                      />
                      <label
                        htmlFor="all-courts"
                        className="cursor-pointer text-[10px] font-black tracking-widest text-zinc-500 uppercase"
                      >
                        Всички
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-2">
                    {allCourtIds.map((id) => (
                      <div
                        key={id}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition-all",
                          field.value?.includes(id)
                            ? "border-primary/20 bg-primary/5 text-primary"
                            : "border-zinc-100 bg-zinc-50/50 text-zinc-400 hover:border-zinc-200"
                        )}
                        onClick={() =>
                          handleCourtToggle(id, field.value, field.onChange)
                        }
                      >
                        <Checkbox
                          checked={field.value?.includes(id)}
                          className="rounded-md"
                        />
                        <span className="text-xs font-bold tracking-wider uppercase">
                          Корт {id}
                        </span>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                className="rounded-xl px-8 text-[10px] font-bold tracking-widest text-zinc-400 uppercase transition-all hover:bg-zinc-50 hover:text-zinc-900"
                onClick={() => setIsOpen(false)}
              >
                Отказ
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="h-12 rounded-xl border-none bg-zinc-900 px-8 text-[10px] font-bold tracking-widest text-white uppercase shadow-lg shadow-black/10 transition-all hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
              >
                {isSaving && (
                  <Loader2
                    className="mr-2 size-3 animate-spin"
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
