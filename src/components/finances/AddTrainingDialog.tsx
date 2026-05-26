"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { createClubService } from "@/lib/actions/services";
import { useAuth } from "@/context/auth-context";
import { ServiceForm } from "@/components/finances/ServiceForm";

interface AddTrainingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddTrainingDialog = ({
  isOpen,
  onClose,
  onSuccess,
}: AddTrainingDialogProps) => {
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>(
    {}
  );
  const { idToken } = useAuth();

  const handleSubmit = async (formData: FormData) => {
    if (!idToken) {
      toast.error("Грешка при оторизация", {
        description: "Няма валиден сесиен токен за достъп.",
      });
      return;
    }

    try {
      const result = await createClubService(
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
      toast.error("Грешка при добавяне", {
        description: (error as Error).message,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl rounded-4xl p-6 sm:p-8 bg-white dark:bg-zinc-950 border-none shadow-xl max-h-[85vh] overflow-y-auto custom-scrollbar">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-light text-zinc-950 dark:text-zinc-50">
            Добавяне на тренировка
          </DialogTitle>
          <DialogDescription className="font-light text-zinc-400 mt-1">
            Създаване на нов абонаментен план, еднократно посещение или членски
            внос.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2">
          <ServiceForm
            onSubmit={handleSubmit}
            onCancel={onClose}
            errors={errors}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
