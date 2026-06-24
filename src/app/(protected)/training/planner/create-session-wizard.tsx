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
import { getEventsForPeriod } from "@/services/schedule-service";
import { getAllMembers } from "@/services/member-service";
import { ScheduleEvent, Member } from "@/types";
import { getAgeGroup } from "@/lib/utils";
import {
  Loader2,
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  Clock,
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

  // Calendar Import State
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("none");
  const [eventDuration, setEventDuration] = useState<number>(90);
  const [attendees, setAttendees] = useState<
    { member: Member; ageGroup: string }[]
  >([]);

  // Generated Data
  const [groupedExercises, setGroupedExercises] = useState<
    { ageGroup: string; exercises: Exercise[] }[]
  >([]);

  useEffect(() => {
    if (open) {
      setStep(1);
      setTitle("");
      setDate(new Date().toISOString().slice(0, 10));
      setMode("season");
      setLocation("indoor");
      setAgeGroup("U13");
      setAddToSchedule(false);
      setGroupedExercises([]);
      setSelectedEventId("none");
      setAttendees([]);
      setEventDuration(90);

      // Load upcoming events
      const fetchEvents = async () => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const future = new Date();
        future.setDate(future.getDate() + 14);
        try {
          const fetched = await getEventsForPeriod(now, future);
          setEvents(
            fetched.filter((e) => e.type === "training" || e.type === "camp")
          );
        } catch (error) {
          console.error("Failed to load events", error);
        }
      };
      fetchEvents();
    }
  }, [open]);

  const handleEventSelect = async (eventId: string) => {
    setSelectedEventId(eventId);
    if (eventId === "none") {
      setAttendees([]);
      setEventDuration(90);
      return;
    }

    const evt = events.find((e) => e.id === eventId);
    if (!evt) return;

    const start = new Date(evt.startDate).getTime();
    const end = new Date(evt.endDate).getTime();
    const durationMins = Math.round((end - start) / 60000);
    setEventDuration(durationMins > 0 ? durationMins : 90);
    setDate(evt.startDate.slice(0, 10));
    setMode(evt.type === "camp" ? "camp" : "season");
    setTitle(evt.title);

    setIsFetching(true);
    try {
      const allMembers = await getAllMembers();
      const evtMembers = allMembers.filter((m) =>
        evt.attendeeMemberIds.includes(m.id)
      );

      const mapped = evtMembers.map((m) => {
        let group = m.dateOfBirth ? getAgeGroup(m.dateOfBirth) : "U13";
        if (group === "Мъже/Жени") group = "Мъже и Жени";
        if (group === "Неопределена") group = "U13";
        return { member: m, ageGroup: group };
      });
      setAttendees(mapped);
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetching(false);
    }
  };

  const updateAttendeeGroup = (memberId: string, newGroup: string) => {
    setAttendees((prev) =>
      prev.map((a) =>
        a.member.id === memberId ? { ...a, ageGroup: newGroup } : a
      )
    );
  };

  const generatePlan = async () => {
    setIsFetching(true);
    try {
      const allExercises = await plannerService.getExercises(activeBranch);

      let targetGroups = Array.from(new Set(attendees.map((a) => a.ageGroup)));
      if (targetGroups.length === 0) {
        targetGroups = [ageGroup]; // Fallback to manual selection
      }

      const newGrouped: { ageGroup: string; exercises: Exercise[] }[] = [];

      for (const group of targetGroups) {
        const filtered = allExercises.filter(
          (ex) =>
            ex.ageGroups.includes(group) &&
            (ex.location.includes(location) || ex.location.includes("both"))
        );

        const selected: Exercise[] = [];
        let currentDuration = 0;

        // Simple shuffle
        const shuffled = [...filtered].sort(() => 0.5 - Math.random());

        for (const ex of shuffled) {
          if (currentDuration + ex.durationMinutes <= eventDuration) {
            selected.push(ex);
            currentDuration += ex.durationMinutes;
          }
          if (currentDuration >= eventDuration - 10) break;
        }

        if (selected.length === 0 && filtered.length > 0) {
          selected.push(filtered[0]);
        }

        newGrouped.push({ ageGroup: group, exercises: selected });
      }

      setGroupedExercises(newGrouped);
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
      const targetGroups = groupedExercises.map((g) => g.ageGroup);

      const payload: Omit<
        PlannerSession,
        "id" | "siteId" | "createdAt" | "updatedAt"
      > = {
        title: title || `Тренировка ${targetGroups.join(", ")}`,
        date,
        mode,
        location,
        targetGroups,
        groupedExercises,
        status: "planned",
      };

      const newSessionId = await plannerService.addSession(
        activeBranch,
        payload
      );

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
      groupedExercises
        .flatMap((g) => g.exercises)
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
            Импортирайте от графика или планирайте ръчно тренировки по
            възрастови групи.
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-6 py-4 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Calendar Import Section */}
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl space-y-4">
              <div className="space-y-2">
                <Label className="text-indigo-900 font-bold">
                  Импорт от График
                </Label>
                <Select
                  value={selectedEventId}
                  onValueChange={handleEventSelect}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Изберете предстоящо събитие..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      Без импорт (ръчно планиране)
                    </SelectItem>
                    {events.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {new Date(e.startDate).toLocaleDateString("bg-BG")} -{" "}
                        {e.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-indigo-600/80">
                  Избирайки събитие, системата автоматично ще генерира план за
                  всяка присъстваща възрастова група.
                </p>
              </div>

              {attendees.length > 0 && (
                <div className="bg-white p-4 rounded-xl border border-indigo-100 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-sm text-zinc-900">
                      Разпределение на участниците ({attendees.length})
                    </h4>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md flex items-center">
                      <Clock size={12} className="mr-1" /> {eventDuration} мин
                    </span>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                    {attendees.map((a) => (
                      <div
                        key={a.member.id}
                        className="flex items-center justify-between bg-zinc-50 hover:bg-zinc-100 transition-colors p-2 border border-zinc-200 rounded-lg"
                      >
                        <span className="text-sm font-medium text-zinc-700">
                          {a.member.firstName} {a.member.lastName}
                        </span>
                        <Select
                          value={a.ageGroup}
                          onValueChange={(val) =>
                            updateAttendeeGroup(a.member.id, val)
                          }
                        >
                          <SelectTrigger className="w-28 h-8 text-xs font-bold bg-white">
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
                    ))}
                  </div>
                </div>
              )}
            </div>

            {selectedEventId === "none" && (
              <>
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
                    <h4 className="font-bold text-zinc-900 mb-1">
                      Целогодишна
                    </h4>
                    <p className="text-xs text-zinc-500">
                      Регулярен тренировъчен процес по време на състезателния
                      сезон.
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
                      Двуразови тренировки със стриктен мониторинг на умората.
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
                    <h4 className="font-bold text-zinc-900 mb-1">В ЗАЛА</h4>
                    <p className="text-xs text-zinc-500">
                      Корт, пера, специфична техника.
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
                      Стадион, трева, ОФП.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Възрастова група (Ръчно)</Label>
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
                    <Label>Продължителност (мин)</Label>
                    <Input
                      type="number"
                      value={eventDuration}
                      onChange={(e) =>
                        setEventDuration(Number(e.target.value) || 90)
                      }
                    />
                  </div>
                </div>
              </>
            )}

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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Име на сесията</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Име на тренировката"
                />
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

            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4">
              <h3 className="font-bold text-zinc-900 flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                Генериран План ({eventDuration} мин)
              </h3>

              {groupedExercises.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  Няма генерирани упражнения.
                </p>
              ) : (
                <div className="space-y-6">
                  {groupedExercises.map((group, gIdx) => (
                    <div key={gIdx} className="space-y-3">
                      <h4 className="font-black text-indigo-900 bg-indigo-100 inline-block px-3 py-1 rounded-md text-sm">
                        Група: {group.ageGroup}
                      </h4>
                      {group.exercises.length === 0 ? (
                        <p className="text-sm text-zinc-500 italic">
                          Няма подходящи упражнения.
                        </p>
                      ) : (
                        group.exercises.map((ex, idx) => (
                          <div
                            key={ex.id}
                            className="flex gap-3 bg-white border border-zinc-200 p-3 rounded-lg shadow-sm"
                          >
                            <div className="bg-indigo-50 text-indigo-700 font-black w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                              {idx + 1}
                            </div>
                            <div>
                              <div className="font-bold text-zinc-900 text-sm">
                                {ex.name}
                              </div>
                              <div className="text-xs text-zinc-500 mt-0.5">
                                {ex.durationMinutes} мин |{" "}
                                {ex.category.toUpperCase()}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
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
                disabled={isSaving || groupedExercises.length === 0}
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
