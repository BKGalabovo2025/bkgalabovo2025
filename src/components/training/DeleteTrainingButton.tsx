 
 
/* eslint-disable @typescript-eslint/no-explicit-any */
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
    } catch (error: any) {
      toast.error(error.message || "Грешка при изтриване");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-zinc-400 hover:text-rose-500 hover:bg-rose-50"
      onClick={handleDelete}
      disabled={isDeleting}
      title="Изтрий записа"
      aria-label="Изтрий записа"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
