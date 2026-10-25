"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/auth-context";
import { addAssessment } from "@/services/assessment-service";
import { getAllMembers } from "@/services/member-service";
import { BadmintonTest } from "@/types/assessment.types";
import { Member } from "@/types/member.types";

interface ConductTestDialogProps {
  test: BadmintonTest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ParticipantEntry = {
  memberId: string;
  scoreDisplay: string;
  scoreNum: number;
  notes: string;
};

import { generateAssessmentAnalysis } from "@/lib/assessment-analysis";

export default function ConductTestDialog({
  test,
  open,
  onOpenChange,
}: ConductTestDialogProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [participants, setParticipants] = useState<ParticipantEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    if (open) {
      loadMembers();
      // Initialize with one empty participant
      setParticipants([
        { memberId: "", scoreDisplay: "", scoreNum: 0, notes: "" },
      ]);
    }
  }, [open]);

  const loadMembers = async () => {
    setIsLoading(true);
    try {
      const data = await getAllMembers();
      setMembers(data.filter((m) => m.status === "active"));
    } catch (error) {
      console.error("Грешка при зареждане на членовете:", error);
      toast.error("Грешка при зареждане на членовете");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddParticipant = () => {
    setParticipants([
      ...participants,
      { memberId: "", scoreDisplay: "", scoreNum: 0, notes: "" },
    ]);
  };

  const handleRemoveParticipant = (index: number) => {
    const newP = [...participants];
    newP.splice(index, 1);
    setParticipants(newP);
  };

  const updateParticipant = (
    index: number,
    field: keyof ParticipantEntry,
    value: string | number
  ) => {
    const newP = [...participants];
    newP[index] = { ...newP[index], [field]: value };

    // Auto-parse score Num if they typed a display score (e.g. "10" -> 10)
    if (field === "scoreDisplay") {
      const parsed = parseFloat(value as string);
      if (!isNaN(parsed)) {
        newP[index].scoreNum = parsed;
      }
    }
    setParticipants(newP);
  };

  const handleSave = async () => {
    if (!test || !user) return;

    // Validate
    const validParticipants = participants.filter(
      (p) => p.memberId && p.scoreDisplay
    );
    if (validParticipants.length === 0) {
      toast.error("Моля, добавете поне един участник с резултат.");
      return;
    }

    setIsSubmitting(true);
    try {
      const promises = validParticipants.map((p) => {
        const member = members.find((m) => m.id === p.memberId);
        if (!member) return Promise.resolve();

        const analysisResult = generateAssessmentAnalysis(
          test.id,
          p.scoreNum,
          test.scoreType
        );

        return addAssessment({
          memberId: p.memberId,
          memberName: member.name,
          date: new Date(date).toISOString(),
          testId: test.id,
          testName: test.name,
          ageGroupAtTest: test.ageGroup,
          score: p.scoreNum,
          scoreDisplay: p.scoreDisplay,
          notes: p.notes,
          coachAnalysis: analysisResult.analysis,
          recommendedExercises: analysisResult.recommendation,
          recordedBy: {
            userId: user.uid,
            userName: user.displayName || user.email || "Unknown",
          },
        });
      });

      await Promise.all(promises);
      toast.success("Резултатите са запазени успешно!");
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Грешка при запазване на резултатите.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!test) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] sm:max-h-[85vh] w-[calc(100%-1.25rem)] sm:w-full sm:max-w-2xl lg:max-w-3xl flex-col gap-0 overflow-hidden rounded-2xl sm:rounded-3xl border border-zinc-200/80 bg-white p-0 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 [&>button:last-child]:top-3.5 [&>button:last-child]:right-3.5 sm:[&>button:last-child]:top-4 sm:[&>button:last-child]:right-4">
        {/* Fixed Sticky Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-zinc-100 bg-zinc-50/50 px-4 py-3 sm:px-5 sm:py-3.5 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="flex items-center gap-2.5 pr-8 min-w-0">
            <span className="shrink-0 rounded-lg bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              {test.ageGroup}
            </span>
            <div className="min-w-0">
              <DialogTitle className="truncate text-base font-bold text-zinc-900 sm:text-lg dark:text-white">
                {test.name}
              </DialogTitle>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                Въвеждане на резултати от тест
              </p>
            </div>
          </div>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto overscroll-contain p-3.5 sm:p-4.5 space-y-3.5 min-h-0">
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 text-sm">
            <p>
              <strong>Цел/Правила:</strong> {test.description}
            </p>
            <p className="mt-2">
              <strong>Оценяване:</strong> {test.scoring}
            </p>
          </div>

          <div>
            <Label>Дата на провеждане</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full sm:w-48"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-bold">
                Участници и Резултати
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddParticipant}
              >
                <Plus className="mr-1 size-4" />
                Добави дете
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="size-6 animate-spin text-zinc-400" />
              </div>
            ) : (
              <div className="space-y-3">
                {participants.map((p, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-start gap-3 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center"
                  >
                    <div className="w-full flex-1">
                      <Select
                        value={p.memberId}
                        onValueChange={(val) =>
                          updateParticipant(index, "memberId", val)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Избери състезател..." />
                        </SelectTrigger>
                        <SelectContent>
                          {members.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.name} {m.ageGroup ? `(${m.ageGroup})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-full sm:w-32">
                      <Input
                        placeholder={`Резултат (${test.scoreUnit || ""})`}
                        value={p.scoreDisplay}
                        onChange={(e) =>
                          updateParticipant(
                            index,
                            "scoreDisplay",
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <div className="w-full flex-1">
                      <Input
                        placeholder="Бележка (опц.)"
                        value={p.notes}
                        onChange={(e) =>
                          updateParticipant(index, "notes", e.target.value)
                        }
                      />
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:bg-red-50 hover:text-red-700"
                      onClick={() => handleRemoveParticipant(index)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}

                {participants.length === 0 && (
                  <p className="py-4 text-center text-sm text-zinc-500">
                    Няма добавени участници. Натиснете &quot;Добави дете&quot;.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Fixed Sticky Footer */}
        <div className="shrink-0 flex items-center justify-end gap-2 border-t border-zinc-100 bg-zinc-50/80 px-4 py-2.5 sm:px-5 sm:py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="h-9 rounded-xl px-4 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          >
            Отказ
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSubmitting || participants.length === 0}
            className="h-9 rounded-xl bg-indigo-600 px-5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
          >
            {isSubmitting && (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            )}
            Запази резултатите
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
