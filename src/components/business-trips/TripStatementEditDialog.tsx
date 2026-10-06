"use client";

import { differenceInCalendarDays } from "date-fns";
import {
  Calculator,
  FileText,
  Moon,
  RotateCcw,
  Save,
  Sparkles,
  Sun,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  buildStaySectionText,
  updateReportTextStaySection,
} from "@/lib/business-trip-report";
import { businessTripService } from "@/services/business-trip-service";
import { getAllMembers } from "@/services/member-service";
import { BusinessTrip, convertEurToBgn } from "@/types/business-trip.types";
import { Member } from "@/types/member.types";

interface TripStatementEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: BusinessTrip | null;
  onSuccess?: () => void;
}

interface PersonOverride {
  id: string; // "coach" or member ID
  name: string;
  role: string;
  isCoach: boolean;
  excluded: boolean;
  actualDays: number | "";
  actualNights: number | "";
  stayedOvernight: boolean;
  perDiemRateEUR?: number | string;
  note: string;
}

const COMMON_REASONS = [
  "Отпаднал от турнира (ранно отпадане)",
  "Отпаднал в квалификациите",
  "Отпаднал в 1-ви кръг основна схема",
  "Контузия / неразположение",
  "Не участва в квалификации (директно основна схема)",
  "Приключил участие след Ден 1",
  "Лични / семейни причини",
];

function getPersonRowClass(excluded: boolean, isStaying: boolean): string {
  if (excluded) return "bg-zinc-50/70 opacity-60 dark:bg-zinc-900/30";
  if (isStaying)
    return "bg-white hover:bg-zinc-50/50 dark:bg-zinc-950 dark:hover:bg-zinc-900/20";
  return "bg-amber-50/30 hover:bg-amber-50/50 dark:bg-amber-950/10 dark:hover:bg-amber-950/20";
}

function applyStayedOvernightChange(
  p: PersonOverride,
  isStaying: boolean,
  currentGlobalNights: number
): PersonOverride {
  let actualNights: number | "";
  if (isStaying) {
    actualNights =
      p.actualNights && Number(p.actualNights) > 0
        ? p.actualNights
        : currentGlobalNights;
  } else {
    actualNights = 0;
  }
  const note =
    !isStaying && !p.note ? "Отпаднал от турнира (без нощувка)" : p.note;
  return { ...p, stayedOvernight: isStaying, actualNights, note };
}

function computePersonRate(
  perDiemRateEUR: PersonOverride["perDiemRateEUR"],
  isNoStay: boolean,
  noStayRate: number,
  baseRate: number
): number {
  if (perDiemRateEUR !== undefined && perDiemRateEUR !== "")
    return Number(perDiemRateEUR);
  return isNoStay ? noStayRate : baseRate;
}

export function TripStatementEditDialog({
  open,
  onOpenChange,
  trip,
  onSuccess,
}: TripStatementEditDialogProps) {
  const [globalDays, setGlobalDays] = useState<number | "">("");
  const [globalNights, setGlobalNights] = useState<number | "">("");
  const [people, setPeople] = useState<PersonOverride[]>([]);
  const [membersDict, setMembersDict] = useState<Record<string, Member>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [filterMode, setFilterMode] = useState<"all" | "staying" | "no_stay">(
    "all"
  );

  // Planned values from trip dates
  const plannedDays = trip
    ? Math.max(
        1,
        differenceInCalendarDays(
          new Date(trip.endDate),
          new Date(trip.startDate)
        ) + 1
      )
    : 0;
  const plannedNights = trip
    ? Math.max(
        0,
        differenceInCalendarDays(
          new Date(trip.endDate),
          new Date(trip.startDate)
        )
      )
    : 0;

  // Load members and init state
  useEffect(() => {
    if (!open || !trip) return;

    getAllMembers().then((all) => {
      const dict: Record<string, Member> = {};
      all.forEach((m) => {
        if (m.id) dict[m.id] = m;
      });
      setMembersDict(dict);

      // Default team days / nights
      const defDays = trip.actualDays != null ? trip.actualDays : plannedDays;
      const defNights =
        trip.actualNights != null ? trip.actualNights : plannedNights;
      setGlobalDays(defDays);
      setGlobalNights(defNights);

      const overrides = trip.participantOverrides ?? {};

      const coachName =
        trip.coachName ||
        (dict[trip.coachId]
          ? `${dict[trip.coachId].firstName} ${dict[trip.coachId].lastName}`
          : "Треньор");
      const coachRole =
        trip.coachRole ||
        (dict[trip.coachId]?.isCoach ? "Треньор" : "Ръководител");

      const coachOv = overrides["coach"] ?? {};
      const coachDays =
        coachOv.actualDays != null ? coachOv.actualDays : defDays;
      let coachNights: number;
      if (coachOv.actualNights != null) {
        coachNights = coachOv.actualNights;
      } else if (coachOv.stayedOvernight === false) {
        coachNights = 0;
      } else {
        coachNights = defNights;
      }
      const coachStayed =
        coachOv.stayedOvernight != null
          ? coachOv.stayedOvernight
          : coachNights > 0;

      const peopleList: PersonOverride[] = [
        {
          id: "coach",
          name: coachName,
          role: coachRole,
          isCoach: true,
          excluded: coachOv.excluded ?? false,
          actualDays: coachDays,
          actualNights: coachNights,
          stayedOvernight: coachStayed,
          perDiemRateEUR: coachOv.perDiemRateEUR ?? "",
          note: coachOv.note || "",
        },
        ...trip.participantsIds.map((pid) => {
          const m = dict[pid];
          const ov = overrides[pid] ?? {};
          const pDays = ov.actualDays != null ? ov.actualDays : defDays;
          let pNights: number;
          if (ov.actualNights != null) {
            pNights = ov.actualNights;
          } else if (ov.stayedOvernight === false) {
            pNights = 0;
          } else {
            pNights = defNights;
          }
          const pStayed =
            ov.stayedOvernight != null ? ov.stayedOvernight : pNights > 0;

          return {
            id: pid,
            name: m ? `${m.firstName} ${m.lastName}` : pid,
            role: m?.isCoach ? "Треньор" : "Състезател",
            isCoach: Boolean(m?.isCoach),
            excluded: ov.excluded ?? false,
            actualDays: pDays,
            actualNights: pNights,
            stayedOvernight: pStayed,
            perDiemRateEUR: ov.perDiemRateEUR ?? "",
            note: ov.note || "",
          };
        }),
      ];
      setPeople(peopleList);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, trip]);

  // Reset everything back to planned
  const handleReset = () => {
    setGlobalDays(plannedDays);
    setGlobalNights(plannedNights);
    setPeople((prev) =>
      prev.map((p) => ({
        ...p,
        excluded: false,
        actualDays: plannedDays,
        actualNights: plannedNights,
        stayedOvernight: plannedNights > 0,
        perDiemRateEUR: "",
        note: "",
      }))
    );
    toast.info("Възстановени са първоначално планираните дни и нощи.");
  };

  const handlePersonChange = (
    id: string,
    field: keyof PersonOverride,
    value: boolean | number | string | ""
  ) => {
    setPeople((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;

        if (field === "stayedOvernight") {
          const isStaying = Boolean(value);
          const currentGlobalNights =
            globalNights === "" ? plannedNights : Number(globalNights);
          return applyStayedOvernightChange(p, isStaying, currentGlobalNights);
        }

        if (field === "actualNights") {
          const numNights = value === "" ? 0 : Number(value);
          return {
            ...p,
            actualNights: value as number | "",
            stayedOvernight: numNights > 0,
          };
        }

        return { ...p, [field]: value };
      })
    );
  };

  // Quick preset application for a single person
  const handleApplyPreset = (
    id: string,
    days: number,
    nights: number,
    note: string
  ) => {
    setPeople((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        return {
          ...p,
          actualDays: days,
          actualNights: nights,
          stayedOvernight: nights > 0,
          perDiemRateEUR: "", // auto-computed based on stay status
          note,
        };
      })
    );
  };

  // Quick action: apply global team days/nights to all
  const handleApplyGlobalToAll = () => {
    const d = globalDays === "" ? plannedDays : Number(globalDays);
    const n = globalNights === "" ? plannedNights : Number(globalNights);
    setPeople((prev) =>
      prev.map((p) => ({
        ...p,
        actualDays: d,
        actualNights: n,
        stayedOvernight: n > 0,
        perDiemRateEUR: "",
        note: "",
      }))
    );
    toast.success("Отборните дни и нощи са приложени за всички участници.");
  };

  // Quick action: mark all non-excluded as staying
  const handleMarkAllStaying = () => {
    const n = globalNights === "" ? plannedNights : Number(globalNights);
    setPeople((prev) =>
      prev.map((p) => ({
        ...p,
        actualNights: n,
        stayedOvernight: n > 0,
        perDiemRateEUR: "",
      }))
    );
    toast.success("Всички участници са отбелязани като нощували.");
  };

  // Rates
  const basePerDiemEUR =
    trip?.financials.perDiemOverrideEUR ?? trip?.financials.perDiemRateEUR ?? 0;
  // Ставка без нощувка: 50% от дневните пари
  const noStayPerDiemEUR = Math.round(basePerDiemEUR * 0.5 * 100) / 100;
  const accomEUR = trip?.financials.accommodationRateEUR ?? 0;

  // Active people calculations
  const activePeople = people.filter((p) => !p.excluded);
  const stayingCount = activePeople.filter(
    (p) => p.stayedOvernight && Number(p.actualNights) > 0
  ).length;
  const noStayCount = activePeople.length - stayingCount;

  const perPersonPreview = activePeople.map((p) => {
    const days = p.actualDays === "" ? 0 : Number(p.actualDays);
    const nights =
      !p.stayedOvernight || p.actualNights === "" ? 0 : Number(p.actualNights);
    const isNoStay = plannedNights > 0 && (!p.stayedOvernight || nights === 0);

    // Дневна ставка: ако няма нощувка при пътуване с планирани нощувки, ставката е 50%
    const personRateEUR = computePersonRate(
      p.perDiemRateEUR,
      isNoStay,
      noStayPerDiemEUR,
      basePerDiemEUR
    );

    const diemTotal = Math.round(personRateEUR * days * 100) / 100;
    const accomTotal = Math.round(accomEUR * nights * 100) / 100;
    return {
      ...p,
      days,
      nights,
      isNoStay,
      personRateEUR,
      diemTotal,
      accomTotal,
      total: Math.round((diemTotal + accomTotal) * 100) / 100,
    };
  });

  const grandDiem = perPersonPreview.reduce((s, p) => s + p.diemTotal, 0);
  const grandAccom = perPersonPreview.reduce((s, p) => s + p.accomTotal, 0);
  const grandTotal = Math.round((grandDiem + grandAccom) * 100) / 100;

  // Real-time simulated trip for report preview
  const currentOverrides = useMemo(() => {
    const ov: NonNullable<BusinessTrip["participantOverrides"]> = {};
    people.forEach((p) => {
      const days = p.actualDays === "" ? undefined : Number(p.actualDays);
      const nights =
        !p.stayedOvernight || p.actualNights === ""
          ? 0
          : Number(p.actualNights);
      const isNoStay =
        plannedNights > 0 && (!p.stayedOvernight || nights === 0);
      const personRateEUR = computePersonRate(
        p.perDiemRateEUR,
        isNoStay,
        noStayPerDiemEUR,
        basePerDiemEUR
      );

      ov[p.id] = {
        actualDays: days,
        actualNights: nights,
        stayedOvernight: p.stayedOvernight && Number(p.actualNights) > 0,
        perDiemRateEUR: personRateEUR,
        note: p.note?.trim() || undefined,
        excluded: p.excluded,
      };
    });
    return ov;
  }, [people, plannedNights, noStayPerDiemEUR, basePerDiemEUR]);

  const simulatedTrip = useMemo(() => {
    if (!trip) return null;
    return {
      ...trip,
      actualDays: globalDays === "" ? undefined : Number(globalDays),
      actualNights: globalNights === "" ? undefined : Number(globalNights),
      participantOverrides: currentOverrides,
    } as BusinessTrip;
  }, [trip, globalDays, globalNights, currentOverrides]);

  const reportStaySectionPreview = useMemo(() => {
    if (!simulatedTrip) return "";
    return buildStaySectionText(simulatedTrip, membersDict);
  }, [simulatedTrip, membersDict]);

  const handleSave = async () => {
    if (!trip?.id || !simulatedTrip) return;
    setIsSaving(true);
    try {
      // Auto-synchronize report text with the stay section
      const updatedReportText = updateReportTextStaySection(
        trip.reportText,
        simulatedTrip,
        membersDict
      );

      await businessTripService.updateTrip(trip.id, {
        actualDays: globalDays === "" ? undefined : Number(globalDays),
        actualNights: globalNights === "" ? undefined : Number(globalNights),
        participantOverrides: currentOverrides,
        reportText: updatedReportText,
      });

      toast.success(
        "Ведомостта и Докладът за командировка са актуализирани успешно!"
      );
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Грешка при записа на ведомостта.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredPeople = useMemo(() => {
    if (filterMode === "staying") {
      return people.filter(
        (p) => !p.excluded && p.stayedOvernight && Number(p.actualNights) > 0
      );
    }
    if (filterMode === "no_stay") {
      return people.filter(
        (p) =>
          !p.excluded && (!p.stayedOvernight || Number(p.actualNights) === 0)
      );
    }
    return people;
  }, [people, filterMode]);

  if (!trip) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Calculator className="size-5 text-blue-600" />
            Редактиране на Ведомост и Нощувки
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Коригирайте реалните дни и нощи на участниците. Отбележете кои
            състезатели са нощували и кои са отпаднали по-рано. Ведомостта и
            Докладът ще се преизчислят автоматично.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Planned card */}
          <div className="grid grid-cols-1 gap-2 rounded-xl border border-amber-200/80 bg-amber-50/70 p-3.5 text-xs sm:grid-cols-3 dark:border-amber-900/50 dark:bg-amber-950/25">
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-200">
                Планирано (по дати):
              </p>
              <p className="font-medium text-amber-800 dark:text-amber-300">
                {plannedDays} {plannedDays === 1 ? "ден" : "дни"} /{" "}
                {plannedNights} {plannedNights === 1 ? "нощ" : "нощи"}
              </p>
            </div>
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-200">
                Дневни пари (по закон):
              </p>
              <p className="font-medium text-amber-800 dark:text-amber-300">
                С нощувка: €{basePerDiemEUR.toFixed(2)} / ден (
                {convertEurToBgn(basePerDiemEUR).toFixed(2)} лв.)
              </p>
              {plannedNights > 0 && (
                <p className="text-[11px] font-semibold text-amber-900 dark:text-amber-200">
                  Без нощувка: €{noStayPerDiemEUR.toFixed(2)} / ден (50% от
                  дневните)
                </p>
              )}
            </div>
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-200">
                Ставка нощувка:
              </p>
              <p className="font-medium text-amber-800 dark:text-amber-300">
                {accomEUR > 0
                  ? `€${accomEUR.toFixed(2)} / нощ (${convertEurToBgn(accomEUR).toFixed(2)} лв.)`
                  : "По представена фактура"}
              </p>
            </div>
          </div>

          {/* Team Duration Inputs */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/40">
            <div className="mb-2.5 flex items-center justify-between">
              <Label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Реален престой на отбора (основни дни/нощи):
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleApplyGlobalToAll}
                className="h-7 text-[11px] text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/40"
              >
                <Sparkles className="mr-1 size-3" />
                Приложи за всички
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1">
                <Label
                  htmlFor="global-days"
                  className="text-[11px] text-muted-foreground"
                >
                  Реални дни (отборно)
                </Label>
                <Input
                  id="global-days"
                  type="number"
                  min={0}
                  max={plannedDays}
                  value={globalDays}
                  onChange={(e) =>
                    setGlobalDays(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  className="h-8 bg-white text-center text-xs font-semibold dark:bg-zinc-950"
                />
                <p className="text-[10px] text-muted-foreground">
                  Планирано: {plannedDays} дни
                </p>
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor="global-nights"
                  className="text-[11px] text-muted-foreground"
                >
                  Реални нощи (отборно)
                </Label>
                <Input
                  id="global-nights"
                  type="number"
                  min={0}
                  max={plannedNights}
                  value={globalNights}
                  onChange={(e) =>
                    setGlobalNights(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  className="h-8 bg-white text-center text-xs font-semibold dark:bg-zinc-950"
                />
                <p className="text-[10px] text-muted-foreground">
                  Планирано: {plannedNights} нощи
                </p>
              </div>
            </div>
          </div>

          {/* Participants header + filter chips */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-2 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-blue-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Участници и нощувки ({activePeople.length} лица)
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <Button
                  type="button"
                  variant={filterMode === "all" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setFilterMode("all")}
                  className="h-6 px-2 text-[11px]"
                >
                  Всички ({people.length})
                </Button>
                <Button
                  type="button"
                  variant={filterMode === "staying" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setFilterMode("staying")}
                  className="h-6 px-2 text-[11px] text-indigo-700 dark:text-indigo-300"
                >
                  🌙 Нощуващи ({stayingCount})
                </Button>
                <Button
                  type="button"
                  variant={filterMode === "no_stay" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setFilterMode("no_stay")}
                  className="h-6 px-2 text-[11px] text-amber-700 dark:text-amber-400"
                >
                  ❌ Без нощувка ({noStayCount})
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleMarkAllStaying}
                className="h-6 text-[10px]"
              >
                <Moon className="mr-1 size-3 text-indigo-600" />
                Всички нощуват
              </Button>
            </div>
          </div>

          {/* Participants List */}
          <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
            {filteredPeople.map((p) => {
              const days = p.actualDays === "" ? 0 : Number(p.actualDays);
              const nights =
                !p.stayedOvernight || p.actualNights === ""
                  ? 0
                  : Number(p.actualNights);
              const isNoStay =
                plannedNights > 0 && (!p.stayedOvernight || nights === 0);
              const personRateEUR = computePersonRate(
                p.perDiemRateEUR,
                isNoStay,
                noStayPerDiemEUR,
                basePerDiemEUR
              );
              const personDiem = Math.round(personRateEUR * days * 100) / 100;
              const personAccom = Math.round(accomEUR * nights * 100) / 100;
              const personTotal =
                Math.round((personDiem + personAccom) * 100) / 100;
              const isStaying = p.stayedOvernight && nights > 0;

              return (
                <div
                  key={p.id}
                  className={`p-3 transition-colors ${getPersonRowClass(p.excluded, isStaying)}`}
                >
                  {/* Top line: Participation checkbox, Name, Role, Stay toggle badge, Total */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`excl-${p.id}`}
                        checked={!p.excluded}
                        onCheckedChange={(v) =>
                          handlePersonChange(p.id, "excluded", !v)
                        }
                      />
                      <label
                        htmlFor={`excl-${p.id}`}
                        className={`cursor-pointer text-xs font-semibold ${
                          p.excluded
                            ? "line-through text-zinc-400"
                            : "text-zinc-900 dark:text-zinc-100"
                        }`}
                      >
                        {p.name}
                        <span className="ml-1.5 font-normal text-zinc-400">
                          ({p.role})
                        </span>
                      </label>
                      {p.isCoach && (
                        <Badge
                          variant="outline"
                          className="border-blue-200 bg-blue-50 text-[10px] text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300"
                        >
                          Ръководител
                        </Badge>
                      )}
                    </div>

                    {!p.excluded && (
                      <div className="flex items-center gap-2">
                        {/* Stay toggle button */}
                        <Button
                          type="button"
                          size="sm"
                          variant={isStaying ? "secondary" : "outline"}
                          onClick={() =>
                            handlePersonChange(
                              p.id,
                              "stayedOvernight",
                              !isStaying
                            )
                          }
                          className={`h-6 gap-1 px-2 text-[11px] font-medium transition-all ${
                            isStaying
                              ? "border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300"
                              : "border-amber-300 bg-amber-50/80 text-amber-800 hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300"
                          }`}
                        >
                          {isStaying ? (
                            <>
                              <Moon className="size-3 text-indigo-600 dark:text-indigo-400" />
                              Нощува ({nights} {nights === 1 ? "нощ" : "нощи"})
                            </>
                          ) : (
                            <>
                              <Sun className="size-3 text-amber-600 dark:text-amber-400" />
                              Без нощувка (0 нощи)
                            </>
                          )}
                        </Button>

                        {/* Calculated sum badge */}
                        <span className="min-w-[70px] text-right text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          €{personTotal.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  {!p.excluded && (
                    <div className="mt-2.5 space-y-2 pl-6 sm:pl-7">
                      {/* Inputs and Quick Presets */}
                      <div className="flex flex-wrap items-center gap-2.5">
                        {/* Days input */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                            Дни:
                          </span>
                          <Input
                            type="number"
                            min={0}
                            max={plannedDays}
                            value={p.actualDays}
                            onChange={(e) =>
                              handlePersonChange(
                                p.id,
                                "actualDays",
                                e.target.value === ""
                                  ? ""
                                  : Number(e.target.value)
                              )
                            }
                            className="h-7 w-14 text-center text-xs font-semibold"
                          />
                        </div>

                        {/* Nights input */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                            Нощи:
                          </span>
                          <Input
                            type="number"
                            min={0}
                            max={plannedNights}
                            value={p.actualNights}
                            onChange={(e) =>
                              handlePersonChange(
                                p.id,
                                "actualNights",
                                e.target.value === ""
                                  ? ""
                                  : Number(e.target.value)
                              )
                            }
                            className={`h-7 w-14 text-center text-xs font-semibold ${
                              !isStaying
                                ? "border-amber-200 bg-amber-50/50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30"
                                : ""
                            }`}
                          />
                        </div>

                        {/* Quick preset buttons */}
                        <div className="flex flex-wrap items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleApplyPreset(
                                p.id,
                                1,
                                0,
                                "Отпаднал на Ден 1 (без нощувка)"
                              )
                            }
                            className="h-6 px-1.5 text-[10px] text-amber-800 hover:bg-amber-100/60 dark:text-amber-300"
                          >
                            1 ден / 0 нощи
                          </Button>
                          {plannedDays >= 2 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleApplyPreset(
                                  p.id,
                                  2,
                                  1,
                                  "Отпаднал на Ден 2"
                                )
                              }
                              className="h-6 px-1.5 text-[10px] text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300"
                            >
                              2 дни / 1 нощ
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleApplyPreset(
                                p.id,
                                globalDays === ""
                                  ? plannedDays
                                  : Number(globalDays),
                                globalNights === ""
                                  ? plannedNights
                                  : Number(globalNights),
                                ""
                              )
                            }
                            className="h-6 px-1.5 text-[10px] text-blue-600 hover:bg-blue-50 dark:text-blue-400"
                          >
                            Пълно
                          </Button>
                        </div>
                      </div>

                      {/* Dropdown / Reason note */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] text-zinc-500">
                          Причина / Бележка за доклада:
                        </span>
                        <div className="flex flex-1 items-center gap-2">
                          <Select
                            value={p.note || "none"}
                            onValueChange={(v) =>
                              handlePersonChange(
                                p.id,
                                "note",
                                v === "none" ? "" : v
                              )
                            }
                          >
                            <SelectTrigger className="h-7 w-50 text-xs">
                              <SelectValue placeholder="Изберете причина" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">
                                Без специална бележка
                              </SelectItem>
                              {COMMON_REASONS.map((r) => (
                                <SelectItem key={r} value={r}>
                                  {r}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Input
                            placeholder="или въведете бележка тук..."
                            value={p.note}
                            onChange={(e) =>
                              handlePersonChange(p.id, "note", e.target.value)
                            }
                            className="h-7 flex-1 text-xs"
                          />
                        </div>
                      </div>

                      {/* Detail breakdown per person */}
                      <div className="text-[11px] text-zinc-500">
                        Дневни:{" "}
                        {isNoStay ? (
                          <span>
                            €{personRateEUR.toFixed(2)}{" "}
                            <span className="font-semibold text-amber-700 dark:text-amber-400">
                              (50% без нощувка)
                            </span>{" "}
                            × {days} д. ={" "}
                            <strong className="text-zinc-800 dark:text-zinc-200">
                              €{personDiem.toFixed(2)}
                            </strong>
                          </span>
                        ) : (
                          <span>
                            €{personRateEUR.toFixed(2)} × {days} д. ={" "}
                            <strong className="text-zinc-700 dark:text-zinc-300">
                              €{personDiem.toFixed(2)}
                            </strong>
                          </span>
                        )}
                        {accomEUR > 0 && (
                          <>
                            {" "}
                            • Квартирни:{" "}
                            {nights === 0 ? (
                              <span className="text-zinc-400">
                                0.00 € (0 нощи)
                              </span>
                            ) : (
                              <>
                                €{accomEUR.toFixed(2)} × {nights} н. ={" "}
                                <strong className="text-zinc-700 dark:text-zinc-300">
                                  €{personAccom.toFixed(2)}
                                </strong>
                              </>
                            )}
                          </>
                        )}
                        {isNoStay && (
                          <span className="ml-2 inline-flex items-center rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                            Без нощувка — 50% дневни
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Dynamic Report Section Preview */}
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3.5 text-xs dark:border-indigo-900/60 dark:bg-indigo-950/20">
            <div className="mb-1 flex items-center gap-1.5 font-semibold text-indigo-900 dark:text-indigo-200">
              <FileText className="size-4 text-indigo-600 dark:text-indigo-400" />
              Автоматично вписване в Доклада за командировка (Раздел 3):
            </div>
            <p className="whitespace-pre-line text-[11px] leading-relaxed text-indigo-800 dark:text-indigo-300">
              {reportStaySectionPreview}
            </p>
          </div>

          {/* Grand Total Summary */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-xs dark:border-emerald-900/60 dark:bg-emerald-950/30">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200 pb-2 dark:border-emerald-800">
              <span className="font-semibold text-emerald-900 dark:text-emerald-200">
                Преизчислена Ведомост ({activePeople.length} командировани
                лица):
              </span>
              <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                Общо: €{grandTotal.toFixed(2)} (
                {convertEurToBgn(grandTotal).toFixed(2)} лв.)
              </span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-emerald-700 sm:grid-cols-3 dark:text-emerald-400">
              <div>
                Дневни пари: <strong>€{grandDiem.toFixed(2)}</strong>
                <div className="text-[10px] text-emerald-600/80 dark:text-emerald-500">
                  ({convertEurToBgn(grandDiem).toFixed(2)} лв.)
                </div>
              </div>
              <div>
                Квартирни пари: <strong>€{grandAccom.toFixed(2)}</strong>
                <div className="text-[10px] text-emerald-600/80 dark:text-emerald-500">
                  ({convertEurToBgn(grandAccom).toFixed(2)} лв.)
                </div>
              </div>
              <div className="col-span-2 sm:col-span-1">
                Нощуващи лица: <strong>{stayingCount}</strong> / Без нощувка:{" "}
                <strong>{noStayCount}</strong>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="mr-auto text-xs text-muted-foreground"
          >
            <RotateCcw className="mr-1 size-3.5" />
            Възстанови планираните
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Отказ
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <Save className="mr-2 size-4" />
            {isSaving ? "Запазване..." : "Запази и преизчисли"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
