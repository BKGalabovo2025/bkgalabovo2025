"use client";

import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Eye,
  GraduationCap,
  MessageCircle,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import React from "react";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  CoachMethodology,
  DrillCourtDiagramData,
} from "@/types/planner.types";

import { DrillCourtDiagram } from "./DrillCourtDiagram";

interface CoachMethodologyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  dosageText?: string;
  methodology: CoachMethodology;
  courtDiagram?: DrillCourtDiagramData;
}

/**
 * Пълна 5-блокова BWF треньорска карта:
 * 1. Как да го обясня (U9–U11 и U13+)
 * 2. Какво да следя (технически маркери)
 * 3. Най-чести грешки -> Корекция
 * 4. Улесняване / Усложняване (BWF STEP принцип)
 * 5. Безопасност и биомеханика + Официален BWF източник
 */
export function CoachMethodologyDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  dosageText,
  methodology,
  courtDiagram,
}: CoachMethodologyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[calc(100%-1.5rem)] max-w-3xl flex-col gap-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-0 dark:border-zinc-800 dark:bg-zinc-950">
        <DialogHeader className="shrink-0 border-b border-zinc-200/80 bg-zinc-50/80 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-indigo-600 text-white hover:bg-indigo-600">
              <BookOpen className="mr-1 size-3" />
              BWF Треньорска методика
            </Badge>
            {dosageText && (
              <Badge
                variant="outline"
                className="border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
              >
                {dosageText}
              </Badge>
            )}
          </div>
          <DialogTitle className="mt-1.5 text-lg font-bold text-zinc-950 dark:text-white">
            {title}
          </DialogTitle>
          {subtitle && (
            <DialogDescription className="text-xs text-zinc-600 dark:text-zinc-400">
              {subtitle}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4 text-sm">
          {courtDiagram && <DrillCourtDiagram data={courtDiagram} />}

          {/* Блок 1: Как да го обясня */}
          <section className="space-y-3 rounded-2xl border border-blue-200/80 bg-blue-50/40 p-4 dark:border-blue-900/60 dark:bg-blue-950/20">
            <h3 className="flex items-center gap-2 text-xs font-bold tracking-wider text-blue-800 uppercase dark:text-blue-300">
              <MessageCircle className="size-4" />
              1. Как да го обясня на състезателя
            </h3>
            <div className="space-y-2.5 text-xs leading-relaxed text-zinc-800 dark:text-zinc-200">
              <div className="rounded-xl bg-white/80 p-3 dark:bg-zinc-900/70">
                <p className="mb-1 font-bold text-blue-700 dark:text-blue-300">
                  За малки състезатели (U9 – U11):
                </p>
                <p>{methodology.explainKids}</p>
              </div>
              <div className="rounded-xl bg-white/80 p-3 dark:bg-zinc-900/70">
                <p className="mb-1 font-bold text-indigo-700 dark:text-indigo-300">
                  За юноши и възрастни (U13 – Мъже и Жени):
                </p>
                <p>{methodology.explainOlder}</p>
              </div>
            </div>
          </section>

          {/* Блок 2: Какво да следя */}
          <section className="space-y-2.5 rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20">
            <h3 className="flex items-center gap-2 text-xs font-bold tracking-wider text-emerald-800 uppercase dark:text-emerald-300">
              <Eye className="size-4" />
              2. Какво да следя (Ключови технически точки)
            </h3>
            <ul className="space-y-2 text-xs leading-relaxed text-zinc-800 dark:text-zinc-200">
              {methodology.keyTechnicalPoints.map((pt, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Блок 3: Най-чести грешки -> Корекция */}
          <section className="space-y-2.5 rounded-2xl border border-rose-200/80 bg-rose-50/40 p-4 dark:border-rose-900/60 dark:bg-rose-950/20">
            <h3 className="flex items-center gap-2 text-xs font-bold tracking-wider text-rose-800 uppercase dark:text-rose-300">
              <AlertTriangle className="size-4" />
              3. Най-чести грешки и незабавна корекция
            </h3>
            <div className="space-y-2.5">
              {methodology.commonErrors.map((item, i) => (
                <div
                  key={i}
                  className="rounded-xl bg-white/85 p-3 text-xs leading-relaxed dark:bg-zinc-900/70"
                >
                  <p className="font-semibold text-rose-700 dark:text-rose-300">
                    Грешка: {item.error}
                  </p>
                  <p className="mt-1 text-zinc-700 dark:text-zinc-300">
                    <strong className="text-emerald-700 dark:text-emerald-400">
                      Корекция:
                    </strong>{" "}
                    {item.fix}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Блок 4: BWF STEP Принцип */}
          <section className="space-y-2.5 rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
            <h3 className="flex items-center gap-2 text-xs font-bold tracking-wider text-amber-800 uppercase dark:text-amber-300">
              <SlidersHorizontal className="size-4" />
              4. Адаптация на място (Официален BWF STEP принцип)
            </h3>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 text-xs leading-relaxed">
              <div className="rounded-xl bg-white/85 p-3 dark:bg-zinc-900/70">
                <p className="mb-1 font-bold text-emerald-700 dark:text-emerald-400">
                  Улесняване (ако се затруднява):
                </p>
                <p className="text-zinc-700 dark:text-zinc-300">
                  {methodology.stepAdjustments.easier}
                </p>
              </div>
              <div className="rounded-xl bg-white/85 p-3 dark:bg-zinc-900/70">
                <p className="mb-1 font-bold text-amber-700 dark:text-amber-400">
                  Усложняване (ако му е лесно):
                </p>
                <p className="text-zinc-700 dark:text-zinc-300">
                  {methodology.stepAdjustments.harder}
                </p>
              </div>
            </div>
          </section>

          {/* Блок 5: Безопасност и Източник */}
          <section className="space-y-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
            <h3 className="flex items-center gap-2 text-xs font-bold tracking-wider text-zinc-800 uppercase dark:text-zinc-200">
              <ShieldCheck className="size-4 text-teal-600 dark:text-teal-400" />
              5. Безопасност и биомеханика
            </h3>
            <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
              {methodology.safetyBiomechanics}
            </p>
            <div className="flex items-center gap-1.5 pt-2 border-t border-zinc-200/80 text-[11px] font-medium text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              <GraduationCap className="size-3.5 shrink-0 text-indigo-500" />
              <span>Официален източник: {methodology.officialSource}</span>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
