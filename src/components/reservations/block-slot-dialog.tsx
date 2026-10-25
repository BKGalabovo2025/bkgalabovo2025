"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ShieldAlert } from "lucide-react";
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
      <DialogContent className="flex max-h-[92dvh] sm:max-h-[85vh] w-[calc(100%-1.25rem)] sm:w-full sm:max-w-xl md:max-w-2xl flex-col gap-0 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-0 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 [&>button:last-child]:top-3.5 [&>button:last-child]:right-3.5">
        {/* Fixed Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-zinc-100 bg-zinc-50/50 px-4 py-3 sm:px-5 sm:py-3.5 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="flex items-center gap-3 pr-8">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
              <ShieldAlert className="size-4" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="truncate text-base font-bold text-zinc-900 sm:text-lg dark:text-white">
                {isEditMode
                  ? "Редактиране на блокиран период"
                  : "Блокиране на часове"}
              </DialogTitle>
              <DialogDescription className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                {isEditMode
                  ? "Променете данните и натиснете 'Запази промените'."
                  : "Изберете период и кортове, които да бъдат блокирани."}
              </DialogDescription>
            </div>
          </div>
        </div>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-1 flex-col overflow-hidden min-h-0"
          >
            <div className="custom-scrollbar flex-1 overflow-y-auto overscroll-contain p-3.5 sm:p-4.5 space-y-3.5 min-h-0">
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
                        className="h-9 rounded-xl border-zinc-200 bg-zinc-50/50 font-medium transition-all focus:bg-white focus:ring-0 dark:border-zinc-800 dark:bg-zinc-900/50 dark:focus:bg-zinc-900"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      <div className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                        Избор на кортове
                      </div>
                      <div className="flex items-center space-x-2 rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-1.5 dark:border-zinc-800 dark:bg-zinc-900">
                        <Checkbox
                          id="all-courts"
                          checked={field.value?.length === courtCount}
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

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                      {allCourtIds.map((id) => (
                        <div
                          key={id}
                          className={cn(
                            "flex cursor-pointer items-center gap-2.5 rounded-xl border p-2.5 transition-all text-xs font-semibold",
                            field.value?.includes(id)
                              ? "border-primary/30 bg-primary/5 text-primary"
                              : "border-zinc-200 bg-zinc-50/50 text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400"
                          )}
                          onClick={() =>
                            handleCourtToggle(id, field.value, field.onChange)
                          }
                        >
                          <Checkbox
                            checked={field.value?.includes(id)}
                            className="rounded-md"
                          />
                          <span className="truncate">Корт {id}</span>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Fixed Sticky Footer */}
            <div className="shrink-0 flex items-center justify-end gap-2 border-t border-zinc-100 bg-zinc-50/80 px-4 py-2.5 sm:px-5 sm:py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
              <Button
                type="button"
                variant="ghost"
                className="h-9 rounded-xl px-4 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                Отказ
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="h-9 rounded-xl bg-zinc-900 px-5 text-xs font-bold text-white shadow-sm transition-all hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
              >
                {isSaving && (
                  <Loader2
                    className="mr-2 size-3.5 animate-spin"
                    strokeWidth={2}
                  />
                )}
                {isEditMode ? "Запази промените" : "Блокирай"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
