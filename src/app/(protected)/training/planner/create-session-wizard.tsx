"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Exercise,
  TrainingMode,
  LocationType,
  PlannerSession,
} from "@/types/planner.types";
import { plannerService } from "@/services/planner-service";
import { useAppStore } from "@/store/use-app-store";
import {
  Loader2,
  CalendarRange,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveSuccess: () => void;
}

const AGE_GROUPS = ["U9", "U11", "U13", "U15", "U17", "U19", "Мъже и Жени"];

export default function CreateSessionWizard({
  open,
  onOpenChange,
  onSaveSuccess,
}: Props) {
  const { activeBranch } = useAppStore();

  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [mode, setMode] = useState<TrainingMode>("season");
  const [location, setLocation] = useState<LocationType>("indoor");
  const [ageGroup, setAgeGroup] = useState<string>("U13");
  const [addToSchedule, setAddToSchedule] = useState(false);

  // Generated Data
  const [matchedExercises, setMatchedExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    if (open) {
      setStep(1);
      setTitle("");
      setDate(new Date().toISOString().slice(0, 10));
      setMode("season");
      setLocation("indoor");
      setAgeGroup("U13");
      setAddToSchedule(false);
      setMatchedExercises([]);
    }
  }, [open]);

  const generatePlan = async () => {
    setIsFetching(true);
    try {
      const allExercises = await plannerService.getExercises(activeBranch);

      // Magic Filter Logic
      const filtered = allExercises.filter(
        (ex) =>
          ex.ageGroups.includes(ageGroup) &&
          (ex.location.includes(location) || ex.location.includes("both"))
      );

      // Take up to 5 diverse exercises
      setMatchedExercises(filtered.slice(0, 5));
      setStep(2);
    } catch (error) {
      console.error(error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload: Omit<
        PlannerSession,
        "id" | "siteId" | "createdAt" | "updatedAt"
      > = {
        title: title || `Тренировка ${ageGroup}`,
        date,
        mode,
        location,
        ageGroup,
        exercises: matchedExercises,
        status: "planned",
      };

      const newSessionId = await plannerService.addSession(
        activeBranch,
        payload
      );

      // If user checked "Add to schedule", we can handle it via the schedule service
      // Or by triggering an API call. For now, we mock it or pass it.
      if (addToSchedule) {
        console.log("Adding to public schedule:", newSessionId);
      }

      onSaveSuccess();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const uniqueEquipment = Array.from(
    new Set(
      matchedExercises
        .map((ex) => ex.equipment)
        .filter((e) => e && e.trim() !== "Няма" && e.trim() !== "Няма.")
    )
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CalendarRange className="w-5 h-5 text-indigo-600" />
            Универсален Планировчик
          </DialogTitle>
          <DialogDescription>
            Използвай съветника за автоматично генериране на методически план.
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-6 py-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-2 gap-4">
              <div
                className={cn(
                  "p-4 border rounded-xl cursor-pointer transition-all",
                  mode === "season"
                    ? "border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600/20"
                    : "border-zinc-200 hover:border-zinc-300"
                )}
                onClick={() => setMode("season")}
              >
                <h4 className="font-bold text-zinc-900 mb-1">Целогодишна</h4>
                <p className="text-xs text-zinc-500">
                  Регулярен тренировъчен процес по време на състезателния сезон.
                </p>
              </div>
              <div
                className={cn(
                  "p-4 border rounded-xl cursor-pointer transition-all",
                  mode === "camp"
                    ? "border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600/20"
                    : "border-zinc-200 hover:border-zinc-300"
                )}
                onClick={() => setMode("camp")}
              >
                <h4 className="font-bold text-zinc-900 mb-1">
                  Интензивен Лагер
                </h4>
                <p className="text-xs text-zinc-500">
                  Двуразови тренировки със стриктен мониторинг на умората (RPE).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div
                className={cn(
                  "p-4 border rounded-xl cursor-pointer transition-all",
                  location === "indoor"
                    ? "border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600/20"
                    : "border-zinc-200 hover:border-zinc-300"
                )}
                onClick={() => setLocation("indoor")}
              >
                <h4 className="font-bold text-zinc-900 mb-1">
                  В ЗАЛА (Indoor)
                </h4>
                <p className="text-xs text-zinc-500">
                  Корт, пера, мрежа и специфична бадминтон техника.
                </p>
              </div>
              <div
                className={cn(
                  "p-4 border rounded-xl cursor-pointer transition-all",
                  location === "outdoor"
                    ? "border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600/20"
                    : "border-zinc-200 hover:border-zinc-300"
                )}
                onClick={() => setLocation("outdoor")}
              >
                <h4 className="font-bold text-zinc-900 mb-1">НА ОТКРИТО</h4>
                <p className="text-xs text-zinc-500">
                  Стадион, трева, пясък. ОФП и координационни игри.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Възрастова група</Label>
                <Select
                  value={ageGroup}
                  onValueChange={(val) => setAgeGroup(val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AGE_GROUPS.map((ag) => (
                      <SelectItem key={ag} value={ag}>
                        {ag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Дата на тренировката</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t">
              <Button
                onClick={generatePlan}
                disabled={isFetching}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700"
              >
                {isFetching ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ChevronRight className="w-4 h-4 mr-2" />
                )}
                Генерирай Тренировка
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 py-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <Label>Име на сесията</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`Тренировка ${ageGroup} (${location === "indoor" ? "Зала" : "Открито"})`}
              />
            </div>

            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4">
              <h3 className="font-bold text-zinc-900 flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                Генериран План ({matchedExercises.length} упражнения)
              </h3>

              {matchedExercises.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  Няма намерени упражнения за тази комбинация от възраст и
                  локация.
                </p>
              ) : (
                <div className="space-y-3">
                  {matchedExercises.map((ex, idx) => (
                    <div
                      key={ex.id}
                      className="flex gap-3 bg-white border border-zinc-100 p-3 rounded-lg shadow-sm"
                    >
                      <div className="bg-indigo-50 text-indigo-700 font-black w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-bold text-zinc-900 text-sm">
                          {ex.name}
                        </div>
                        <div className="text-xs text-zinc-500 mt-0.5">
                          {ex.durationMinutes} мин | {ex.category.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {uniqueEquipment.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <h4 className="font-bold text-amber-900 text-sm mb-2">
                  Чеклист Екипировка
                </h4>
                <ul className="list-disc pl-5 text-sm text-amber-800 space-y-1">
                  {uniqueEquipment.map((eq, i) => (
                    <li key={i}>{eq}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="schedule"
                checked={addToSchedule}
                onCheckedChange={(c) => setAddToSchedule(c as boolean)}
              />
              <label
                htmlFor="schedule"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Покажи в публичния График на клуба
              </label>
            </div>

            <DialogFooter className="flex justify-between w-full pt-4 border-t">
              <Button variant="outline" onClick={() => setStep(1)}>
                Назад
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || matchedExercises.length === 0}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Запази Тренировката
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
