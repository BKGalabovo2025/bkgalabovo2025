"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Service } from "@/app/(protected)/finances/services/service.types";
import { ServiceForm } from "@/components/finances/ServiceForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
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
      <DialogContent className="custom-scrollbar max-h-[85vh] max-w-5xl overflow-y-auto rounded-4xl border-none bg-white p-6 shadow-xl sm:p-8 dark:bg-zinc-950">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-light text-zinc-950 dark:text-zinc-50">
            {mode === "add"
              ? "Добавяне на тренировка"
              : "Редактиране на тренировка"}
          </DialogTitle>
          <DialogDescription className="mt-1 font-light text-zinc-400">
            {mode === "add"
              ? "Създаване на нов абонаментен план, еднократно посещение или членски внос."
              : `Промяна на детайлите за "${service?.name}"`}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2">
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
