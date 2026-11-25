"use client";

import { CheckCircle2, Loader2, Target } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { generateAssessmentAnalysis } from "@/lib/assessment-analysis";
import { BADMINTON_TESTS } from "@/lib/badminton-tests";
import { addAssessment } from "@/services/assessment-service";

interface QuickTestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  memberName: string;
  testId: string;
  onSaved?: (memberId: string, testId: string, scoreDisplay: string) => void;
}

/**
 * Бърз прозорец за въвеждане на BWF тест директно върху „Таблото на кортовете“
 * (за 5 секунди, без да се губи активният таймер или екранът на тренировката).
 */
export function QuickTestModal({
  open,
  onOpenChange,
  memberId,
  memberName,
  testId,
  onSaved,
}: QuickTestModalProps) {
  const { user } = useAuth();
  const testDef =
    BADMINTON_TESTS.find((t) => t.id === testId) || BADMINTON_TESTS[0];

  const [scoreInput, setScoreInput] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const numeric = Number(scoreInput.replace(",", "."));
    if (!scoreInput.trim() || Number.isNaN(numeric)) {
      toast.error("Въведете валидна числова стойност.");
      return;
    }

    setIsSaving(true);
    try {
      const scoreDisplay = `${scoreInput.trim()}${testDef.scoreUnit ? ` ${testDef.scoreUnit}` : ""}`;
      const analysis = generateAssessmentAnalysis(
        testDef.id,
        numeric,
        testDef.scoreType
      );

      await addAssessment({
        memberId,
        memberName,
        date: new Date().toISOString(),
        testId: testDef.id,
        testName: testDef.name,
        ageGroupAtTest: testDef.ageGroup,
        score: numeric,
        scoreDisplay,
        notes: notes.trim() || undefined,
        coachAnalysis: analysis.analysis,
        recommendedExercises: analysis.recommendation,
        recordedBy: {
          userId: user?.uid || "coach",
          userName: user?.displayName || user?.email || "Треньор",
        },
      });

      toast.success(
        `Тестът „${testDef.name}“ за ${memberName} е записан (${scoreDisplay})!`
      );
      setScoreInput("");
      setNotes("");
      onSaved?.(memberId, testDef.id, scoreDisplay);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Грешка при запис на теста.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-1.5rem)] max-w-md rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge className="bg-indigo-600 text-white hover:bg-indigo-600">
              <Target className="mr-1 size-3" />
              Бърз BWF тест
            </Badge>
            <Badge variant="outline">{testDef.ageGroup}</Badge>
          </div>
          <DialogTitle className="mt-1 text-base font-bold text-zinc-950 dark:text-white">
            {memberName} — {testDef.name}
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-600 dark:text-zinc-400">
            {testDef.description}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="rounded-xl border border-zinc-200/80 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-900/60">
            <p className="font-semibold text-zinc-800 dark:text-zinc-200">
              Оценяване: {testDef.scoring}
            </p>
            {testDef.maxScore && (
              <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                Максимум: {testDef.maxScore} {testDef.scoreUnit || ""}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="quick-test-score" className="text-xs font-bold">
              Резултат ({testDef.scoreUnit || "точки"})
            </Label>
            <Input
              id="quick-test-score"
              type="text"
              inputMode="decimal"
              autoFocus
              value={scoreInput}
              onChange={(e) => setScoreInput(e.target.value)}
              placeholder={
                testDef.maxScore ? `напр. 0..${testDef.maxScore}` : "напр. 12"
              }
              className="rounded-xl dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="quick-test-note" className="text-xs font-semibold">
              Бележка (по желание)
            </Label>
            <Input
              id="quick-test-note"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="напр. Отличен фокус, да работи за тайминг..."
              className="rounded-xl text-xs dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs"
            >
              Отказ
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700"
            >
              {isSaving ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-1.5 size-3.5" />
              )}
              Запиши резултата
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
