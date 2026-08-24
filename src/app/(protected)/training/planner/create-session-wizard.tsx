"use client";

import { closestCenter, DndContext } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { AlertTriangle, Loader2, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { inventoryService } from "@/services/inventory-service";
import { getAllMembers } from "@/services/member-service";
import { plannerService } from "@/services/planner-service";
import { getEventById } from "@/services/schedule-service";
import { useAppStore } from "@/store/use-app-store";
import { InventoryItem } from "@/types/inventory.types";
import {
  Exercise,
  LocationType,
  PlannerSession,
  SessionBlock,
  SessionBlockItem,
  TrainingMode,
} from "@/types/planner.types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveSuccess: () => void;
  initialCampId?: string;
  initialDate?: string;
  initialImportTemplateId?: string;
  initialSession?: PlannerSession;
}

type WizardStep = 1 | 2 | 3;

export default function CreateSessionWizard({
  open,
  onOpenChange,
  onSaveSuccess,
  initialCampId,
  initialDate,
  initialImportTemplateId,
  initialSession,
}: Props) {
  const { activeBranch } = useAppStore();

  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  // Form State
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [mode, setMode] = useState<TrainingMode>("season");
  const [location, setLocation] = useState<LocationType>("court");
  const [totalDuration, setTotalDuration] = useState<number>(60);
  const [coachNotes, setCoachNotes] = useState("");

  // Advanced Tracker State
  const [totalKids, setTotalKids] = useState<number>(15);
  const [kidsPerStation, setKidsPerStation] = useState<number>(3);
  const [globalInventory, setGlobalInventory] = useState<InventoryItem[]>([]);
  const [sessionInventory, setSessionInventory] = useState<
    Record<string, number>
  >({}); // id -> qty
  const [isRainyDay, setIsRainyDay] = useState(false);

  // --- Real Logic Helpers ---
  const injectHydrationBreaks = () => {
    const newBlocks = [...blocks];
    newBlocks.forEach((block) => {
      let cumulative = 0;
      const newItems: SessionBlockItem[] = [];
      block.items.forEach((item) => {
        newItems.push(item);
        cumulative += item.durationMinutes;
        if (cumulative >= 20 && !item.isHydrationBreak) {
          newItems.push({
            id: uuidv4(),
            type: "exercise",
            durationMinutes: 5,
            isHydrationBreak: true,
            exercise: {
              id: "hydration-" + uuidv4(),
              name: "💧 Пауза за хидратация",
              category: "cooldown",
              description: "5 минути почивка за вода и нормализиране на пулса.",
              durationMinutes: 5,
              coachingPoints: [],
              location: [],
              ageGroups: [],
              equipment: [],
              prerequisites: [],
              intensity: 1,
              complexityLevel: 1,
              siteId: "bkgalabovo",
              createdAt: "",
              updatedAt: "",
            },
          });
          cumulative = 0; // reset after break
        }
      });
      block.items = newItems;
    });
    setBlocks(newBlocks);
  };

  const toggleRainyDay = () => {
    const nextState = !isRainyDay;
    setIsRainyDay(nextState);

    if (nextState) {
      // Swap outdoor with indoor
      const newBlocks = [...blocks];
      newBlocks.forEach((block) => {
        block.items.forEach((item) => {
          if (item.type === "exercise" && item.exercise) {
            const loc = item.exercise.location;
            if (
              loc &&
              !loc.includes("court") &&
              (loc.includes("beach") || loc.includes("stadium"))
            ) {
              // Swap with a generic indoor exercise
              item.exercise = {
                ...item.exercise,
                name: "🌧️ (Резерва) Вътрешна ОФП / Мобилност",
                location: ["court"],
              };
            }
          }
        });
      });
      setBlocks(newBlocks);
      setLocation("court");
    }
  };
  // --------------------------

  // Library
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Groups & Participants
  const [availableParticipants, setAvailableParticipants] = useState<
    { id: string; name: string }[]
  >([]);
  const [groups, setGroups] = useState<
    { id: string; name: string; memberIds: string[] }[]
  >([{ id: "group-a", name: "Група А", memberIds: [] }]);
  const [newGroupName, setNewGroupName] = useState("");

  // Time-Budget Blocks
  const [blocks, setBlocks] = useState<SessionBlock[]>([]);

  // Station Builder Modal
  const [showStationModal, setShowStationModal] = useState(false);
  type StationPhaseType = "warmup" | "main" | "cooldown";
  const [stationPhase, setStationPhase] = useState<StationPhaseType>("main");
  const [stationDuration, setStationDuration] = useState<number>(10);
  const [stationRotations, setStationRotations] = useState<
    { groupId: string; exerciseId: string }[]
  >([]);

  // Dynamic Math for Kids/Stations
  useEffect(() => {
    if (totalKids && stationRotations.length > 0) {
      const perStation = Math.floor(totalKids / stationRotations.length);
      setKidsPerStation(perStation > 0 ? perStation : 1);
    } else {
      setKidsPerStation(Math.max(1, Math.floor(totalKids / 5))); // fallback to 5 stations approx
    }
  }, [totalKids, stationRotations.length]);

  useEffect(() => {
    if (open) {
      const fetchInitialData = async () => {
        setIsFetching(true);
        try {
          const [ex, inv] = await Promise.all([
            plannerService.getExercises(activeBranch),
            inventoryService.getInventory(activeBranch),
          ]);
          setAllExercises(ex);
          setGlobalInventory(inv);

          // By default, select all global inventory for this session
          const initialSessInv: Record<string, number> = {};
          inv.forEach((i) => {
            initialSessInv[i.id] = i.totalQuantity;
          });
          setSessionInventory(initialSessInv);

          // Fetch participants based on mode
          if (initialCampId) {
            const campEvent = await getEventById(initialCampId);
            if (campEvent && campEvent.attendees) {
              setAvailableParticipants(
                campEvent.attendees.map((a) => ({
                  id: a.memberId,
                  name: a.name,
                }))
              );
            }
          } else {
            const allMembers = await getAllMembers();
            setAvailableParticipants(
              allMembers
                .filter((m) => m.status === "active")
                .map((m) => ({
                  id: m.id,
                  name: `${m.firstName} ${m.lastName}`,
                }))
            );
          }

          // If editing an existing session, pre-fill all form state
          if (initialSession) {
            setTitle(initialSession.title);
            setDate(initialSession.date);
            setMode(initialSession.mode);
            setLocation(initialSession.location);
            setTotalDuration(
              initialSession.blocks?.reduce(
                (acc, b) => acc + b.targetDuration,
                0
              ) || 60
            );
            setCoachNotes(initialSession.coachNotes || "");
            setGroups(
              initialSession.sessionGroups?.map((g) => ({
                id: g.id,
                name: g.name,
                memberIds: g.memberIds || [],
              })) || [{ id: uuidv4(), name: "Всички", memberIds: [] }]
            );
            setSearchQuery("");
            setSelectedCategory("all");

            // Map planner session blocks to wizard blocks
            if (initialSession.blocks && initialSession.blocks.length > 0) {
              const mappedBlocks: SessionBlock[] = initialSession.blocks.map(
                (b) => ({
                  ...b,
                  items: b.items.map((item) => ({
                    ...item,
                    exercise: item.exercise
                      ? { ...item.exercise }
                      : undefined,
                  }))
                })
              );
              setBlocks(mappedBlocks);
            } else if (
              initialSession.groupedExercises &&
              initialSession.groupedExercises.length > 0
            ) {
              // Convert legacy groupedExercises to blocks
              const mappedBlocks: SessionBlock[] = [
                "warmup",
                "main",
                "cooldown",
              ].map((phase) => ({
                id: phase,
                phase: phase as "warmup" | "main" | "cooldown",
                targetDuration: 0,
                items:
                  initialSession.groupedExercises
                    ?.find((g) => g.ageGroup === "all")?.exercises.map((ex) => ({
                      id: uuidv4(),
                      type: "exercise",
                      durationMinutes: ex.durationMinutes || 5,
                      exercise: ex,
                      targetGroupId: undefined,
                    })) || [],
              }));
              setBlocks(mappedBlocks);
            }

            // Calculate total duration from blocks
            const calculatedDuration =
              initialSession.blocks?.reduce(
                (acc, b) => acc + b.targetDuration,
                0
              ) || 60;
            setTotalDuration(calculatedDuration);
            setCoachNotes(initialSession.coachNotes || "");
          } else {
            // Reset to defaults for new session
            setTitle("");
            setDate(initialDate || new Date().toISOString().slice(0, 10));
            setMode(initialCampId ? "camp" : "season");
            setLocation(initialCampId ? "stadium" : "court");
            setTotalDuration(60);
            setGroups([{ id: uuidv4(), name: "Всички", memberIds: [] }]);
            setSearchQuery("");
            setSelectedCategory("all");
          }
          } catch (error) {
          console.error("Failed to load exercises or template", error);
        } finally {
          setIsFetching(false);
        }
      };
      fetchInitialData();
    }
  }, [open, activeBranch, initialCampId, initialDate, initialImportTemplateId]);

  // Recalculate block target durations when total duration changes
  useEffect(() => {
    const warmupTarget = Math.round(totalDuration * 0.1);
    const cooldownTarget = Math.round(totalDuration * 0.1);
    const mainTarget = totalDuration - warmupTarget - cooldownTarget;

    setBlocks((prev) => {
      // If we don't have blocks yet, create them
      if (prev.length === 0) {
        return [
          {
            id: "warmup",
            phase: "warmup",
            targetDuration: warmupTarget,
            items: [],
          },
          { id: "main", phase: "main", targetDuration: mainTarget, items: [] },
          {
            id: "cooldown",
            phase: "cooldown",
            targetDuration: cooldownTarget,
            items: [],
          },
        ];
      }
      // Otherwise just update targets
      return prev.map((b) => {
        if (b.phase === "warmup") return { ...b, targetDuration: warmupTarget };
        if (b.phase === "main") return { ...b, targetDuration: mainTarget };
        if (b.phase === "cooldown")
          return { ...b, targetDuration: cooldownTarget };
        return b;
      });
    });
  }, [totalDuration]);

  const addGroup = () => {
    if (newGroupName.trim()) {
      setGroups([
        ...groups,
        { id: uuidv4(), name: newGroupName.trim(), memberIds: [] },
      ]);
      setNewGroupName("");
    }
  };

  const removeGroup = (id: string) => {
    setGroups(groups.filter((g) => g.id !== id));
  };

  const toggleParticipantInGroup = (groupId: string, participantId: string) => {
    setGroups(
      groups.map((g) => {
        if (g.id === groupId) {
          const hasMember = g.memberIds.includes(participantId);
          return {
            ...g,
            memberIds: hasMember
              ? g.memberIds.filter((id) => id !== participantId)
              : [...g.memberIds, participantId],
          };
        }
        return g;
      })
    );
  };

  const addExerciseToBlock = (phase: StationPhaseType, exercise: Exercise) => {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.phase === phase) {
          return {
            ...block,
            items: [
              ...block.items,
              {
                id: uuidv4(),
                type: "exercise",
                durationMinutes: exercise.durationMinutes || 5,
                exercise,
                targetGroupId: groups.length === 1 ? groups[0].id : undefined, // Assign to first if only one
              },
            ],
          };
        }
        return block;
      })
    );
  };

  const removeItem = (phase: StationPhaseType, itemId: string) => {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.phase === phase) {
          return {
            ...block,
            items: block.items.filter((item) => item.id !== itemId),
          };
        }
        return block;
      })
    );
  };

  const updateItemDuration = (
    phase: "warmup" | "main" | "cooldown",
    itemId: string,
    newDuration: number
  ) => {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.phase === phase) {
          return {
            ...block,
            items: block.items.map((item) =>
              item.id === itemId
                ? { ...item, durationMinutes: newDuration }
                : item
            ),
          };
        }
        return block;
      })
    );
  };

  const updateItemTargetGroup = (
    phase: "warmup" | "main" | "cooldown",
    itemId: string,
    groupId: string
  ) => {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.phase === phase) {
          return {
            ...block,
            items: block.items.map((item) =>
              item.id === itemId
                ? {
                    ...item,
                    targetGroupId: groupId === "none" ? undefined : groupId,
                  }
                : item
            ),
          };
        }
        return block;
      })
    );
  };

  const saveStation = () => {
    if (stationRotations.length === 0) return;

    // Resolve exercises
    const rotations = stationRotations
      .map((r) => {
        const ex = allExercises.find((e) => e.id === r.exerciseId);
        return {
          groupId: r.groupId,
          exercise: ex!,
        };
      })
      .filter((r) => r.exercise !== undefined);

    const newStation: SessionBlockItem = {
      id: uuidv4(),
      type: "station",
      durationMinutes: stationDuration,
      rotations,
    };

    setBlocks((prev) =>
      prev.map((b) => {
        if (b.phase === stationPhase) {
          return { ...b, items: [...b.items, newStation] };
        }
        return b;
      })
    );
    setShowStationModal(false);
  };

  const handleSave = async () => {
    if (!title) {
      alert("Въведи заглавие на тренировката.");
      return;
    }

    setIsSaving(true);
    try {
      const sessionData: Omit<
        PlannerSession,
        "id" | "siteId" | "createdAt" | "updatedAt"
      > = {
        date,
        mode,
        location,
        title,
        coachNotes,
        status: "planned",
        campId: initialCampId,
        blocks,
        targetGroups: groups.map((g) => g.name),
        sessionGroups: groups,
      };

      // Strip undefined values to prevent Firebase errors
      const cleanSessionData = JSON.parse(JSON.stringify(sessionData));

      if (initialSession) {
        // Editing existing session
        await plannerService.updateSession(initialSession.id, cleanSessionData);
      } else {
        // Creating new session
        await plannerService.addSession(activeBranch, cleanSessionData);
      }
      onSaveSuccess();
    } catch (error) {
      console.error("Failed to save session", error);
      alert("Възникна грешка при запис на тренировката.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredExercises = allExercises.filter((ex) => {
    // 1. Category filter
    if (selectedCategory === "beach" && !ex.location?.includes("beach"))
      return false;
    if (
      selectedCategory === "circuit" &&
      !ex.name.toLowerCase().includes("станция")
    )
      return false;
    if (
      selectedCategory === "tactical" &&
      ex.category !== "tactics" &&
      !ex.name.toLowerCase().includes("мулти-шатъл")
    )
      return false;
    if (
      selectedCategory !== "all" &&
      !["beach", "circuit", "tactical"].includes(selectedCategory) &&
      ex.category !== selectedCategory
    )
      return false;

    // 2. Search filter
    if (
      searchQuery &&
      !ex.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    return true;
  });

  const getPhaseName = (phase: string) => {
    if (phase === "warmup") return "Загрявка";
    if (phase === "main") return "Основна част";
    return "Разпускане (Cooldown)";
  };

  const getCategoryCount = (cat: string) => {
    if (cat === "all") return allExercises.length;
    if (cat === "beach")
      return allExercises.filter((ex) => ex.location?.includes("beach")).length;
    if (cat === "circuit")
      return allExercises.filter((ex) =>
        ex.name.toLowerCase().includes("станция")
      ).length;
    if (cat === "tactical")
      return allExercises.filter(
        (ex) =>
          ex.category === "tactics" ||
          ex.name.toLowerCase().includes("мулти-шатъл")
      ).length;
    return allExercises.filter((ex) => ex.category === cat).length;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-7xl gap-0 overflow-hidden bg-zinc-50 p-0">
        <DialogHeader className="z-10 flex-shrink-0 border-b border-zinc-200 bg-white p-6">
          <DialogTitle className="text-xl">
            {initialSession
              ? "Редактиране на тренировка"
              : "Конструктор на тренировка (Time-Budget Builder)"}
          </DialogTitle>
          <DialogDescription>
            {initialSession
              ? `Редактирайте тренировката: ${initialSession.title}`
              : "Разпределете упражненията и станциите за вашите групи. Времето се разпределя автоматично (10% - 80% - 10%)."}
          </DialogDescription>
        </DialogHeader>

        {/* WIZARD HEADER */}
        <div className="flex justify-center gap-6 border-b border-zinc-200 bg-white p-3 text-sm font-medium">
          <div
            className={cn(
              "cursor-pointer rounded-full px-4 py-2 transition-colors",
              currentStep === 1
                ? "bg-indigo-600 text-white shadow"
                : "text-zinc-500 hover:bg-zinc-100"
            )}
            onClick={() => setCurrentStep(1)}
          >
            1. Общи Настройки
          </div>
          <div
            className={cn(
              "cursor-pointer rounded-full px-4 py-2 transition-colors",
              currentStep === 2
                ? "bg-indigo-600 text-white shadow"
                : "text-zinc-500 hover:bg-zinc-100"
            )}
            onClick={() => setCurrentStep(2)}
          >
            2. Конструктор
          </div>
          <div
            className={cn(
              "cursor-pointer rounded-full px-4 py-2 transition-colors",
              currentStep === 3
                ? "bg-indigo-600 text-white shadow"
                : "text-zinc-500 hover:bg-zinc-100"
            )}
            onClick={() => setCurrentStep(3)}
          >
            3. Преглед & Запазване
          </div>
        </div>

        <div className="flex h-[calc(90vh-210px)] w-full flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
          {/* STEP 1: General Settings & Inventory */}
          {currentStep === 1 && (
            <div className="mx-auto w-full max-w-5xl flex-shrink-0 space-y-8 overflow-y-auto p-6">
              {/* Basic Settings */}
              <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-bold text-zinc-800">
                  Основни данни
                </h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs text-zinc-500">Заглавие</Label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Напр. Издръжливост и бързина"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-zinc-500">Дата</Label>
                        <Input
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-zinc-500">
                          Време (мин)
                        </Label>
                        <Input
                          type="number"
                          min={10}
                          max={240}
                          value={totalDuration}
                          onChange={(e) =>
                            setTotalDuration(parseInt(e.target.value) || 60)
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-zinc-500">Локация</Label>
                        <Select
                          value={location}
                          onValueChange={(val) =>
                            setLocation(val as LocationType)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="court">В зала (Корт)</SelectItem>
                            <SelectItem value="stadium">Стадион</SelectItem>
                            <SelectItem value="beach">Плаж</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-zinc-500">
                          Общо деца
                        </Label>
                        <Input
                          type="number"
                          min={1}
                          value={totalKids}
                          onChange={(e) =>
                            setTotalKids(parseInt(e.target.value) || 15)
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-zinc-500">
                      Управление на групи
                    </Label>
                    <div className="mt-2 space-y-2">
                      {groups.map((g) => (
                        <div
                          key={g.id}
                          className="flex items-center justify-between rounded-md border bg-zinc-50 p-2"
                        >
                          <span className="text-sm font-medium">{g.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeGroup(g.id)}
                            className="size-6 p-0 text-red-500"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <Input
                          placeholder="Нова група (напр. Група Б)"
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                          className="h-8 text-sm"
                        />
                        <Button size="sm" className="h-8" onClick={addGroup}>
                          <Plus className="size-4" />
                        </Button>
                      </div>
                    </div>
                    {/* Participant Assignment UI */}
                    <div className="mt-6">
                      <h4 className="mb-2 text-sm font-semibold text-zinc-800">
                        Разпределение на участници
                      </h4>
                      <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border border-zinc-200 bg-zinc-50 p-2">
                        {availableParticipants.length === 0 && (
                          <p className="p-2 text-xs text-zinc-500">
                            Няма намерени участници.
                          </p>
                        )}
                        {availableParticipants.map((p) => (
                          <div
                            key={p.id}
                            className="flex flex-col justify-between rounded-md border border-zinc-100 bg-white p-2 shadow-sm sm:flex-row sm:items-center"
                          >
                            <span className="text-sm font-medium">
                              {p.name}
                            </span>
                            <div className="mt-2 flex flex-wrap gap-4 sm:mt-0">
                              {groups.map((g) => (
                                <label
                                  key={g.id}
                                  className="flex cursor-pointer items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-900"
                                >
                                  <input
                                    type="checkbox"
                                    checked={g.memberIds.includes(p.id)}
                                    onChange={() =>
                                      toggleParticipantInGroup(g.id, p.id)
                                    }
                                    className="size-3.5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-600"
                                  />
                                  {g.name}
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Local Inventory Selection */}
              <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-zinc-800">
                      Налично оборудване за тренировката
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Изберете кои уреди взимате и в каква бройка. Планировчикът
                      ще следи само тях!
                    </p>
                  </div>
                </div>

                {isFetching ? (
                  <div className="flex h-32 items-center justify-center">
                    <Loader2 className="size-6 animate-spin text-indigo-600" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {globalInventory.map((item) => {
                      const isSelected =
                        sessionInventory[item.id] !== undefined;
                      const currentQty =
                        sessionInventory[item.id] || item.totalQuantity;
                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "flex items-center justify-between rounded-lg border p-3 transition-colors",
                            isSelected
                              ? "border-indigo-200 bg-indigo-50/30"
                              : "border-zinc-200 bg-zinc-50 opacity-60"
                          )}
                        >
                          <label className="flex flex-1 cursor-pointer items-center gap-3">
                            <input
                              type="checkbox"
                              className="size-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-600"
                              checked={isSelected}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setSessionInventory((prev) => {
                                  const next = { ...prev };
                                  if (checked) {
                                    next[item.id] = item.totalQuantity; // default to max
                                  } else {
                                    delete next[item.id];
                                  }
                                  return next;
                                });
                              }}
                            />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-zinc-900">
                                {item.name}
                              </span>
                              <span className="text-[10px] text-zinc-500">
                                Глобално: {item.totalQuantity} бр.
                              </span>
                            </div>
                          </label>
                          {isSelected && (
                            <div className="w-20 pl-2">
                              <Input
                                type="number"
                                min={1}
                                className="h-8 text-center text-xs"
                                value={currentQty}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 1;
                                  setSessionInventory((prev) => ({
                                    ...prev,
                                    [item.id]: val,
                                  }));
                                }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Constructor (DND Blocks + Library) */}
          {currentStep === 2 && (
            <div className="flex size-full flex-col lg:flex-row">
              {/* MIDDLE: Time Budget Blocks */}
              <div className="flex min-h-125 w-full flex-col gap-6 overflow-y-auto p-6 lg:flex-1">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-blue-200 bg-blue-50 text-[10px] text-blue-600"
                    onClick={injectHydrationBreaks}
                  >
                    + Хидратация
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-200 bg-slate-50 text-[10px] text-slate-600"
                    onClick={toggleRainyDay}
                  >
                    {isRainyDay ? "Върни Външни" : "План 'Дъжд'"}
                  </Button>
                </div>
                {blocks.map((block) => {
                  const currentTotal = block.items.reduce(
                    (sum, item) => sum + item.durationMinutes,
                    0
                  );
                  const remaining = block.targetDuration - currentTotal;
                  const isOver = remaining < 0;

                  return (
                    <div
                      key={block.id}
                      className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm"
                    >
                      <div className="flex items-center justify-between border-b bg-zinc-100 p-3">
                        <h3 className="font-bold text-zinc-800">
                          {getPhaseName(block.phase)}
                        </h3>
                        <div
                          className={cn(
                            "rounded-full px-3 py-1 text-xs font-bold shadow-sm",
                            isOver
                              ? "bg-red-100 text-red-700"
                              : "bg-emerald-100 text-emerald-700"
                          )}
                        >
                          {isOver
                            ? `Надвишено с ${Math.abs(remaining)} мин (Бюджет: ${block.targetDuration})`
                            : `Остават ${remaining} мин от ${block.targetDuration}`}
                        </div>
                      </div>

                      <DndContext collisionDetection={closestCenter}>
                        <SortableContext
                          items={block.items.map((i) => i.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="min-h-25 space-y-3 p-3">
                            {block.items.map((item) => (
                              <div
                                key={item.id}
                                className={cn(
                                  "group relative rounded-lg border bg-white p-3 shadow-sm transition-colors hover:border-indigo-300",
                                  item.type === "station"
                                    ? "border-amber-200 bg-amber-50"
                                    : "border-zinc-200"
                                )}
                              >
                                <div className="mb-2 flex items-start justify-between">
                                  <div className="pr-6 text-sm font-medium text-zinc-900">
                                    {item.type === "exercise"
                                      ? item.exercise?.name
                                      : "🔄 Станционна Ротация (Успоредно изпълнение)"}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      removeItem(block.phase, item.id)
                                    }
                                    className="absolute top-2 right-2 size-6 text-zinc-400 hover:text-red-500"
                                  >
                                    <Trash2 className="size-4" />
                                  </Button>
                                </div>

                                {item.type === "station" ? (
                                  <div className="mb-2 space-y-1 rounded border border-amber-100 bg-white/50 p-2 text-xs text-zinc-600">
                                    {item.rotations?.map((r, i) => {
                                      const g =
                                        groups.find(
                                          (grp) => grp.id === r.groupId
                                        )?.name || "Група";

                                      // Updated Inventory Check Logic (Using Session Inventory)
                                      const shortages: {
                                        name: string;
                                        missing: number;
                                        isTotallyMissing?: boolean;
                                      }[] = [];

                                      r.exercise?.equipment?.forEach(
                                        (eqName) => {
                                          const globalItem =
                                            globalInventory.find(
                                              (i) =>
                                                i.name.toLowerCase() ===
                                                eqName.toLowerCase()
                                            );

                                          if (
                                            !globalItem ||
                                            sessionInventory[globalItem.id] ===
                                              undefined ||
                                            sessionInventory[globalItem.id] ===
                                              0
                                          ) {
                                            // Missing completely from the session selection
                                            shortages.push({
                                              name: eqName,
                                              missing: kidsPerStation,
                                              isTotallyMissing: true,
                                            });
                                            return;
                                          }

                                          let needed = 0;
                                          if (
                                            globalItem.allocationType ===
                                            "per_child"
                                          ) {
                                            needed =
                                              kidsPerStation *
                                              (globalItem.ratioValue || 1);
                                          } else if (
                                            globalItem.allocationType ===
                                            "per_station"
                                          ) {
                                            needed = globalItem.ratioValue || 1;
                                          } else if (
                                            globalItem.allocationType ===
                                            "ratio"
                                          ) {
                                            needed = Math.ceil(
                                              kidsPerStation *
                                                (globalItem.ratioValue || 1)
                                            );
                                          }

                                          const availableQty =
                                            sessionInventory[globalItem.id];
                                          if (needed > availableQty) {
                                            shortages.push({
                                              name: eqName,
                                              missing: needed - availableQty,
                                            });
                                          }
                                        }
                                      );

                                      return (
                                        <div
                                          key={i}
                                          className="mb-2 flex flex-col gap-1"
                                        >
                                          <div className="flex items-center gap-2">
                                            <Badge
                                              variant="outline"
                                              className="border-amber-200 bg-white text-[10px] text-amber-700"
                                            >
                                              {g}
                                            </Badge>
                                            <span className="font-semibold">
                                              {r.exercise?.name}
                                            </span>
                                            <span className="text-[10px] text-zinc-400">
                                              ({kidsPerStation} деца)
                                            </span>
                                          </div>

                                          {shortages.length > 0 && (
                                            <div className="flex items-center gap-1 rounded border border-red-100 bg-red-50 p-1 text-[10px] text-red-600">
                                              <AlertTriangle className="size-3 flex-shrink-0" />
                                              <span>
                                                Внимание:{" "}
                                                {shortages
                                                  .map((s) =>
                                                    s.isTotallyMissing
                                                      ? `нямате добавени "${s.name.toLowerCase()}" за тази тренировка`
                                                      : `недостиг на ${s.missing} бр. ${s.name.toLowerCase()}`
                                                  )
                                                  .join("; ")}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : null}

                                <div className="mt-2 flex items-center gap-1 rounded bg-zinc-900/5 px-2 py-1">
                                  <Input
                                    type="number"
                                    className="h-7 w-16 bg-white text-xs"
                                    value={item.durationMinutes}
                                    onChange={(e) =>
                                      updateItemDuration(
                                        block.phase,
                                        item.id,
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                  />
                                  <span className="text-xs text-zinc-500">
                                    мин
                                  </span>

                                  {item.type === "exercise" && (
                                    <Select
                                      value={item.targetGroupId || "none"}
                                      onValueChange={(v) =>
                                        updateItemTargetGroup(
                                          block.phase,
                                          item.id,
                                          v
                                        )
                                      }
                                    >
                                      <SelectTrigger className="ml-2 h-7 w-30 bg-white text-xs">
                                        <SelectValue placeholder="За всички" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="none">
                                          За всички групи
                                        </SelectItem>
                                        {groups.map((g) => (
                                          <SelectItem key={g.id} value={g.id}>
                                            {g.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                                </div>
                              </div>
                            ))}

                            {block.items.length === 0 && (
                              <div className="rounded-lg border-2 border-dashed border-zinc-200 bg-zinc-50/50 py-6 text-center text-sm text-zinc-400">
                                Добави упражнения от каталога вдясно
                              </div>
                            )}
                          </div>
                        </SortableContext>
                      </DndContext>

                      {block.phase === "main" && (
                        <div className="border-t bg-zinc-50 p-2 text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full border-amber-200 text-xs text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                            onClick={() => {
                              setStationPhase(block.phase);
                              setStationRotations([]);
                              setShowStationModal(true);
                            }}
                          >
                            + Създай Станционна Ротация
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* RIGHT: Library */}
              <div className="flex min-h-125 w-full flex-shrink-0 flex-col gap-4 overflow-hidden border-t border-zinc-200 bg-white p-4 lg:w-100 lg:border-t-0 lg:border-l">
                <h3 className="text-sm font-bold text-zinc-800">
                  Каталог Упражнения
                </h3>
                <div className="relative">
                  <Search className="absolute top-2.5 left-2 size-4 text-zinc-400" />
                  <Input
                    placeholder="Търси..."
                    className="h-9 bg-zinc-50 pl-8 text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div>
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        Всички категории ({getCategoryCount("all")})
                      </SelectItem>
                      <SelectItem value="warmup">
                        Загрявка ({getCategoryCount("warmup")})
                      </SelectItem>
                      <SelectItem value="technique">
                        Техника ({getCategoryCount("technique")})
                      </SelectItem>
                      <SelectItem value="tactics">
                        Тактика ({getCategoryCount("tactics")})
                      </SelectItem>
                      <SelectItem value="physical">
                        Физически ({getCategoryCount("physical")})
                      </SelectItem>
                      <SelectItem value="games">
                        Игри и Забава ({getCategoryCount("games")})
                      </SelectItem>
                      <SelectItem value="cooldown">
                        Разпускане ({getCategoryCount("cooldown")})
                      </SelectItem>
                      <SelectItem value="beach">
                        Плажни Блокове (Лагер) ({getCategoryCount("beach")})
                      </SelectItem>
                      <SelectItem value="circuit">
                        Станционни Ротации (Лагер) (
                        {getCategoryCount("circuit")})
                      </SelectItem>
                      <SelectItem value="tactical">
                        Мулти-Шатъл (Лагер) ({getCategoryCount("tactical")})
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto pr-1 pb-4">
                  {isFetching ? (
                    <div className="flex justify-center p-4">
                      <Loader2 className="size-6 animate-spin text-indigo-600" />
                    </div>
                  ) : (
                    <>
                      {filteredExercises.map((ex) => (
                        <div
                          key={ex.id}
                          className="group rounded-lg border border-zinc-200 bg-zinc-50 p-2 transition-colors hover:border-indigo-300"
                        >
                          <div className="flex items-start justify-between">
                            <div className="w-full">
                              <h4 className="text-xs leading-tight font-semibold text-zinc-800">
                                {ex.name}
                              </h4>
                              <div className="mt-1 flex flex-wrap items-center gap-1">
                                <Badge
                                  variant="outline"
                                  className="bg-white px-1 text-[9px] text-zinc-500"
                                >
                                  {ex.durationMinutes} мин
                                </Badge>
                                <Badge
                                  variant="secondary"
                                  className="bg-white px-1 text-[9px]"
                                >
                                  {ex.category}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="mt-2 hidden flex-col gap-1 group-hover:flex">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 w-full justify-start px-2 text-[10px] text-zinc-600 hover:text-indigo-600"
                              onClick={() => addExerciseToBlock("warmup", ex)}
                            >
                              <Plus className="mr-1 size-3" /> В Загрявка
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 w-full justify-start px-2 text-[10px] text-zinc-600 hover:text-indigo-600"
                              onClick={() => addExerciseToBlock("main", ex)}
                            >
                              <Plus className="mr-1 size-3" /> В Основна част
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 w-full justify-start px-2 text-[10px] text-zinc-600 hover:text-indigo-600"
                              onClick={() => addExerciseToBlock("cooldown", ex)}
                            >
                              <Plus className="mr-1 size-3" /> В Разпускане
                            </Button>
                          </div>
                        </div>
                      ))}
                      {filteredExercises.length === 0 && (
                        <div className="py-4 text-center text-xs text-zinc-500">
                          Няма намерени упражнения
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Preview & Save */}
          {currentStep === 3 && (
            <div className="mx-auto w-full max-w-4xl flex-shrink-0 space-y-8 overflow-y-auto p-6">
              <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-bold text-zinc-800">
                  Бележки за треньора
                </h3>
                <Textarea
                  className="min-h-[150px] border-zinc-200 bg-zinc-50 text-sm"
                  placeholder="Въведете вашите бележки и фокус на тренировката тук..."
                  value={coachNotes}
                  onChange={(e) => setCoachNotes(e.target.value)}
                />
              </div>

              <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-bold text-zinc-800">
                  Преглед на графика
                </h3>
                <div className="space-y-4">
                  {blocks.map((b) => {
                    const currentTotal = b.items.reduce(
                      (s, i) => s + i.durationMinutes,
                      0
                    );
                    return (
                      <div
                        key={b.id}
                        className="border-l-4 border-indigo-500 py-2 pl-4"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="font-semibold text-zinc-800">
                            {getPhaseName(b.phase)}
                          </span>
                          <span className="text-sm font-bold text-indigo-600">
                            {currentTotal} мин
                          </span>
                        </div>
                        {b.items.length > 0 ? (
                          <ul className="space-y-1">
                            {b.items.map((item) => (
                              <li
                                key={item.id}
                                className="flex justify-between text-sm text-zinc-600"
                              >
                                <span>
                                  {item.type === "exercise"
                                    ? item.exercise?.name
                                    : "Станционна Ротация"}
                                </span>
                                <span className="text-xs">
                                  {item.durationMinutes} мин
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-sm text-zinc-400 italic">
                            Няма упражнения
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-shrink-0 items-center justify-between border-t border-zinc-200 bg-white p-4">
          <Button
            variant="outline"
            onClick={() => {
              if (currentStep > 1) {
                setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3);
              } else {
                onOpenChange(false);
              }
            }}
            disabled={isSaving}
          >
            {currentStep > 1 ? "Назад" : "Отказ"}
          </Button>

          {currentStep < 3 ? (
            <Button
              className="bg-indigo-600 px-8 text-white hover:bg-indigo-700"
              onClick={() => setCurrentStep((prev) => (prev + 1) as 1 | 2 | 3)}
            >
              Напред
            </Button>
          ) : (
            <Button
              className="bg-emerald-600 px-8 text-white hover:bg-emerald-700"
              onClick={handleSave}
              disabled={isSaving || !title}
            >
              {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}{" "}
              Запиши Тренировката
            </Button>
          )}
        </DialogFooter>
      </DialogContent>

      {/* Station Modal */}
      <Dialog open={showStationModal} onOpenChange={setShowStationModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Нова Станционна Ротация</DialogTitle>
            <DialogDescription>
              Изберете кои групи кое упражнение ще изпълняват. Те ще споделят
              общ таймер.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Общо време на станцията (мин)</Label>
              <Input
                type="number"
                value={stationDuration}
                onChange={(e) =>
                  setStationDuration(parseInt(e.target.value) || 10)
                }
              />
            </div>

            <div className="space-y-3 border-t pt-4">
              <Label>Разпределение</Label>
              {stationRotations.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-md bg-zinc-50 p-2"
                >
                  <Select
                    value={r.groupId}
                    onValueChange={(val) => {
                      const newArr = [...stationRotations];
                      newArr[i].groupId = val;
                      setStationRotations(newArr);
                    }}
                  >
                    <SelectTrigger className="h-8 w-[130px] text-xs">
                      <SelectValue placeholder="Група" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={r.exerciseId}
                    onValueChange={(val) => {
                      const newArr = [...stationRotations];
                      newArr[i].exerciseId = val;
                      setStationRotations(newArr);
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Избери упр..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allExercises.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-zinc-400 hover:text-red-500"
                    onClick={() =>
                      setStationRotations(
                        stationRotations.filter((_, idx) => idx !== i)
                      )
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}

              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() =>
                  setStationRotations([
                    ...stationRotations,
                    { groupId: groups[0]?.id || "", exerciseId: "" },
                  ])
                }
              >
                + Добави Участник в Станцията
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowStationModal(false)}
            >
              Отказ
            </Button>
            <Button
              onClick={saveStation}
              className="bg-amber-600 text-white hover:bg-amber-700"
              disabled={stationRotations.some(
                (r) => !r.groupId || !r.exerciseId
              )}
            >
              Запази Ротацията
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
