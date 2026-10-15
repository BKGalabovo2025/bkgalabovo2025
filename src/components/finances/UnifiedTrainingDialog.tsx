"use client";

import { Dumbbell } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Service } from "@/app/(protected)/finances/services/service.types";
import { ServiceForm } from "@/components/finances/ServiceForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/auth-context";
import { createClubService, updateClubService } from "@/lib/actions/services";

interface UnifiedTrainingDialogProps {
  mode: "add" | "edit";
  service?: Service | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const UnifiedTrainingDialog = ({
  mode,
  service,
  isOpen,
  onClose,
  onSuccess,
}: UnifiedTrainingDialogProps) => {
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>(
    {}
  );
  const { idToken } = useAuth();

  useEffect(() => {
    if (!isOpen) {
      setErrors({});
    }
  }, [isOpen]);

  const handleSubmit = async (formData: FormData) => {
    if (mode === "edit" && !service) return;

    if (!idToken) {
      toast.error("Грешка при оторизация", {
        description: "Няма валиден сесиен токен за достъп.",
      });
      return;
    }

    try {
      const result =
        mode === "edit"
          ? await updateClubService(
              service!.id,
              idToken,
              { success: false, errors: {} },
              formData
            )
          : await createClubService(
              idToken,
              { success: false, errors: {} },
              formData
            );

      if (result.success) {
        toast.success("Успех!", { description: result.message });
        setErrors({});
        onSuccess();
        onClose();
      } else {
        setErrors(result.errors || {});
        toast.error("Грешка", { description: result.message });
      }
    } catch (error) {
      toast.error(
        mode === "add" ? "Грешка при добавяне" : "Грешка при актуализация",
        {
          description: (error as Error).message,
        }
      );
    }
  };

  if (mode === "edit" && !service) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[92dvh] sm:max-h-[88vh] w-[calc(100%-1.25rem)] sm:w-full sm:max-w-5xl flex-col gap-0 overflow-hidden rounded-2xl sm:rounded-3xl border border-zinc-200/80 bg-white p-0 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 [&>button:last-child]:top-3.5 [&>button:last-child]:right-3.5 sm:[&>button:last-child]:top-4 sm:[&>button:last-child]:right-4">
        {/* Fixed Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-zinc-100 bg-zinc-50/50 px-4 py-3 sm:px-6 sm:py-4 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="flex items-center gap-3 pr-8">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-xs dark:bg-white dark:text-zinc-950">
              <Dumbbell className="size-4.5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="truncate text-base font-bold text-zinc-950 sm:text-lg dark:text-zinc-50">
                {mode === "add"
                  ? "Добавяне на тренировка"
                  : "Редактиране на тренировка"}
              </DialogTitle>
              <DialogDescription className="truncate text-xs text-zinc-400">
                {mode === "add"
                  ? "Създаване на нов абонаментен план, еднократно посещение или членски внос."
                  : `Промяна на детайлите за "${service?.name}"`}
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="custom-scrollbar flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 min-h-0">
          <ServiceForm
            initialData={mode === "edit" && service ? service : undefined}
            onSubmit={handleSubmit}
            onCancel={onClose}
            errors={errors}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
