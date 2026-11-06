"use client";

import { Clock, Dumbbell, ExternalLink, Layers, Loader2 } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { plannerService } from "@/services/planner-service";
import { useAppStore } from "@/store/use-app-store";
import { TrainingTemplate } from "@/types/planner.types";

export function TemplatesClient() {
  const { activeBranch: siteId } = useAppStore();
  const [templates, setTemplates] = useState<TrainingTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!siteId) return;
    plannerService
      .getTrainingTemplates(siteId)
      .then((data) => {
        setTemplates(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load templates:", err);
        setLoading(false);
      });
  }, [siteId]);

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-200 py-16 text-center dark:border-zinc-800">
        <Layers className="mx-auto mb-3 size-10 text-zinc-300 dark:text-zinc-700" />
        <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200">
          Няма намерени тренировъчни шаблони
        </h3>
        <p className="mt-1 text-sm text-zinc-500">
          Шаблоните се зареждат автоматично с годишните макроцикли.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((tmpl) => {
          const exercisesCount =
            tmpl.blocks?.reduce(
              (acc, b) => acc + (b.exercises?.length || 0),
              0
            ) || 0;

          return (
            <BentoCard
              key={tmpl.id}
              id={`template-${tmpl.id}`}
              className="flex flex-col justify-between border-zinc-200/80 bg-white/90 p-5 dark:border-zinc-800/80 dark:bg-zinc-900/90"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    {tmpl.name}
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {tmpl.targetAgeGroups?.slice(0, 2).map((ag) => (
                      <Badge
                        key={ag}
                        variant="secondary"
                        className="text-[10px] font-bold"
                      >
                        {ag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" />
                    {tmpl.totalDurationMinutes || 90} мин
                  </span>
                  <span className="flex items-center gap-1">
                    <Dumbbell className="size-3.5 text-blue-500" />
                    {exercisesCount} упражнения
                  </span>
                </div>

                {tmpl.description && (
                  <p className="line-clamp-2 text-xs text-zinc-600 dark:text-zinc-400">
                    {tmpl.description}
                  </p>
                )}
              </div>

              <div className="mt-4 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-between rounded-xl text-xs font-bold"
                  asChild
                >
                  <Link href={`/training/planner?importTemplate=${tmpl.id}`}>
                    <span>Импортирай в Планировчика</span>
                    <ExternalLink className="size-3.5" />
                  </Link>
                </Button>
              </div>
            </BentoCard>
          );
        })}
      </div>
    </div>
  );
}
