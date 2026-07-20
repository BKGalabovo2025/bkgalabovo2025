"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { deleteTrainingSessionAction } from "@/lib/actions/trainings";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Props {
  trainingId: string;
}

export function DeleteTrainingButton({ trainingId }: Props) {
  const { idToken } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!idToken) return;
    if (!confirm("Сигурни ли сте, че искате да изтриете този запис?")) return;

    setIsDeleting(true);
    try {
      const res = await deleteTrainingSessionAction(idToken, trainingId);
      if (res.success) {
        toast.success(res.message);
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
      className="text-zinc-400 hover:bg-rose-50 hover:text-rose-500"
      onClick={handleDelete}
      disabled={isDeleting}
      title="Изтрий записа"
      aria-label="Изтрий записа"
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
