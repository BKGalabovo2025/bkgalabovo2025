"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { deleteTrainingSessionAction } from "@/lib/actions/trainings";

interface Props {
  trainingId: string;
  onDeleted?: () => void;
}

export function DeleteTrainingButton({ trainingId, onDeleted }: Props) {
  const { user, idToken } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    const freshToken = user ? await user.getIdToken() : idToken;
    if (!freshToken && !user) return;
    if (!confirm("Сигурни ли сте, че искате да изтриете този запис?")) return;

    setIsDeleting(true);
    try {
      const res = await deleteTrainingSessionAction(
        freshToken || "",
        trainingId
      );
      if (res.success) {
        toast.success(res.message);
        onDeleted?.();
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } catch (error: unknown) {
      toast.error(
        (error instanceof Error ? error.message : "Unknown error") ||
          "Грешка при изтриване"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-zinc-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
      onClick={handleDelete}
      disabled={isDeleting}
      title="Изтрий записа"
      aria-label="Изтрий записа"
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
