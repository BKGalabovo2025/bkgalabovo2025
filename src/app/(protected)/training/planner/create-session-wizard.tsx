"use client";

import { closestCenter, DndContext } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

import { CoachNotesCard } from "@/components/training/CoachNotesCard";
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
import { INITIAL_BWF_EXERCISES } from "@/lib/badminton-exercises";
import { cn } from "@/lib/utils";
import { inventoryService } from "@/services/inventory-service";
import { getAllMembers } from "@/services/member-service";
import { plannerService } from "@/services/planner-service";
import { quizService } from "@/services/quiz-service";
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
type SessionPhase = "warmup" | "main" | "cooldown";
type StationPhaseType = "warmup" | "main" | "cooldown";

const matchesCategoryFilter = (ex: Exercise, selectedCategory: string) => {
  if (selectedCategory === "all") return true;
  if (selectedCategory === "beach")
    return Boolean(ex.location?.includes("beach"));
  if (selectedCategory === "circuit")
    return ex.name.toLowerCase().includes("станция");
  if (selectedCategory === "tactical")
    return (
      ex.category === "tactics" || ex.name.toLowerCase().includes("мулти-шатъл")
    );
  if (selectedCategory === "quiz")
    return (
      Boolean(ex.category?.toLowerCase().includes("quiz")) ||
      ex.name.toLowerCase().includes("викторина") ||
      ex.name.toLowerCase().includes("тест") ||
      ex.name.toLowerCase().includes("правилник")
    );
  return ex.category === selectedCategory;
};

const getPhaseName = (phase: string) => {
  if (phase === "warmup") return "Загрявка";
  if (phase === "main") return "Основна част";
  return "Разпускане (Cooldown)";
};

const getCategoryCount = (allExercises: Exercise[], cat: string) => {
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
  if (cat === "quiz")
    return allExercises.filter(
      (ex) =>
        Boolean(ex.category?.toLowerCase().includes("quiz")) ||
        ex.name.toLowerCase().includes("викторина") ||
        ex.name.toLowerCase().includes("тест") ||
        ex.name.toLowerCase().includes("правилник")
    ).length;
  return allExercises.filter((ex) => ex.category === cat).length;
};

const computeTargetBlocks = (
  prev: SessionBlock[],
  totalDuration: number
): SessionBlock[] => {
  const isDedicatedQuiz = prev.some((b) =>
    b.items.some((i) => i.exercise?.category === "quiz")
  );

  if (isDedicatedQuiz) {
    return prev.map((b) => {
      if (b.phase === "main") {
        const quizMins = b.items.reduce((acc, i) => acc + i.durationMinutes, 0);
        return { ...b, targetDuration: quizMins || totalDuration };
      }
      return { ...b, targetDuration: 0 };
    });
  }

  const warmupTarget = Math.round(totalDuration * 0.1);
  const cooldownTarget = Math.round(totalDuration * 0.1);
  const mainTarget = totalDuration - warmupTarget - cooldownTarget;

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
  return prev.map((b) => {
    if (b.phase === "warmup") return { ...b, targetDuration: warmupTarget };
    if (b.phase === "main") return { ...b, targetDuration: mainTarget };
    if (b.phase === "cooldown") return { ...b, targetDuration: cooldownTarget };
    return b;
  });
};

const applyHydrationBreaks = (blocks: SessionBlock[]): SessionBlock[] => {
  return blocks.map((block) => {
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
        cumulative = 0;
      }
    });
    return { ...block, items: newItems };
  });
};

const applyRainyDay = (blocks: SessionBlock[]): SessionBlock[] => {
  return blocks.map((block) => ({
    ...block,
    items: block.items.map((item) => {
      if (
        item.type === "exercise" &&
        item.exercise &&
        item.exercise.location &&
        !item.exercise.location.includes("court") &&
        (item.exercise.location.includes("beach") ||
          item.exercise.location.includes("stadium"))
      ) {
        return {
          ...item,
          exercise: {
            ...item.exercise,
            name: "🌧️ (Резерва) Вътрешна ОФП / Мобилност",
            location: ["court"],
          },
        };
      }
      return item;
    }),
  }));
};

const extractBlocksFromSession = (session: PlannerSession): SessionBlock[] => {
  if (session.blocks && session.blocks.length > 0) {
    return session.blocks.map((b) => ({
      ...b,
      items: b.items.map((item) => ({
        ...item,
        exercise: item.exercise ? { ...item.exercise } : undefined,
      })),
    }));
  }
  if (session.groupedExercises && session.groupedExercises.length > 0) {
    return ["warmup", "main", "cooldown"].map((phase) => ({
      id: phase,
      phase: phase as SessionPhase,
      targetDuration: 0,
      items:
        session.groupedExercises
          ?.find((g) => g.ageGroup === "all")
          ?.exercises.map((ex) => ({
            id: uuidv4(),
            type: "exercise",
            durationMinutes: ex.durationMinutes || 5,
            exercise: ex,
            targetGroupId: undefined,
          })) || [],
    }));
  }
  return [];
};

const fetchAvailableParticipants = async (
  initialCampId?: string
): Promise<{ id: string; name: string }[]> => {
  if (initialCampId) {
    const campEvent = await getEventById(initialCampId);
    if (campEvent?.attendees) {
      return campEvent.attendees.map((a) => ({
        id: a.memberId,
        name: a.name,
      }));
    }
    return [];
  }
  const allMembers = await getAllMembers();
  return allMembers
    .filter((m) => m.status === "active")
    .map((m) => ({
      id: m.id,
      name: `${m.firstName} ${m.lastName}`,
    }));
};

const mapTemplateToBlocks = (
  tmplBlocks: {
    phase: string;
    durationMinutes: number;
    exercises: { exerciseId: string; durationMinutes: number }[];
  }[],
  allExercises: Exercise[]
): SessionBlock[] => {
  return tmplBlocks.map((tb) => {
    const items: SessionBlockItem[] = tb.exercises.map((te) => {
      const resolvedExercise = allExercises.find((e) => e.id === te.exerciseId);
      return {
        id: uuidv4(),
        type: "exercise",
        durationMinutes: te.durationMinutes,
        exercise: resolvedExercise,
        targetGroupId: undefined,
      };
    });
    return {
      id: tb.phase,
      phase: tb.phase as SessionPhase,
      targetDuration: tb.durationMinutes,
      items,
    };
  });
};

const buildSessionPayload = (params: {
  date: string;
  startTime: string;
  endTime: string;
  mode: TrainingMode;
  location: LocationType;
  customLocation: string;
  title: string;
  coachNotes: string;
  campId?: string;
  blocks: SessionBlock[];
  totalKids: number;
  isAllGroupMode: boolean;
  availableParticipants: { id: string; name: string }[];
  groups: { id: string; name: string; memberIds: string[] }[];
}): Omit<PlannerSession, "id" | "siteId" | "createdAt" | "updatedAt"> => {
  const resolvedLocation: LocationType =
    params.location === "other" && params.customLocation.trim()
      ? (params.customLocation.trim() as LocationType)
      : params.location;

  const resolvedGroups = params.isAllGroupMode
    ? [
        {
          id: "all",
          name: "Всички",
          memberIds: params.availableParticipants.map((p) => p.id),
        },
      ]
    : params.groups;

  return {
    date: params.date,
    startTime: params.startTime,
    endTime: params.endTime,
    mode: params.mode,
    location: resolvedLocation,
    title: params.title,
    coachNotes: params.coachNotes,
    status: "planned",
    campId: params.campId,
    blocks: params.blocks,
    totalKids: params.totalKids,
    targetGroups: resolvedGroups.map((g) => g.name),
    sessionGroups: resolvedGroups,
  };
};

const resolvePrefillGroups = (session?: PlannerSession) => {
  if (!session) {
    return [
      { id: "group-a", name: "Група А", memberIds: [] },
      { id: "group-b", name: "Група Б", memberIds: [] },
    ];
  }
  if (session.sessionGroups && session.sessionGroups.length > 0) {
    return session.sessionGroups.map((g) => ({
      id: g.id || uuidv4(),
      name: g.name,
      memberIds: g.memberIds || [],
    }));
  }
  if (session.targetGroups && session.targetGroups.length > 0) {
    return session.targetGroups.map((name, idx) => ({
      id: `group-${idx}`,
      name,
      memberIds: [],
    }));
  }
  if (session.groupedExercises && session.groupedExercises.length > 0) {
    return session.groupedExercises.map((ge, idx) => ({
      id: `group-${idx}`,
      name: ge.ageGroup || `Група ${idx + 1}`,
      memberIds: [],
    }));
  }
  return [
    { id: "group-a", name: "Група А", memberIds: [] },
    { id: "group-b", name: "Група Б", memberIds: [] },
  ];
};

const buildPrefillState = (
  session: PlannerSession,
  initialDate?: string,
  initialCampId?: string
) => {
  if (session) {
    const isStandardLoc =
      session.location === "court" ||
      session.location === "stadium" ||
      session.location === "beach";
    const isAll =
      session.sessionGroups?.length === 1 &&
      session.sessionGroups[0].name === "Всички";
    return {
      title: session.title,
      date: session.date,
      startTime: session.startTime || "09:00",
      endTime: session.endTime || "10:30",
      mode: session.mode,
      location: isStandardLoc
        ? (session.location as LocationType)
        : ("other" as LocationType),
      customLocation: isStandardLoc ? "" : session.location || "",
      isAllGroupMode: isAll,
      totalDuration:
        session.blocks?.reduce((acc, b) => acc + b.targetDuration, 0) || 60,
      coachNotes: session.coachNotes || "",
      groups: resolvePrefillGroups(session),
      blocks: extractBlocksFromSession(session),
    };
  }
  return {
    title: "",
    date: initialDate || new Date().toISOString().slice(0, 10),
    startTime: "09:00",
    endTime: "10:30",
    mode: initialCampId ? ("camp" as TrainingMode) : ("season" as TrainingMode),
    location: initialCampId
      ? ("stadium" as LocationType)
      : ("court" as LocationType),
    customLocation: "",
    isAllGroupMode: false,
    totalDuration: 90,
    coachNotes: "",
    groups: resolvePrefillGroups(),
    blocks: [],
  };
};

const appendExerciseToBlocks = (
  blocks: SessionBlock[],
  phase: StationPhaseType,
  exercise: Exercise,
  firstGroupId?: string
): SessionBlock[] => {
  return blocks.map((block) => {
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
            targetGroupId: firstGroupId,
          },
        ],
      };
    }
    return block;
  });
};

const removeItemFromBlocks = (
  blocks: SessionBlock[],
  phase: StationPhaseType,
  itemId: string
): SessionBlock[] => {
  return blocks.map((block) => {
    if (block.phase === phase) {
      return {
        ...block,
        items: block.items.filter((item) => item.id !== itemId),
      };
    }
    return block;
  });
};

const updateDurationInBlocks = (
  blocks: SessionBlock[],
  phase: StationPhaseType,
  itemId: string,
  newDuration: number
): SessionBlock[] => {
  return blocks.map((block) => {
    if (block.phase === phase) {
      return {
        ...block,
        items: block.items.map((item) =>
          item.id === itemId ? { ...item, durationMinutes: newDuration } : item
        ),
      };
    }
    return block;
  });
};

const updateTargetGroupInBlocks = (
  blocks: SessionBlock[],
  phase: StationPhaseType,
  itemId: string,
  groupId: string
): SessionBlock[] => {
  return blocks.map((block) => {
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
  });
};

const toggleMemberInGroupList = (
  groups: { id: string; name: string; memberIds: string[] }[],
  groupId: string,
  participantId: string
) => {
  return groups.map((g) => {
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
  });
};

interface ExerciseItemCardProps {
  exercise: Exercise;
  selectedCategory: string;
  onAddToBlock: (phase: StationPhaseType, exercise: Exercise) => void;
}

const ExerciseItemCard = ({
  exercise,
  selectedCategory,
  onAddToBlock,
}: ExerciseItemCardProps) => {
  return (
    <div className="group rounded-lg border border-zinc-200 bg-zinc-50 p-2 transition-colors hover:border-indigo-300">
      <div className="flex items-start justify-between">
        <div className="w-full">
          <h4 className="text-xs leading-tight font-semibold text-zinc-800">
            {exercise.name}
          </h4>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <Badge
              variant="outline"
              className="bg-white px-1 text-[9px] text-zinc-500"
            >
              {exercise.durationMinutes} мин
            </Badge>
            <Badge variant="secondary" className="bg-white px-1 text-[9px]">
              {exercise.category}
            </Badge>
          </div>
        </div>
      </div>
      {selectedCategory === "quiz" ? (
        <div className="mt-2">
          <Button
            size="sm"
            className="h-8 w-full bg-indigo-600 px-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 active:scale-98"
            onClick={() => onAddToBlock("main", exercise)}
          >
            <Plus className="mr-1 size-3.5" /> + Добави във викторина
          </Button>
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            className="flex items-center gap-1 rounded-md border border-orange-200 bg-orange-50 px-2 py-1 text-[11px] font-bold text-orange-700 transition-transform hover:bg-orange-100 active:scale-95 dark:border-orange-900/40 dark:bg-orange-950/40 dark:text-orange-300"
            onClick={() => onAddToBlock("warmup", exercise)}
          >
            <Plus className="size-3" /> Загрявка
          </button>
          <button
            type="button"
            className="flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 text-[11px] font-bold text-indigo-700 transition-transform hover:bg-indigo-100 active:scale-95 dark:border-indigo-900/40 dark:bg-indigo-950/40 dark:text-indigo-300"
            onClick={() => onAddToBlock("main", exercise)}
          >
            <Plus className="size-3" /> Основна
          </button>
          <button
            type="button"
            className="flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 transition-transform hover:bg-emerald-100 active:scale-95 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300"
            onClick={() => onAddToBlock("cooldown", exercise)}
          >
            <Plus className="size-3" /> Разпускане
          </button>
        </div>
      )}
    </div>
  );
};

interface SessionBlockItemCardProps {
  item: SessionBlockItem;
  phase: StationPhaseType;
  groups: { id: string; name: string }[];
  globalInventory: InventoryItem[];
  sessionInventory: Record<string, number>;
  kidsPerStation: number;
  onRemove: (phase: StationPhaseType, itemId: string) => void;
  onUpdateDuration: (
    phase: StationPhaseType,
    itemId: string,
    newDuration: number
  ) => void;
  onUpdateTargetGroup: (
    phase: StationPhaseType,
    itemId: string,
    groupId: string
  ) => void;
}

const SessionBlockItemCard = ({
  item,
  phase,
  groups,
  globalInventory,
  sessionInventory,
  kidsPerStation,
  onRemove,
  onUpdateDuration,
  onUpdateTargetGroup,
}: SessionBlockItemCardProps) => {
  return (
    <div
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
          onClick={() => onRemove(phase, item.id)}
          className="absolute top-2 right-2 size-6 text-zinc-400 hover:text-red-500"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      {item.type === "station" && (
        <div className="mb-2 space-y-1 rounded border border-amber-100 bg-white/50 p-2 text-xs text-zinc-600">
          {item.rotations?.map((r, i) => {
            const g =
              groups.find((grp) => grp.id === r.groupId)?.name || "Група";
            const shortages = calculateStationShortages(
              r.exercise?.equipment,
              globalInventory,
              sessionInventory,
              kidsPerStation
            );

            return (
              <div key={i} className="mb-2 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-amber-200 bg-white text-[10px] text-amber-700"
                  >
                    {g}
                  </Badge>
                  <span className="font-semibold">{r.exercise?.name}</span>
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
      )}

      <div className="mt-2 flex items-center gap-1 rounded bg-zinc-900/5 px-2 py-1">
        <Input
          type="number"
          className="h-7 w-16 bg-white text-xs"
          value={item.durationMinutes}
          onChange={(e) =>
            onUpdateDuration(phase, item.id, parseInt(e.target.value) || 0)
          }
        />
        <span className="text-xs text-zinc-500">мин</span>

        {item.type === "exercise" && (
          <Select
            value={item.targetGroupId || "none"}
            onValueChange={(v) => onUpdateTargetGroup(phase, item.id, v)}
          >
            <SelectTrigger className="ml-2 h-7 w-30 bg-white text-xs">
              <SelectValue placeholder="За всички" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">За всички групи</SelectItem>
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
  );
};

interface InventorySelectionSectionProps {
  isFetching: boolean;
  globalInventory: InventoryItem[];
  sessionInventory: Record<string, number>;
  setSessionInventory: React.Dispatch<
    React.SetStateAction<Record<string, number>>
  >;
}

const InventorySelectionSection = ({
  isFetching,
  globalInventory,
  sessionInventory,
  setSessionInventory,
}: InventorySelectionSectionProps) => {
  const handleSelectAll = () => {
    const allInv: Record<string, number> = {};
    globalInventory.forEach((item) => {
      allInv[item.id] = item.totalQuantity;
    });
    setSessionInventory(allInv);
  };

  const handleClearAll = () => {
    setSessionInventory({});
  };

  if (isFetching) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (globalInventory.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-200 p-6 text-center text-xs text-zinc-500">
        Няма въведено оборудване в модул Инвентар за този клон. Тренировката ще
        използва стандартните клубни уреди.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3">
        <div className="text-xs text-zinc-500">
          Избрани:{" "}
          <span className="font-bold text-indigo-600">
            {Object.keys(sessionInventory).length}
          </span>{" "}
          от {globalInventory.length} уреда
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            className="h-7 border-indigo-200 bg-indigo-50/50 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
          >
            ✓ Маркирай всичко ({globalInventory.length} бр.)
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="h-7 text-xs text-zinc-500 hover:text-zinc-800"
          >
            Размаркирай всичко
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {globalInventory.map((item) => {
          const isSelected = sessionInventory[item.id] !== undefined;
          const currentQty = sessionInventory[item.id] || item.totalQuantity;
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
                        next[item.id] = item.totalQuantity;
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
    </div>
  );
};

interface DedicatedQuizModuleProps {
  blocks: SessionBlock[];
  totalDuration: number;
  onRemoveItem: (phase: StationPhaseType, itemId: string) => void;
}

const DedicatedQuizModule = ({
  blocks,
  totalDuration,
  onRemoveItem,
}: DedicatedQuizModuleProps) => {
  const allItems = blocks.flatMap((b) => b.items);
  const totalQuizMinutes = allItems.reduce(
    (acc, i) => acc + i.durationMinutes,
    0
  );

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-indigo-200 bg-linear-to-r from-indigo-50 to-blue-50 p-5 shadow-xs dark:border-indigo-900/50 dark:from-indigo-950/40 dark:to-blue-950/20">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-600 text-xl text-white shadow-md">
            🧠
          </div>
          <div>
            <h3 className="text-base font-black text-indigo-950 dark:text-white">
              Теоретичен модул & Викторина
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              В режим Викторина тренировъчните фази
              (Загрявка/Основна/Разпускане) са скрити. Изберете теоретични
              тестове и викторини от каталога вдясно.
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b bg-zinc-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-950">
          <span className="font-bold text-zinc-900 dark:text-white">
            Включени викторини и въпросници ({allItems.length})
          </span>
          <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
            Общо: {totalQuizMinutes} мин от {totalDuration} мин
          </span>
        </div>

        <div className="min-h-32 space-y-3 p-4">
          {allItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <span className="text-3xl">📝</span>
              <p className="mt-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Няма предварително зададени викторини
              </p>
              <p className="mx-auto mt-1 max-w-md text-xs text-zinc-500">
                Можете да изберете конкретни тестове от каталога вдясно или да
                оставите списъка празен — така треньорът ще подбере подходящ
                тест за всеки участник на място.
              </p>
            </div>
          ) : (
            blocks.map((block) =>
              block.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between rounded-xl border border-indigo-100 bg-indigo-50/40 p-3.5 transition-all dark:border-indigo-900/40 dark:bg-indigo-950/30"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-indigo-600 text-white">
                        {item.durationMinutes} мин
                      </Badge>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                        {item.exercise?.name}
                      </h4>
                    </div>
                    {item.exercise?.description && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        {item.exercise.description}
                      </p>
                    )}
                    {item.exercise?.coachingPoints &&
                      item.exercise.coachingPoints.length > 0 && (
                        <div className="mt-2 text-[11px] text-zinc-500">
                          <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                            Насоки за дискусия:
                          </span>{" "}
                          {item.exercise.coachingPoints.join(" · ")}
                        </div>
                      )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveItem(block.phase, item.id)}
                    className="size-7 text-zinc-400 hover:text-red-500"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
};

interface GroupsManagementSectionProps {
  isAllGroupMode: boolean;
  setIsAllGroupMode: (val: boolean) => void;
  groups: { id: string; name: string; memberIds: string[] }[];
  setGroups: React.Dispatch<
    React.SetStateAction<{ id: string; name: string; memberIds: string[] }[]>
  >;
  availableParticipants: { id: string; name: string }[];
  newGroupName: string;
  setNewGroupName: (val: string) => void;
  onAddGroup: () => void;
  onRemoveGroup: (id: string) => void;
  onToggleParticipant: (groupId: string, participantId: string) => void;
}

const GroupsManagementSection = ({
  isAllGroupMode,
  setIsAllGroupMode,
  groups,
  setGroups,
  availableParticipants,
  newGroupName,
  setNewGroupName,
  onAddGroup,
  onRemoveGroup,
  onToggleParticipant,
}: GroupsManagementSectionProps) => {
  return (
    <div>
      <div className="flex items-center justify-between">
        <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
          Управление на групи
        </Label>
        <button
          type="button"
          onClick={() => {
            const nextMode = !isAllGroupMode;
            setIsAllGroupMode(nextMode);
            if (nextMode) {
              setGroups([
                {
                  id: "all",
                  name: "Всички",
                  memberIds: availableParticipants.map((p) => p.id),
                },
              ]);
            } else {
              setGroups([
                { id: uuidv4(), name: "Група А", memberIds: [] },
                { id: uuidv4(), name: "Група Б", memberIds: [] },
              ]);
            }
          }}
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-bold transition-all",
            isAllGroupMode
              ? "bg-indigo-600 text-white shadow-xs"
              : "border border-zinc-300 bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          )}
        >
          {isAllGroupMode
            ? "✓ Всички заедно (Обща група)"
            : "👥 Раздели по отделни групи"}
        </button>
      </div>

      {isAllGroupMode ? (
        <div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 text-center dark:border-indigo-900/50 dark:bg-indigo-950/20">
          <div className="mx-auto flex size-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
            <Users className="size-5" />
          </div>
          <h4 className="mt-2 text-sm font-bold text-indigo-950 dark:text-white">
            Всички състезатели тренират заедно ({availableParticipants.length}{" "}
            деца)
          </h4>
          <p className="mt-1 text-xs text-zinc-500">
            Не е необходимо индивидуално разпределение по подгрупи. Всички
            упражнения се изпълняват едновременно.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-2 space-y-2">
            {groups.map((g) => (
              <div
                key={g.id}
                className="flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-center gap-2">
                  <Input
                    value={g.name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      setGroups((prev) =>
                        prev.map((group) =>
                          group.id === g.id
                            ? { ...group, name: newName }
                            : group
                        )
                      );
                    }}
                    className="h-7 w-32 border-transparent bg-transparent px-2 text-sm font-semibold transition-colors hover:border-zinc-300 focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-950"
                  />
                  <Badge variant="outline" className="text-[10px]">
                    {g.memberIds.length} деца
                  </Badge>
                </div>
                {groups.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveGroup(g.id)}
                    className="size-6 p-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                placeholder="Нова група (напр. Група В)"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="h-8 text-sm"
              />
              <Button size="sm" className="h-8" onClick={onAddGroup}>
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Разпределение на участници ({availableParticipants.length} общо)
              </h4>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-7 bg-indigo-50 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300"
                  onClick={() => {
                    setGroups((prev) =>
                      distributeParticipantsEqually(prev, availableParticipants)
                    );
                  }}
                >
                  ⚡ Разпредели по равно ({groups.map((g) => g.name).join("/")})
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-white"
                  onClick={() => {
                    setGroups(groups.map((g) => ({ ...g, memberIds: [] })));
                  }}
                >
                  Изчисти
                </Button>
              </div>
            </div>
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-800 dark:bg-zinc-900/60">
              {availableParticipants.length === 0 && (
                <p className="p-2 text-xs text-zinc-500">
                  Няма намерени участници.
                </p>
              )}
              {availableParticipants.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col justify-between rounded-md border border-zinc-100 bg-white p-2 shadow-xs sm:flex-row sm:items-center dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <span className="text-sm font-medium">{p.name}</span>
                  <div className="mt-2 flex flex-wrap gap-4 sm:mt-0">
                    {groups.map((g) => (
                      <label
                        key={g.id}
                        className="flex cursor-pointer items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                      >
                        <input
                          type="checkbox"
                          checked={g.memberIds.includes(p.id)}
                          onChange={() => onToggleParticipant(g.id, p.id)}
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
        </>
      )}
    </div>
  );
};

const calculateEndTimeFromStart = (
  startTime: string,
  durationMinutes: number
): string => {
  if (!startTime) return "10:30";
  const [sh = "9", sm = "0"] = startTime.split(":");
  const totalMinutes =
    parseInt(sh, 10) * 60 + parseInt(sm, 10) + durationMinutes;
  const endH = Math.floor(totalMinutes / 60) % 24;
  const endM = totalMinutes % 60;
  return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
};

const distributeParticipantsEqually = (
  groups: { id: string; name: string; memberIds: string[] }[],
  availableParticipants: { id: string; name: string }[]
) => {
  if (groups.length === 0 || availableParticipants.length === 0) return groups;
  const numGroups = groups.length;
  const groupSize = Math.ceil(availableParticipants.length / numGroups);
  return groups.map((g, i) => {
    const slice = availableParticipants.slice(
      i * groupSize,
      (i + 1) * groupSize
    );
    return {
      ...g,
      memberIds: slice.map((p) => p.id),
    };
  });
};

const calculateStationShortages = (
  equipmentNames: string[] | undefined,
  globalInventory: InventoryItem[],
  sessionInventory: Record<string, number>,
  kidsPerStation: number
) => {
  const shortages: {
    name: string;
    missing: number;
    isTotallyMissing?: boolean;
  }[] = [];
  equipmentNames?.forEach((eqName) => {
    const globalItem = globalInventory.find(
      (inv) => inv.name.toLowerCase() === eqName.toLowerCase()
    );

    if (!globalItem || !sessionInventory[globalItem.id]) {
      shortages.push({
        name: eqName,
        missing: kidsPerStation,
        isTotallyMissing: true,
      });
      return;
    }

    let needed = 0;
    if (globalItem.allocationType === "per_child") {
      needed = kidsPerStation * (globalItem.ratioValue || 1);
    } else if (globalItem.allocationType === "per_station") {
      needed = globalItem.ratioValue || 1;
    } else if (globalItem.allocationType === "ratio") {
      needed = Math.ceil(kidsPerStation * (globalItem.ratioValue || 1));
    }

    const availableQty = sessionInventory[globalItem.id] || 0;
    if (needed > availableQty) {
      shortages.push({
        name: eqName,
        missing: needed - availableQty,
      });
    }
  });
  return shortages;
};

const buildStationBlockItem = (
  stationRotations: { groupId: string; exerciseId: string }[],
  allExercises: Exercise[],
  stationDuration: number
): SessionBlockItem | null => {
  if (stationRotations.length === 0) return null;
  const rotations = stationRotations
    .map((r) => {
      const ex = allExercises.find((e) => e.id === r.exerciseId);
      return {
        groupId: r.groupId,
        exercise: ex!,
      };
    })
    .filter((r) => r.exercise !== undefined);

  return {
    id: uuidv4(),
    type: "station",
    durationMinutes: stationDuration,
    rotations,
  };
};

const loadWizardResources = async (
  activeBranch: string,
  initialCampId?: string,
  initialImportTemplateId?: string
) => {
  const [ex, inv, branchQuizzes] = await Promise.all([
    plannerService.getExercises(activeBranch),
    inventoryService.getInventory(activeBranch),
    quizService.getQuizzes(activeBranch).catch(() => []),
  ]);

  // Map all real theory tests/quizzes into Exercise format
  const mappedQuizzes: Exercise[] = branchQuizzes.map((q, idx) => ({
    id: q.id || `quiz-${idx}`,
    name: q.title,
    category: "quiz",
    description:
      q.description || `${q.questions?.length || 0} въпроса според BWF`,
    durationMinutes: 15,
    coachingPoints: [
      `Въпроси: ${q.questions?.length || 0} бр.`,
      `Макс. точки: ${q.questions?.reduce((acc, qu) => acc + (qu.points || 0), 0) || 100} т.`,
    ],
    location: ["court", "stadium"],
    ageGroups: ["U9", "U11", "U13", "U15", "U17", "U19", "Мъже и Жени"],
    equipment: ["Мобилен телефон / Таблет / Тест"],
    intensity: 1,
    complexityLevel: 1,
    siteId: activeBranch,
    createdAt: q.createdAt || new Date().toISOString(),
    updatedAt: q.updatedAt || new Date().toISOString(),
  }));

  // Combine Firestore exercises with mapped quizzes
  const existingNames = new Set(ex.map((e) => e.name.toLowerCase()));
  const missingQuizzes = mappedQuizzes.filter(
    (q) => !existingNames.has(q.name.toLowerCase())
  );

  const finalExercises: Exercise[] = [
    ...(ex.length > 0
      ? ex
      : (INITIAL_BWF_EXERCISES.map((e, idx) => ({
          ...e,
          id: `seed-${idx}`,
          siteId: activeBranch,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })) as Exercise[])),
    ...missingQuizzes,
  ];

  const initialSessInv: Record<string, number> = {};
  inv.forEach((i) => {
    initialSessInv[i.id] = i.totalQuantity;
  });

  const participantsList = await fetchAvailableParticipants(initialCampId);

  let templateBlocks: SessionBlock[] | null = null;
  let templateName: string | null = null;
  let templateDuration: number | null = null;

  if (initialImportTemplateId) {
    const templates = await plannerService.getTrainingTemplates(activeBranch);
    const tmpl = templates.find((t) => t.id === initialImportTemplateId);
    if (tmpl) {
      templateName = tmpl.name;
      templateDuration = tmpl.totalDurationMinutes;
      templateBlocks = mapTemplateToBlocks(tmpl.blocks, finalExercises);
    }
  }

  return {
    finalExercises,
    globalInventory: inv,
    sessionInventory: initialSessInv,
    participantsList,
    templateName,
    templateDuration,
    templateBlocks,
  };
};

function SessionStep3ScheduleBlock({
  block,
  selectedCategory,
  totalDuration,
}: {
  block: SessionBlock;
  selectedCategory: string;
  totalDuration: number;
}) {
  let currentTotal = 0;
  if (block.items.length > 0) {
    currentTotal = block.items.reduce((s, i) => s + i.durationMinutes, 0);
  } else if (selectedCategory === "quiz") {
    currentTotal = totalDuration;
  }

  return (
    <div className="border-l-4 border-indigo-500 py-2 pl-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-semibold text-zinc-800">
          {getPhaseName(block.phase)}
        </span>
        <span className="text-sm font-bold text-indigo-600">
          {currentTotal} мин
        </span>
      </div>
      {block.items.length > 0 ? (
        <ul className="space-y-1">
          {block.items.map((item) => (
            <li
              key={item.id}
              className="flex justify-between text-sm text-zinc-600"
            >
              <span>
                {item.type === "exercise"
                  ? item.exercise?.name
                  : "Станционна Ротация"}
              </span>
              <span className="text-xs">{item.durationMinutes} мин</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-sm text-zinc-400 italic">
          {selectedCategory === "quiz"
            ? "Треньорът ще подбере тест на място"
            : "Няма упражнения"}
        </div>
      )}
    </div>
  );
}

function SessionStep3Summary({
  coachNotes,
  setCoachNotes,
  blocks,
  selectedCategory,
  totalDuration,
}: {
  coachNotes: string;
  setCoachNotes: (notes: string) => void;
  blocks: SessionBlock[];
  selectedCategory: string;
  totalDuration: number;
}) {
  const insertTemplate = (prefix: string) => {
    if (!coachNotes.trim()) {
      setCoachNotes(`${prefix} `);
    } else {
      setCoachNotes(`${coachNotes.trimEnd()}\n${prefix} `);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl flex-shrink-0 space-y-8 overflow-y-auto p-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
              Бележки за треньора
            </h3>
            <p className="text-xs text-zinc-500">
              Форматирани структурирани указания за тренировката и мобилните
              екрани
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => insertTemplate("🎯 Фокус:")}
              className="rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-900 hover:bg-amber-100 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-300"
            >
              + 🎯 Фокус
            </button>
            <button
              type="button"
              onClick={() => insertTemplate("⚡ Интензитет:")}
              className="rounded-md border border-orange-300 bg-orange-50 px-2 py-1 text-[11px] font-bold text-orange-900 hover:bg-orange-100 dark:border-orange-700/60 dark:bg-orange-950/40 dark:text-orange-300"
            >
              + ⚡ Интензитет
            </button>
            <button
              type="button"
              onClick={() => insertTemplate("👥 Задачи за групите:")}
              className="rounded-md border border-indigo-300 bg-indigo-50 px-2 py-1 text-[11px] font-bold text-indigo-900 hover:bg-indigo-100 dark:border-indigo-700/60 dark:bg-indigo-950/40 dark:text-indigo-300"
            >
              + 👥 Групи
            </button>
            <button
              type="button"
              onClick={() => insertTemplate("💧 Хидратация & Почивки:")}
              className="rounded-md border border-blue-300 bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-900 hover:bg-blue-100 dark:border-blue-700/60 dark:bg-blue-950/40 dark:text-blue-300"
            >
              + 💧 Хидратация
            </button>
            <button
              type="button"
              onClick={() => insertTemplate("⚠️ Важно:")}
              className="rounded-md border border-rose-300 bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-900 hover:bg-rose-100 dark:border-rose-700/60 dark:bg-rose-950/40 dark:text-rose-300"
            >
              + ⚠️ Важно
            </button>
          </div>
        </div>

        <Textarea
          placeholder="Напиши бележки, напр.:&#10;🎯 Фокус: Бързина и реакция на мрежата&#10;⚡ Интензитет: 80% пулс, серии по 45 сек&#10;👥 Задачи за групите: Група А - мулти-шатъл, Група Б - спаринг&#10;💧 Хидратация: 2 мин след всяка станция"
          value={coachNotes}
          onChange={(e) => setCoachNotes(e.target.value)}
          rows={4}
          className="font-mono text-xs sm:text-sm"
        />

        {coachNotes.trim() && (
          <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <div className="mb-2 text-[11px] font-bold tracking-wider text-zinc-500 uppercase">
              📱 Мобилен преглед на бележките:
            </div>
            <CoachNotesCard notes={coachNotes} />
          </div>
        )}
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-zinc-800">
          Преглед на графика
        </h3>
        <div className="space-y-4">
          {blocks
            .filter(
              (b) =>
                !(
                  selectedCategory === "quiz" &&
                  (b.phase === "warmup" || b.phase === "cooldown")
                )
            )
            .map((b) => (
              <SessionStep3ScheduleBlock
                key={b.id}
                block={b}
                selectedCategory={selectedCategory}
                totalDuration={totalDuration}
              />
            ))}
        </div>
      </div>
    </div>
  );
}

interface PhaseAccordionCardProps {
  block: SessionBlock;
  isExpanded: boolean;
  onToggleExpand: () => void;
  groups: { id: string; name: string; memberIds: string[] }[];
  globalInventory: InventoryItem[];
  sessionInventory: Record<string, number>;
  kidsPerStation: number;
  onRemoveItem: (phase: StationPhaseType, itemId: string) => void;
  onUpdateDuration: (
    phase: StationPhaseType,
    itemId: string,
    newDuration: number
  ) => void;
  onUpdateTargetGroup: (
    phase: StationPhaseType,
    itemId: string,
    groupId: string
  ) => void;
  onCreateStation: (phase: StationPhaseType) => void;
}

function PhaseAccordionCard({
  block,
  isExpanded,
  onToggleExpand,
  groups,
  globalInventory,
  sessionInventory,
  kidsPerStation,
  onRemoveItem,
  onUpdateDuration,
  onUpdateTargetGroup,
  onCreateStation,
}: PhaseAccordionCardProps) {
  const currentTotal = block.items.reduce(
    (sum, item) => sum + item.durationMinutes,
    0
  );
  const remaining = block.targetDuration - currentTotal;
  const isOver = remaining < 0;

  return (
    <div
      id={`phase-block-${block.id}`}
      className={cn(
        "scroll-mt-16 overflow-hidden rounded-xl border shadow-xs transition-all",
        isExpanded
          ? "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900"
          : "border-zinc-200 bg-zinc-50/80 hover:border-zinc-300 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/50"
      )}
    >
      {/* Clickable Header */}
      <div
        onClick={onToggleExpand}
        className="flex cursor-pointer items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-100/90 p-3.5 transition-colors select-none hover:bg-zinc-200/70 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white shadow-xs dark:bg-zinc-800">
            {isExpanded ? (
              <ChevronDown className="size-4 text-zinc-600 dark:text-zinc-300" />
            ) : (
              <ChevronUp className="size-4 rotate-90 text-zinc-400" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
              {block.phase === "warmup" && "🔥 "}
              {block.phase === "main" && "🏸 "}
              {block.phase !== "warmup" && block.phase !== "main" && "🧘 "}
              {getPhaseName(block.phase)}
            </h3>
            <span className="rounded-full bg-zinc-200/80 px-2 py-0.5 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {block.items.length} упр. ({currentTotal} мин)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-bold shadow-xs",
              isOver
                ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
            )}
          >
            {isOver
              ? `+${Math.abs(remaining)} мин (Бюджет: ${block.targetDuration})`
              : `Остават ${remaining} мин от ${block.targetDuration}`}
          </div>

          <button
            type="button"
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-200/60 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <span>{isExpanded ? "Свий" : "Разгъни"}</span>
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <div>
          <DndContext collisionDetection={closestCenter}>
            <SortableContext
              items={block.items.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="max-h-96 min-h-25 scrollbar-thin space-y-3 overflow-y-auto p-3 pr-2">
                {block.items.map((item) => (
                  <SessionBlockItemCard
                    key={item.id}
                    item={item}
                    phase={block.phase}
                    groups={groups}
                    globalInventory={globalInventory}
                    sessionInventory={sessionInventory}
                    kidsPerStation={kidsPerStation}
                    onRemove={onRemoveItem}
                    onUpdateDuration={onUpdateDuration}
                    onUpdateTargetGroup={onUpdateTargetGroup}
                  />
                ))}

                {block.items.length === 0 && (
                  <div className="rounded-lg border-2 border-dashed border-zinc-200 bg-zinc-50/50 py-6 text-center text-sm text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-500">
                    Добави упражнения от каталога вдясно
                  </div>
                )}
              </div>
            </SortableContext>
          </DndContext>

          {block.phase === "main" && (
            <div className="border-t bg-zinc-50 p-2 text-center dark:border-zinc-800 dark:bg-zinc-950">
              <Button
                variant="outline"
                size="sm"
                className="w-full border-amber-200 text-xs text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:border-amber-900/40 dark:text-amber-400"
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateStation(block.phase);
                }}
              >
                + Създай Станционна Ротация
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface SessionStep1SettingsProps {
  title: string;
  setTitle: (val: string) => void;
  date: string;
  setDate: (val: string) => void;
  location: LocationType;
  setLocation: (val: LocationType) => void;
  customLocation: string;
  setCustomLocation: (val: string) => void;
  startTime: string;
  setStartTime: (val: string) => void;
  endTime: string;
  setEndTime: (val: string) => void;
  totalDuration: number;
  setTotalDuration: (val: number) => void;
  isAllGroupMode: boolean;
  setIsAllGroupMode: (val: boolean) => void;
  groups: { id: string; name: string; memberIds: string[] }[];
  setGroups: React.Dispatch<
    React.SetStateAction<{ id: string; name: string; memberIds: string[] }[]>
  >;
  availableParticipants: { id: string; name: string }[];
  newGroupName: string;
  setNewGroupName: (val: string) => void;
  onAddGroup: () => void;
  onRemoveGroup: (id: string) => void;
  onToggleParticipant: (groupId: string, participantId: string) => void;
  isFetching: boolean;
  globalInventory: InventoryItem[];
  sessionInventory: Record<string, number>;
  setSessionInventory: React.Dispatch<
    React.SetStateAction<Record<string, number>>
  >;
}

function SessionStep1Settings({
  title,
  setTitle,
  date,
  setDate,
  location,
  setLocation,
  customLocation,
  setCustomLocation,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  totalDuration,
  setTotalDuration,
  isAllGroupMode,
  setIsAllGroupMode,
  groups,
  setGroups,
  availableParticipants,
  newGroupName,
  setNewGroupName,
  onAddGroup,
  onRemoveGroup,
  onToggleParticipant,
  isFetching,
  globalInventory,
  sessionInventory,
  setSessionInventory,
}: SessionStep1SettingsProps) {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-3 pb-12 sm:p-6">
      {/* Basic Settings */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-4 text-base font-bold text-zinc-800 sm:text-lg dark:text-zinc-100">
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
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <Label className="text-xs text-zinc-500">Дата</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs text-zinc-500">Локация</Label>
                <Select
                  value={location}
                  onValueChange={(val) => setLocation(val as LocationType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="court">В зала (Корт)</SelectItem>
                    <SelectItem value="stadium">Стадион</SelectItem>
                    <SelectItem value="beach">Плаж</SelectItem>
                    <SelectItem value="other">
                      ✍️ Друго (попълни ръчно)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {location === "other" && (
              <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-2.5 dark:border-indigo-900/50 dark:bg-indigo-950/30">
                <Label className="text-xs font-semibold text-indigo-900 dark:text-indigo-300">
                  Име / адрес на локацията (ръчно):
                </Label>
                <Input
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  placeholder="Напр. Парк, Фитнес зала, Басейн, Спортен комплекс..."
                  className="mt-1 bg-white text-xs dark:bg-zinc-900"
                />
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs text-zinc-500">Начален час</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => {
                    const newStart = e.target.value;
                    setStartTime(newStart);
                    setEndTime(
                      calculateEndTimeFromStart(newStart, totalDuration)
                    );
                  }}
                />
              </div>
              <div>
                <Label className="text-xs text-zinc-500">Краен час</Label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs text-zinc-500">Време (мин)</Label>
                <Input
                  type="number"
                  min={10}
                  max={240}
                  value={totalDuration}
                  onChange={(e) => {
                    const dur = parseInt(e.target.value) || 60;
                    setTotalDuration(dur);
                    if (startTime) {
                      const [sh = "9", sm = "0"] = startTime.split(":");
                      const totalMinutes =
                        parseInt(sh, 10) * 60 + parseInt(sm, 10) + dur;
                      const endH = Math.floor(totalMinutes / 60) % 24;
                      const endM = totalMinutes % 60;
                      setEndTime(
                        `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`
                      );
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <GroupsManagementSection
            isAllGroupMode={isAllGroupMode}
            setIsAllGroupMode={setIsAllGroupMode}
            groups={groups}
            setGroups={setGroups}
            availableParticipants={availableParticipants}
            newGroupName={newGroupName}
            setNewGroupName={setNewGroupName}
            onAddGroup={onAddGroup}
            onRemoveGroup={onRemoveGroup}
            onToggleParticipant={onToggleParticipant}
          />
        </div>
      </div>

      {/* Local Inventory Selection */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-zinc-800 sm:text-lg dark:text-zinc-100">
              Налично оборудване за тренировката
            </h3>
            <p className="text-xs text-zinc-500">
              Изберете кои уреди взимате и в каква бройка. Планировчикът ще
              следи само тях!
            </p>
          </div>
        </div>

        <InventorySelectionSection
          isFetching={isFetching}
          globalInventory={globalInventory}
          sessionInventory={sessionInventory}
          setSessionInventory={setSessionInventory}
        />
      </div>
    </div>
  );
}

interface SessionStep2ToolbarProps {
  blocks: SessionBlock[];
  activePhaseTab: StationPhaseType | "all";
  setActivePhaseTab: (phase: StationPhaseType | "all") => void;
  onExpandPhase: (phase: StationPhaseType) => void;
  onSetAllPhasesExpanded: (expanded: boolean) => void;
  onInjectHydration: () => void;
  onToggleRainyDay: () => void;
  isRainyDay: boolean;
}

function SessionStep2Toolbar({
  blocks,
  activePhaseTab,
  setActivePhaseTab,
  onExpandPhase,
  onSetAllPhasesExpanded,
  onInjectHydration,
  onToggleRainyDay,
  isRainyDay,
}: SessionStep2ToolbarProps) {
  return (
    <div className="sticky top-0 z-20 mb-2 flex flex-col gap-2 rounded-xl border border-zinc-200/90 bg-white/95 p-3 shadow-md backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Phase Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActivePhaseTab("all")}
            className={cn(
              "flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all",
              activePhaseTab === "all"
                ? "bg-zinc-900 text-white shadow-xs dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
            )}
          >
            📋 Всички части
          </button>

          {blocks.map((b) => {
            const phaseTotal = b.items.reduce(
              (sum, item) => sum + item.durationMinutes,
              0
            );
            const isSelected = activePhaseTab === b.phase;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => {
                  setActivePhaseTab(b.phase);
                  onExpandPhase(b.phase);
                  const el = document.getElementById(`phase-block-${b.id}`);
                  el?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all hover:scale-102 active:scale-98",
                  b.phase === "warmup" &&
                    (isSelected
                      ? "bg-orange-600 text-white shadow-xs"
                      : "border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 dark:border-orange-900/40 dark:bg-orange-950/40 dark:text-orange-300"),
                  b.phase === "main" &&
                    (isSelected
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900/40 dark:bg-indigo-950/40 dark:text-indigo-300"),
                  b.phase !== "warmup" &&
                    b.phase !== "main" &&
                    (isSelected
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300")
                )}
              >
                <span>
                  {b.phase === "warmup" && "🔥 "}
                  {b.phase === "main" && "🏸 "}
                  {b.phase !== "warmup" && b.phase !== "main" && "🧘 "}
                  {getPhaseName(b.phase)}
                </span>
                <span
                  className={cn(
                    "py-0.2 rounded-full px-1.5 text-[10px] font-bold",
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-black/10 text-inherit dark:bg-white/10"
                  )}
                >
                  {b.items.length} ({phaseTotal}м)
                </span>
              </button>
            );
          })}
        </div>

        {/* Expand / Collapse All & Quick Actions */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[11px] font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            onClick={() => onSetAllPhasesExpanded(true)}
            title="Разгъни всички части за преглед на упражненията"
          >
            <ChevronDown className="mr-1 size-3.5 text-zinc-500" />
            Разгъни всички
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[11px] font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            onClick={() => onSetAllPhasesExpanded(false)}
            title="Свий всички части в компактен списък"
          >
            <ChevronUp className="mr-1 size-3.5 text-zinc-500" />
            Свий всички
          </Button>
          <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700" />
          <Button
            variant="outline"
            size="sm"
            className="h-7 border-blue-200 bg-blue-50 text-[10px] text-blue-600 hover:bg-blue-100 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-300"
            onClick={onInjectHydration}
          >
            + Хидратация
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 border-slate-200 bg-slate-50 text-[10px] text-slate-600 hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
            onClick={onToggleRainyDay}
          >
            {isRainyDay ? "Върни Външни" : "План 'Дъжд'"}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface SessionStep2LibraryProps {
  mobileStep2Tab: "plan" | "library";
  allExercises: Exercise[];
  filteredExercises: Exercise[];
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  isFetching: boolean;
  onAddExerciseToBlock: (phase: StationPhaseType, exercise: Exercise) => void;
}

function SessionStep2Library({
  mobileStep2Tab,
  allExercises,
  filteredExercises,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  isFetching,
  onAddExerciseToBlock,
}: SessionStep2LibraryProps) {
  return (
    <div
      className={cn(
        "size-full min-h-0 flex-col gap-3 overflow-hidden border-t border-zinc-200 bg-white p-3 sm:p-4 lg:w-96 lg:flex-shrink-0 lg:border-t-0 lg:border-l dark:border-zinc-800 dark:bg-zinc-900",
        mobileStep2Tab === "library" ? "flex flex-1" : "hidden lg:flex"
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
          Каталог Упражнения
        </h3>
        <span className="text-xs text-zinc-400">
          {filteredExercises.length} налични
        </span>
      </div>

      <div className="relative">
        <Search className="absolute top-2.5 left-2 size-4 text-zinc-400" />
        <Input
          placeholder="Търси упражнение..."
          className="h-9 bg-zinc-50 pl-8 text-xs sm:text-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Quick Mode Filters */}
      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => setSelectedCategory("all")}
          className={cn(
            "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all",
            selectedCategory === "all"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
          )}
        >
          Всички
        </button>
        <button
          type="button"
          onClick={() => setSelectedCategory("quiz")}
          className={cn(
            "flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all",
            selectedCategory === "quiz"
              ? "bg-amber-500 text-white shadow-xs"
              : "border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-300"
          )}
        >
          🧠 Теория & Викторина ({getCategoryCount(allExercises, "quiz")})
        </button>
      </div>

      <div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              Всички категории ({getCategoryCount(allExercises, "all")})
            </SelectItem>
            <SelectItem value="warmup">
              Загрявка ({getCategoryCount(allExercises, "warmup")})
            </SelectItem>
            <SelectItem value="technique">
              Техника ({getCategoryCount(allExercises, "technique")})
            </SelectItem>
            <SelectItem value="tactics">
              Тактика ({getCategoryCount(allExercises, "tactics")})
            </SelectItem>
            <SelectItem value="physical">
              Физически ({getCategoryCount(allExercises, "physical")})
            </SelectItem>
            <SelectItem value="games">
              Игри и Забава ({getCategoryCount(allExercises, "games")})
            </SelectItem>
            <SelectItem value="cooldown">
              Разпускане ({getCategoryCount(allExercises, "cooldown")})
            </SelectItem>
            <SelectItem value="beach">
              Плажни Блокове (Лагер) ({getCategoryCount(allExercises, "beach")})
            </SelectItem>
            <SelectItem value="circuit">
              Станционни Ротации (Лагер) (
              {getCategoryCount(allExercises, "circuit")})
            </SelectItem>
            <SelectItem value="tactical">
              Мулти-Шатъл (Лагер) ({getCategoryCount(allExercises, "tactical")})
            </SelectItem>
            <SelectItem value="quiz">
              🧠 Викторини & Тестове ({getCategoryCount(allExercises, "quiz")})
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 scrollbar-thin space-y-2 overflow-y-auto pr-1 pb-4">
        {isFetching ? (
          <div className="flex justify-center p-4">
            <Loader2 className="size-6 animate-spin text-indigo-600" />
          </div>
        ) : (
          <>
            {filteredExercises.map((ex) => (
              <ExerciseItemCard
                key={ex.id}
                exercise={ex}
                selectedCategory={selectedCategory}
                onAddToBlock={onAddExerciseToBlock}
              />
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
  );
}

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
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:30");
  const [mode, setMode] = useState<TrainingMode>("season");
  const [location, setLocation] = useState<LocationType>("court");
  const [customLocation, setCustomLocation] = useState("");
  const [isAllGroupMode, setIsAllGroupMode] = useState(false);
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

  const injectHydrationBreaks = () => {
    setBlocks((prev) => applyHydrationBreaks(prev));
  };

  const toggleRainyDay = () => {
    const nextState = !isRainyDay;
    setIsRainyDay(nextState);
    if (nextState) {
      setBlocks((prev) => applyRainyDay(prev));
      setLocation("court");
    }
  };

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
  const [activePhaseTab, setActivePhaseTab] = useState<
    "all" | StationPhaseType
  >("all");
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>(
    {
      warmup: true,
      main: true,
      cooldown: true,
    }
  );

  const togglePhaseExpanded = (phase: string) => {
    setExpandedPhases((prev) => ({
      ...prev,
      [phase]: prev[phase] !== undefined ? !prev[phase] : false,
    }));
  };

  const setAllPhasesExpanded = (expanded: boolean) => {
    setExpandedPhases({
      warmup: expanded,
      main: expanded,
      cooldown: expanded,
    });
  };

  // Station Builder Modal
  const [showStationModal, setShowStationModal] = useState(false);
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

  // Initialize session data when dialog opens
  useEffect(() => {
    if (!open) return;
    const s = buildPrefillState(
      initialSession as PlannerSession,
      initialDate,
      initialCampId
    );
    setTitle(s.title);
    setDate(s.date);
    setStartTime(s.startTime);
    setEndTime(s.endTime);
    setMode(s.mode);
    setLocation(s.location);
    setCustomLocation(s.customLocation || "");
    setIsAllGroupMode(s.isAllGroupMode);
    setTotalDuration(s.totalDuration);
    setCoachNotes(s.coachNotes || "");
    setGroups(s.groups);
    setBlocks(s.blocks);
    setSearchQuery("");
    setSelectedCategory("all");
  }, [open, initialSession, initialCampId, initialDate]);

  useEffect(() => {
    if (!open) return;

    let isMounted = true;
    const loadResources = async () => {
      setIsFetching(true);
      try {
        const res = await loadWizardResources(
          activeBranch,
          initialCampId,
          initialImportTemplateId
        );
        if (!isMounted) return;
        setAllExercises(res.finalExercises);
        setGlobalInventory(res.globalInventory);
        setSessionInventory(res.sessionInventory);
        setTotalKids(res.participantsList.length);
        setAvailableParticipants(res.participantsList);
        if (!initialSession) {
          if (res.templateName) setTitle(res.templateName);
          if (res.templateDuration) setTotalDuration(res.templateDuration);
          if (res.templateBlocks) setBlocks(res.templateBlocks);
        }
      } catch (err) {
        console.error("Error loading wizard resources", err);
      } finally {
        if (isMounted) setIsFetching(false);
      }
    };

    loadResources();
    return () => {
      isMounted = false;
    };
  }, [
    open,
    activeBranch,
    initialCampId,
    initialImportTemplateId,
    initialSession,
  ]);

  // Recalculate block target durations when total duration changes
  useEffect(() => {
    setBlocks((prev) => computeTargetBlocks(prev, totalDuration));
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
    setGroups((prev) => toggleMemberInGroupList(prev, groupId, participantId));
  };

  const addExerciseToBlock = (phase: StationPhaseType, exercise: Exercise) => {
    setBlocks((prev) =>
      appendExerciseToBlocks(
        prev,
        phase,
        exercise,
        groups.length === 1 ? groups[0].id : undefined
      )
    );
    toast.success(`Добавено в ${getPhaseName(phase)}!`);
  };

  const removeItem = (phase: StationPhaseType, itemId: string) => {
    setBlocks((prev) => removeItemFromBlocks(prev, phase, itemId));
  };

  const updateItemDuration = (
    phase: StationPhaseType,
    itemId: string,
    newDuration: number
  ) => {
    setBlocks((prev) =>
      updateDurationInBlocks(prev, phase, itemId, newDuration)
    );
  };

  const updateItemTargetGroup = (
    phase: StationPhaseType,
    itemId: string,
    groupId: string
  ) => {
    setBlocks((prev) =>
      updateTargetGroupInBlocks(prev, phase, itemId, groupId)
    );
  };

  const saveStation = () => {
    const newStation = buildStationBlockItem(
      stationRotations,
      allExercises,
      stationDuration
    );
    if (!newStation) return;

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
      const sessionData = buildSessionPayload({
        date,
        startTime,
        endTime,
        mode,
        location,
        customLocation,
        title,
        coachNotes,
        campId: initialCampId,
        blocks,
        totalKids,
        isAllGroupMode,
        availableParticipants,
        groups,
      });

      // Strip undefined values to prevent Firebase errors
      const cleanSessionData = JSON.parse(JSON.stringify(sessionData));

      if (initialSession) {
        // Editing existing session
        await plannerService.updateSession(initialSession.id, cleanSessionData);
        toast.success("Тренировката е обновена успешно!");
      } else {
        // Creating new session
        await plannerService.addSession(activeBranch, cleanSessionData);
        toast.success("Тренировката е записана успешно!");
      }
      onOpenChange(false);
      onSaveSuccess();
    } catch (error) {
      console.error("Failed to save session", error);
      toast.error("Възникна грешка при запис на тренировката.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredExercises = allExercises.filter((ex) => {
    if (!matchesCategoryFilter(ex, selectedCategory)) return false;
    if (
      searchQuery &&
      !ex.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const [mobileStep2Tab, setMobileStep2Tab] = useState<"plan" | "library">(
    "plan"
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-full max-w-7xl flex-col gap-0 overflow-hidden rounded-none bg-zinc-50 p-0 sm:h-[90vh] sm:max-h-[90vh] sm:rounded-2xl">
        <DialogHeader className="z-10 flex-shrink-0 border-b border-zinc-200 bg-white p-3 sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <DialogTitle className="text-base sm:text-xl">
            {initialSession
              ? "Редактиране на тренировка"
              : "Конструктор на тренировка (Time-Budget Builder)"}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {initialSession
              ? `Редактирайте тренировката: ${initialSession.title}`
              : "Разпределете упражненията и станциите за вашите групи. Времето се разпределя автоматично (10% - 80% - 10%)."}
          </DialogDescription>
        </DialogHeader>

        {/* WIZARD HEADER */}
        <div className="flex flex-shrink-0 justify-center gap-1.5 border-b border-zinc-200 bg-white p-2 text-xs font-medium sm:gap-6 sm:p-3 sm:text-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div
            className={cn(
              "cursor-pointer rounded-full px-3 py-1.5 transition-colors sm:px-4 sm:py-2",
              currentStep === 1
                ? "bg-indigo-600 text-white shadow"
                : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            )}
            onClick={() => setCurrentStep(1)}
          >
            1. Настройки
          </div>
          <div
            className={cn(
              "cursor-pointer rounded-full px-3 py-1.5 transition-colors sm:px-4 sm:py-2",
              currentStep === 2
                ? "bg-indigo-600 text-white shadow"
                : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            )}
            onClick={() => setCurrentStep(2)}
          >
            2. Конструктор
          </div>
          <div
            className={cn(
              "cursor-pointer rounded-full px-3 py-1.5 transition-colors sm:px-4 sm:py-2",
              currentStep === 3
                ? "bg-indigo-600 text-white shadow"
                : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            )}
            onClick={() => setCurrentStep(3)}
          >
            3. Запазване
          </div>
        </div>

        <div
          className={cn(
            "min-h-0 flex-1",
            currentStep === 2
              ? "flex flex-col overflow-hidden"
              : "overflow-y-auto"
          )}
        >
          {/* STEP 1: General Settings & Inventory */}
          {currentStep === 1 && (
            <SessionStep1Settings
              title={title}
              setTitle={setTitle}
              date={date}
              setDate={setDate}
              location={location}
              setLocation={setLocation}
              customLocation={customLocation}
              setCustomLocation={setCustomLocation}
              startTime={startTime}
              setStartTime={setStartTime}
              endTime={endTime}
              setEndTime={setEndTime}
              totalDuration={totalDuration}
              setTotalDuration={setTotalDuration}
              isAllGroupMode={isAllGroupMode}
              setIsAllGroupMode={setIsAllGroupMode}
              groups={groups}
              setGroups={setGroups}
              availableParticipants={availableParticipants}
              newGroupName={newGroupName}
              setNewGroupName={setNewGroupName}
              onAddGroup={addGroup}
              onRemoveGroup={removeGroup}
              onToggleParticipant={toggleParticipantInGroup}
              isFetching={isFetching}
              globalInventory={globalInventory}
              sessionInventory={sessionInventory}
              setSessionInventory={setSessionInventory}
            />
          )}

          {/* STEP 2: Constructor (DND Blocks + Library) */}
          {currentStep === 2 && (
            <div className="flex size-full min-h-0 flex-1 flex-col overflow-hidden">
              {/* Mobile Sub-Header Switcher for Phone/Tablet screens (< lg) */}
              <div className="flex shrink-0 border-b border-zinc-200 bg-zinc-100 p-1.5 lg:hidden dark:border-zinc-800 dark:bg-zinc-950">
                <button
                  type="button"
                  onClick={() => setMobileStep2Tab("plan")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all",
                    mobileStep2Tab === "plan"
                      ? "bg-white text-indigo-600 shadow-xs dark:bg-zinc-800 dark:text-white"
                      : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
                  )}
                >
                  <span>📋 График & Части</span>
                  <span className="py-0.2 rounded-full bg-indigo-50 px-1.5 text-[10px] text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    {blocks.reduce((sum, b) => sum + b.items.length, 0)}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileStep2Tab("library")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all",
                    mobileStep2Tab === "library"
                      ? "bg-white text-indigo-600 shadow-xs dark:bg-zinc-800 dark:text-white"
                      : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
                  )}
                >
                  <span>📚 Каталог Упражнения</span>
                  <span className="py-0.2 rounded-full bg-indigo-50 px-1.5 text-[10px] text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    {filteredExercises.length}
                  </span>
                </button>
              </div>

              <div className="flex size-full min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
                {/* MIDDLE: Time Budget Blocks */}
                <div
                  className={cn(
                    "size-full min-h-0 flex-1 scrollbar-thin flex-col gap-4 overflow-y-auto p-3 sm:p-6 lg:border-r lg:border-zinc-200 dark:lg:border-zinc-800",
                    mobileStep2Tab === "plan" ? "flex" : "hidden lg:flex"
                  )}
                >
                  {selectedCategory === "quiz" ? (
                    <DedicatedQuizModule
                      blocks={blocks}
                      totalDuration={totalDuration}
                      onRemoveItem={removeItem}
                    />
                  ) : (
                    <>
                      <SessionStep2Toolbar
                        blocks={blocks}
                        activePhaseTab={activePhaseTab}
                        setActivePhaseTab={setActivePhaseTab}
                        onExpandPhase={(phase) =>
                          setExpandedPhases((prev) => ({
                            ...prev,
                            [phase]: true,
                          }))
                        }
                        onSetAllPhasesExpanded={setAllPhasesExpanded}
                        onInjectHydration={injectHydrationBreaks}
                        onToggleRainyDay={toggleRainyDay}
                        isRainyDay={isRainyDay}
                      />

                      {blocks
                        .filter(
                          (b) =>
                            activePhaseTab === "all" ||
                            b.phase === activePhaseTab
                        )
                        .map((block) => (
                          <PhaseAccordionCard
                            key={block.id}
                            block={block}
                            isExpanded={expandedPhases[block.phase] !== false}
                            onToggleExpand={() =>
                              togglePhaseExpanded(block.phase)
                            }
                            groups={groups}
                            globalInventory={globalInventory}
                            sessionInventory={sessionInventory}
                            kidsPerStation={kidsPerStation}
                            onRemoveItem={removeItem}
                            onUpdateDuration={updateItemDuration}
                            onUpdateTargetGroup={updateItemTargetGroup}
                            onCreateStation={(phase) => {
                              setStationPhase(phase);
                              setStationRotations([]);
                              setShowStationModal(true);
                            }}
                          />
                        ))}
                    </>
                  )}
                </div>

                {/* RIGHT: Library */}
                <SessionStep2Library
                  mobileStep2Tab={mobileStep2Tab}
                  allExercises={allExercises}
                  filteredExercises={filteredExercises}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  isFetching={isFetching}
                  onAddExerciseToBlock={addExerciseToBlock}
                />
              </div>
            </div>
          )}

          {/* STEP 3: Preview & Save */}
          {currentStep === 3 && (
            <SessionStep3Summary
              coachNotes={coachNotes}
              setCoachNotes={setCoachNotes}
              blocks={blocks}
              selectedCategory={selectedCategory}
              totalDuration={totalDuration}
            />
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
