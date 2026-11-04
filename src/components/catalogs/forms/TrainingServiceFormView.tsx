"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";

import { Service } from "@/app/(protected)/finances/services/service.types";
import { ServiceForm } from "@/components/finances/ServiceForm";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { createClubService, updateClubService } from "@/lib/actions/services";

interface TrainingServiceFormViewProps {
  mode: "add" | "edit";
  initialService?: Service | null;
}

export function TrainingServiceFormView({
  mode,
  initialService,
}: TrainingServiceFormViewProps) {
  const router = useRouter();
  const { idToken } = useAuth();
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>(
    {}
  );

  const handleSubmit = async (formData: FormData) => {
    if (mode === "edit" && !initialService?.id) return;

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
              initialService!.id,
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
        toast.success(
          mode === "add"
            ? "Тренировъчната програма е създадена успешно!"
            : "Промените по програмата са запазени!"
        );
        setErrors({});
        router.push("/catalogs/trainings");
        router.refresh();
      } else {
        setErrors(result.errors || {});
        toast.error("Грешка при валидация", { description: result.message });
      }
    } catch (error) {
      toast.error("Възникна непредвидена грешка", {
        description: (error as Error).message,
      });
    }
  };

  const title =
    mode === "add"
      ? "Нова тренировъчна програма"
      : `Редактиране: ${initialService?.name || "Тренировка"}`;
  const subtitle =
    mode === "add"
      ? "Конфигуриране на цени, периодичност, възрастови групи и права на картотека/екипировка."
      : "Актуализация на параметрите на програмата или абонамента.";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Top Header / Back Button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="rounded-xl border-zinc-200 dark:border-zinc-800"
          >
            <Link href="/catalogs/trainings">
              <ArrowLeft className="mr-1.5 size-4" />
              <span>Назад към каталога</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-zinc-900 sm:text-2xl dark:text-white">
              {title}
            </h1>
            <p className="text-xs text-zinc-500 sm:text-sm dark:text-zinc-400">
              {subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Main Form Container */}
      <BentoCard className="overflow-hidden rounded-3xl border border-zinc-200/80 bg-white p-4 sm:p-8 shadow-xs dark:border-zinc-800 dark:bg-zinc-950">
        <ServiceForm
          initialData={initialService || undefined}
          onSubmit={handleSubmit}
          onCancel={() => router.push("/catalogs/trainings")}
          errors={errors}
        />
      </BentoCard>
    </div>
  );
}
