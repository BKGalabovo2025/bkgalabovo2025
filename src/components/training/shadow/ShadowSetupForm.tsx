/* eslint-disable sonarjs/cognitive-complexity, sonarjs/no-nested-conditional */
"use client";

import {
  Mic,
  Play,
  RotateCcw,
  Search,
  Settings2,
  Star,
  Target,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShadowPlayer, ShadowSettings } from "@/hooks/useShadowTrainer";
import { ZoneId } from "@/lib/shadow-training/audio-map";
import {
  calculateCourtAssignments,
  splitPlayersIntoWaves,
} from "@/lib/shadow-training/court-logistics";
import { shadowLogger } from "@/lib/shadow-training/shadow-logger";
import { resolveMemberAgeGroup } from "@/lib/utils";

import { CourtVisualizer } from "../CourtVisualizer";
import { MultiCourtGrid } from "./MultiCourtGrid";
import { QuickAddMemberDialog } from "./QuickAddMemberDialog";

interface ShadowSetupFormProps {
  initialMembers: ShadowPlayer[];
  settings: ShadowSettings;
  setSettings: React.Dispatch<React.SetStateAction<ShadowSettings>>;
  onStartTraining: () => void;
}

export function ShadowSetupForm({
  initialMembers,
  settings,
  setSettings,
  onStartTraining,
}: ShadowSetupFormProps) {
  const [playerSearchQuery, setPlayerSearchQuery] = useState("");
  const [playerFilterCategory, setPlayerFilterCategory] = useState<
    "all" | "u11" | "u13" | "u15" | "u17" | "adults"
  >("all");
  const [membersList, setMembersList] =
    useState<ShadowPlayer[]>(initialMembers);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [courtPreviewMode, setCourtPreviewMode] = useState<"half" | "full">(
    "half"
  );

  useEffect(() => {
    setMembersList(initialMembers);
  }, [initialMembers]);

  // Calculate preview zones for live court visualization in the configurator
  const previewZones = useMemo<ZoneId[]>(() => {
    const mode = settings.cornersMode;
    const drill = settings.drillMode;

    let baseZones: ZoneId[];
    if (mode === "2-corners") {
      if (drill === "back_only") {
        baseZones = ["backForehand", "backBackhand"];
      } else if (drill === "forehand_only") {
        baseZones = ["frontForehand", "backForehand"];
      } else if (drill === "backhand_only") {
        baseZones = ["frontBackhand", "backBackhand"];
      } else {
        baseZones = ["frontForehand", "frontBackhand"];
      }
    } else if (mode === "4-corners") {
      baseZones = [
        "frontForehand",
        "frontBackhand",
        "backForehand",
        "backBackhand",
      ];
    } else if (drill === "front_back") {
      baseZones = [
        "frontForehand",
        "frontBackhand",
        "backForehand",
        "backBackhand",
        "overhead",
      ];
    } else {
      baseZones = [
        "frontForehand",
        "frontBackhand",
        "midForehand",
        "midBackhand",
        "backForehand",
        "backBackhand",
        "overhead",
      ];
    }

    if (settings.drillPattern === "forehand-only") {
      return baseZones.filter((z) => z.toLowerCase().includes("forehand"));
    }
    if (settings.drillPattern === "backhand-only") {
      return baseZones.filter(
        (z) => z.toLowerCase().includes("backhand") || z === "overhead"
      );
    }
    return baseZones;
  }, [settings.cornersMode, settings.drillMode, settings.drillPattern]);

  const physicalCornersCount = useMemo(() => {
    const corners = new Set<string>();
    previewZones.forEach((z) => {
      if (z === "overhead" || z === "backBackhand") {
        corners.add("backLeft");
      } else {
        corners.add(z);
      }
    });
    return corners.size;
  }, [previewZones]);

  // Multi-court assignments & capacity calculation
  const courtLogistics = useMemo(() => {
    return calculateCourtAssignments(
      settings.activePlayers,
      settings.courtsAvailable,
      settings.courtAllocationStrategy
    );
  }, [
    settings.activePlayers,
    settings.courtsAvailable,
    settings.courtAllocationStrategy,
  ]);

  const handleStart = () => {
    setSettings((prev) => ({
      ...prev,
      centerCommandEnabled: true,
      deceptionEnabled: false,
      visualOnly: false,
    }));
    shadowLogger.setup(
      "Coach confirmed configuration, proceeding to Active Training Screen",
      {
        preset: settings.preset,
        mode: settings.mode,
        drillMode: settings.drillMode,
        cornersMode: settings.cornersMode,
        sets: settings.sets,
        workSec: settings.workSec,
        restSec: settings.restSec,
        paceSec: settings.paceSec,
        playersCount: settings.activePlayers.length,
        activePlayers: settings.activePlayers.map((p) => p.displayName),
      }
    );
    onStartTraining();
  };

  // Filtered members for quick selection
  const filteredPlayers = useMemo(() => {
    let list = membersList;
    if (playerFilterCategory !== "all") {
      list = list.filter((m) => {
        const ag = (m.ageGroup || resolveMemberAgeGroup(m) || "").toLowerCase();
        if (playerFilterCategory === "u11") {
          return ag.includes("u9") || ag.includes("u11");
        }
        if (playerFilterCategory === "u13") {
          return ag.includes("u13");
        }
        if (playerFilterCategory === "u15") {
          return ag.includes("u15");
        }
        if (playerFilterCategory === "u17") {
          return ag.includes("u17");
        }
        if (playerFilterCategory === "adults") {
          return (
            ag.includes("u19") ||
            ag.includes("17+") ||
            ag.includes("мъже") ||
            ag.includes("жени") ||
            ag.includes("adult")
          );
        }
        return true;
      });
    }

    if (!playerSearchQuery.trim()) return list;
    const q = playerSearchQuery.toLowerCase();
    return list.filter((m) => {
      const name = (
        m.displayName || `${m.firstName} ${m.lastName}`
      ).toLowerCase();
      return name.includes(q);
    });
  }, [membersList, playerFilterCategory, playerSearchQuery]);

  const handleMemberAdded = (newPlayer: ShadowPlayer, isClub: boolean) => {
    if (isClub) {
      setMembersList((prev) => {
        if (prev.some((p) => p.id === newPlayer.id)) return prev;
        return [newPlayer, ...prev];
      });
      setSettings((prev) => {
        if (prev.activePlayers.some((p) => p.id === newPlayer.id)) return prev;
        return {
          ...prev,
          activePlayers: [
            ...prev.activePlayers,
            {
              id: newPlayer.id,
              displayName:
                newPlayer.displayName ||
                `${newPlayer.firstName || ""} ${newPlayer.lastName || ""}`.trim() ||
                "Играч",
              ageGroup: newPlayer.ageGroup,
            },
          ],
        };
      });
    }
  };

  const handleSelectAllFiltered = () => {
    setSettings((prev) => {
      const newSelected = [...prev.activePlayers];
      filteredPlayers.forEach((p) => {
        if (!newSelected.some((x) => x.id === p.id)) {
          newSelected.push({
            id: p.id,
            displayName:
              p.displayName ||
              `${p.firstName || ""} ${p.lastName || ""}`.trim() ||
              "Играч",
            ageGroup: p.ageGroup,
          });
        }
      });
      return { ...prev, activePlayers: newSelected };
    });
  };

  const handleClearSelected = () => {
    setSettings((prev) => ({ ...prev, activePlayers: [] }));
  };

  return (
    <div className="relative flex size-full flex-col duration-300 animate-in fade-in">
      <div className="flex-1 space-y-6 overflow-visible pb-8">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-linear-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
              <Settings2 size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
                Интелигентен Настройчик
              </h1>
              <p className="text-sm font-medium text-zinc-500">
                Конфигурирайте параметрите, кортовете и състезателите за
                тренировката
              </p>
            </div>
          </div>
        </div>

        {/* ─── КАТЕГОРИЯ & ПАРАМЕТРИ ─── */}
        <Card className="overflow-hidden rounded-3xl border-2 border-zinc-100 shadow-sm dark:border-zinc-800">
          <div className="border-b border-zinc-100 bg-zinc-50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900/50">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <Users size={18} className="text-primary" /> Избор на Категория &
              Времеви Параметри
            </h2>
          </div>
          <CardContent className="p-6">
            {/* 5-те Международни Бадминтон Категории */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                {
                  id: "U9-U11",
                  title: "9 - 11 г.",
                  tag: "U9-U11",
                  sub: "Деца / Начинаещи",
                  standardName: "BWF Shuttle Time",
                  standardSummary: "2 серии • 30s • 4.0s",
                  defaults: {
                    sets: 2,
                    workSec: 30,
                    restSec: 60,
                    paceSec: 4.0,
                    cornersMode: "4-corners" as const,
                  },
                },
                {
                  id: "U11-U13",
                  title: "11 - 13 г.",
                  tag: "U11-U13",
                  sub: "Деца / Напреднали",
                  standardName: "BEC Development",
                  standardSummary: "3 серии • 40s • 3.0s",
                  defaults: {
                    sets: 3,
                    workSec: 40,
                    restSec: 45,
                    paceSec: 3.0,
                    cornersMode: "6-corners" as const,
                  },
                },
                {
                  id: "U13-U15",
                  title: "13 - 15 г.",
                  tag: "U13-U15",
                  sub: "Юноши & Девойки (Младша)",
                  standardName: "BWF Junior Circuit",
                  standardSummary: "3 серии • 45s • 2.5s",
                  defaults: {
                    sets: 3,
                    workSec: 45,
                    restSec: 30,
                    paceSec: 2.5,
                    cornersMode: "6-corners" as const,
                  },
                },
                {
                  id: "U15-U17",
                  title: "15 - 17 г.",
                  tag: "U15-U17",
                  sub: "Юноши & Девойки (Старша)",
                  standardName: "Asia & Euro Junior",
                  standardSummary: "4 серии • 45s • 2.0s",
                  defaults: {
                    sets: 4,
                    workSec: 45,
                    restSec: 30,
                    paceSec: 2.0,
                    cornersMode: "6-corners" as const,
                  },
                },
                {
                  id: "U17+",
                  title: "17+ г.",
                  tag: "U17+ / Елит",
                  sub: "Мъже & Жени / Елит",
                  standardName: "BWF World Tour / Asia",
                  standardSummary: "4 серии • 60s • 1.8s",
                  defaults: {
                    sets: 4,
                    workSec: 60,
                    restSec: 30,
                    paceSec: 1.8,
                    cornersMode: "6-corners" as const,
                  },
                },
              ].map((a) => {
                const isSelected = settings.ageGroup === a.id;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      shadowLogger.setup(
                        `Age group changed: ${a.title} (${a.tag})`,
                        {
                          ageGroup: a.id,
                          standard: a.standardName,
                          defaults: a.defaults,
                        }
                      );
                      setSettings((prev) => ({
                        ...prev,
                        ageGroup: a.id as ShadowSettings["ageGroup"],
                        sets: a.defaults.sets,
                        workSec: a.defaults.workSec,
                        restSec: a.defaults.restSec,
                        paceSec: a.defaults.paceSec,
                        cornersMode: a.defaults.cornersMode,
                        centerCommandEnabled: true,
                        deceptionEnabled: false,
                        visualOnly: false,
                      }));
                    }}
                    className={`group relative flex cursor-pointer flex-col justify-between rounded-2xl border-2 p-3.5 text-left transition-all ${
                      isSelected
                        ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-500/25 ring-2 ring-blue-500/20"
                        : "border-zinc-200 bg-white text-zinc-900 hover:border-blue-500/50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-black tracking-wider uppercase ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                          }`}
                        >
                          {a.tag}
                        </span>
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold ${
                            isSelected
                              ? "bg-white/10 text-blue-100"
                              : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                          }`}
                        >
                          {a.standardName.split(" ")[0]}
                        </span>
                      </div>
                      <h3 className="mt-2 text-xl font-black tracking-tight">
                        {a.title}
                      </h3>
                      <p
                        className={`mt-0.5 text-xs font-semibold leading-snug ${
                          isSelected
                            ? "text-blue-100"
                            : "text-zinc-600 dark:text-zinc-300"
                        }`}
                      >
                        {a.sub}
                      </p>
                      <p
                        className={`mt-1.5 text-[10px] font-medium leading-tight ${
                          isSelected ? "text-blue-100/90" : "text-zinc-400"
                        }`}
                      >
                        {a.standardName}
                      </p>
                    </div>

                    <div className="mt-3 border-t border-zinc-200/40 pt-2 dark:border-zinc-800/60">
                      <span
                        className={`block text-[10px] font-bold ${
                          isSelected
                            ? "text-white"
                            : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {a.standardSummary}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Пояснение за международните стандарти */}
            <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
              <span className="flex items-center gap-1.5 font-medium">
                <span>⚡</span>
                <span>
                  Стандартизирани стойности по BWF / BEC / Badminton Asia.
                  Можете да променяте всяка стойност ръчно:
                </span>
              </span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase text-zinc-500">
                  Серии
                </Label>
                {settings.mode === "agility_test" ? (
                  <div className="flex h-12 items-center rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm font-bold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                    1 серия (Контролен тест)
                  </div>
                ) : (
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    className="h-12 rounded-xl text-lg font-bold"
                    value={settings.sets}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        sets: parseInt(e.target.value) || 1,
                      }))
                    }
                  />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase text-zinc-500">
                    {settings.mode === "agility_test"
                      ? "Целеви движения"
                      : "Работа (сек)"}
                  </Label>
                  {settings.mode === "agility_test" && (
                    <span className="text-[10px] text-zinc-400">
                      норматив (напр. 20)
                    </span>
                  )}
                </div>
                <Input
                  type="number"
                  min={settings.mode === "agility_test" ? 5 : 10}
                  max={settings.mode === "agility_test" ? 100 : 300}
                  className="h-12 rounded-xl text-lg font-bold"
                  value={settings.workSec}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      workSec:
                        parseInt(e.target.value) ||
                        (settings.mode === "agility_test" ? 20 : 30),
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase text-zinc-500">
                  Почивка (сек)
                </Label>
                {settings.mode === "agility_test" ? (
                  <div className="flex h-12 items-center rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm font-bold text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500">
                    — (Спринт тест)
                  </div>
                ) : (
                  <Input
                    type="number"
                    min="5"
                    max="180"
                    className="h-12 rounded-xl text-lg font-bold"
                    value={settings.restSec}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        restSec: parseInt(e.target.value) || 30,
                      }))
                    }
                  />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase text-zinc-500">
                    {settings.mode === "agility_test"
                      ? "Реакция / Пауза (сек)"
                      : "Пауза / Темпо (сек)"}
                  </Label>
                  <span className="text-[10px] text-zinc-400">
                    изчакване след удар
                  </span>
                </div>
                <Input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="10"
                  className="h-12 rounded-xl text-lg font-bold"
                  value={settings.paceSec}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      paceSec: parseFloat(e.target.value) || 2,
                    }))
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── 3 КОЛОНИ: ЛОГИСТИКА, РЕЖИМ И КОНФИГУРАЦИЯ С ЖИВ ПРЕГЛЕД НА КОРТА ─── */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Col 1: Logistics & Toggles */}
          <div className="space-y-6">
            <Card className="flex h-full flex-col rounded-3xl border-2 border-zinc-100 shadow-sm dark:border-zinc-800">
              <div className="border-b border-zinc-100 bg-zinc-50 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                <h2 className="flex items-center gap-2 text-base font-bold">
                  <RotateCcw size={18} className="text-primary" /> Логистика на
                  корта
                </h2>
              </div>
              <CardContent className="flex flex-1 flex-col space-y-5 p-5">
                {/* 1. Брой свободни кортове */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold uppercase text-zinc-500">
                      Налични кортове в залата
                    </Label>
                    <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-black text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      {settings.courtsAvailable}{" "}
                      {settings.courtsAvailable === 1 ? "корт" : "корта"}
                    </span>
                  </div>
                  <div className="grid grid-cols-6 gap-1.5">
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() =>
                          setSettings((prev) => ({
                            ...prev,
                            courtsAvailable: num,
                          }))
                        }
                        className={`flex h-11 flex-col items-center justify-center rounded-xl border text-sm font-black transition-all ${
                          settings.courtsAvailable === num
                            ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                            : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Брой свободни физически бадминтон кортове в залата за
                    упражнението.
                  </p>
                </div>

                {/* 2. Използване на корта */}
                <div className="space-y-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                  <Label className="text-xs font-bold uppercase text-zinc-500">
                    Капацитет на корт
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          courtAllocationStrategy: "two_per_court",
                        }))
                      }
                      className={`flex flex-col gap-1 rounded-xl border p-2.5 text-left transition-all ${
                        (settings.courtAllocationStrategy ||
                          "two_per_court") === "two_per_court"
                          ? "border-blue-600 bg-blue-50/70 text-blue-700 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300"
                          : "border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-400"
                      }`}
                    >
                      <span className="text-xs font-bold leading-tight">
                        2 деца на корт
                      </span>
                      <span className="text-[10px] text-zinc-500 leading-tight">
                        Двете половини през мрежата
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          courtAllocationStrategy: "one_per_court",
                        }))
                      }
                      className={`flex flex-col gap-1 rounded-xl border p-2.5 text-left transition-all ${
                        settings.courtAllocationStrategy === "one_per_court"
                          ? "border-blue-600 bg-blue-50/70 text-blue-700 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300"
                          : "border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-400"
                      }`}
                    >
                      <span className="text-xs font-bold leading-tight">
                        1 дете на корт
                      </span>
                      <span className="text-[10px] text-zinc-500 leading-tight">
                        Максимум пространство (1/2 корт)
                      </span>
                    </button>
                  </div>
                </div>

                {/* 3. Жив капацитет статус */}
                <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-900/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-500">
                      Капацитет на залата:
                    </span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      до {courtLogistics.totalCapacity} едновременно
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-500">
                      Избрани за тренировка:
                    </span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {settings.activePlayers.length} състезатели
                    </span>
                  </div>
                  {settings.activePlayers.length >
                  courtLogistics.totalCapacity ? (
                    <div className="mt-2 space-y-1.5 rounded-lg bg-amber-500/10 p-2.5 text-[11px] text-amber-800 dark:text-amber-200">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span>⚡</span>
                        <span>
                          Всяка серия се провежда на{" "}
                          {
                            splitPlayersIntoWaves(
                              settings.activePlayers,
                              courtLogistics.totalCapacity
                            ).length
                          }{" "}
                          части (вълни):
                        </span>
                      </div>
                      <div className="space-y-1 pl-3 text-[10px] text-zinc-600 dark:text-zinc-300">
                        {splitPlayersIntoWaves(
                          settings.activePlayers,
                          courtLogistics.totalCapacity
                        ).map((wave, idx) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <span className="font-bold text-zinc-800 dark:text-zinc-200">
                              • Част {idx + 1}:
                            </span>
                            <span>
                              {wave.length}{" "}
                              {wave.length === 1 ? "дете" : "деца"} (
                              {wave
                                .map(
                                  (p) => p.displayName?.split(" ")[0] || "Играч"
                                )
                                .join(", ")}
                              )
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                        ✓ Всички {settings.activePlayers.length} деца правят
                        точно {settings.sets} серии с равно натоварване и
                        почивка!
                      </div>
                    </div>
                  ) : settings.activePlayers.length > 0 ? (
                    <div className="mt-2 rounded-lg bg-emerald-500/10 p-2 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                      ✓ Всички {settings.activePlayers.length} играят
                      едновременно!
                    </div>
                  ) : null}
                </div>

                <div className="space-y-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                  <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
                    <span className="text-base">🎯</span>
                    <div>
                      <strong>Команда „Център!“ (Задължителна):</strong> Гласова
                      команда и светлинна индикация за незабавно прибиране и
                      подготовка за следващия удар.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Col 2: Mode & Callouts */}
          <div className="space-y-6">
            <Card className="flex h-full flex-col rounded-3xl border-2 border-zinc-100 shadow-sm dark:border-zinc-800">
              <div className="border-b border-zinc-100 bg-zinc-50 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                <h2 className="flex items-center gap-2 text-base font-bold">
                  <Zap size={18} className="text-primary" /> Режим на игра
                </h2>
              </div>
              <CardContent className="flex flex-1 flex-col space-y-4 p-5">
                <div className="flex flex-col gap-2">
                  {[
                    {
                      id: "standard",
                      title: "Стандартен тренировъчен",
                      desc: "Серии, работа и почивка с фиксирани интервали",
                      badge: "Интервален ритъм",
                    },
                    {
                      id: "agility_test",
                      title: "Тест за бързина (Agility Test)",
                      desc: "Спринт норматив за брой движения срещу хронометъра",
                      badge: "Хронометър",
                    },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        shadowLogger.setup(
                          `Training mode selected: ${m.title}`,
                          {
                            mode: m.id,
                          }
                        );
                        if (m.id === "agility_test") {
                          setSettings((prev) => ({
                            ...prev,
                            mode: "agility_test",
                            sets: 1,
                            workSec:
                              prev.workSec > 50 || prev.workSec < 5
                                ? 20
                                : prev.workSec,
                            restSec: 0,
                            paceSec: prev.paceSec > 2.5 ? 1.5 : prev.paceSec,
                          }));
                        } else {
                          setSettings((prev) => ({
                            ...prev,
                            mode: "standard",
                            sets: prev.sets === 1 ? 3 : prev.sets,
                            workSec: prev.workSec === 20 ? 45 : prev.workSec,
                            restSec: prev.restSec === 0 ? 30 : prev.restSec,
                            paceSec: prev.paceSec === 1.5 ? 2.5 : prev.paceSec,
                          }));
                        }
                      }}
                      className={`flex w-full cursor-pointer flex-col gap-0.5 rounded-xl border-2 px-4 py-3 text-left transition-all ${
                        settings.mode === m.id
                          ? "border-blue-600 bg-blue-50/70 text-blue-700 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300"
                          : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold leading-tight">
                          {m.title}
                        </span>
                        <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                          {m.badge}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-zinc-500">
                        {m.desc}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Callout Mode */}
                <div className="space-y-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                  <Label className="flex items-center gap-1 text-xs font-bold uppercase text-zinc-500">
                    <Mic size={12} /> Тип на гласовите команди
                  </Label>
                  <div className="flex flex-col gap-1.5">
                    {[
                      {
                        id: "zones",
                        label: "Само зони",
                        icon: "🎯",
                        desc: '"Форхенд мрежа" – позициониране',
                      },
                      {
                        id: "shots",
                        label: "Само удари",
                        icon: "🏸",
                        desc: '"Клиър права" – технически удар',
                      },
                      {
                        id: "zones_and_shots",
                        label: "Зони + Удари",
                        icon: "📢",
                        desc: "Зона, следвана от удара – пълна информация",
                      },
                    ].map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          shadowLogger.setup(
                            `Callout mode changed to: ${c.label} (${c.id})`,
                            { calloutMode: c.id }
                          );
                          setSettings((prev) => ({
                            ...prev,
                            calloutMode: c.id as ShadowSettings["calloutMode"],
                          }));
                        }}
                        className={`flex w-full flex-col gap-0.5 rounded-xl border px-3 py-2.5 text-left transition-all ${
                          settings.calloutMode === c.id
                            ? "border-blue-600 bg-blue-50/70 dark:border-blue-500 dark:bg-blue-950/40"
                            : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                        }`}
                      >
                        <span
                          className={`flex items-center gap-1.5 text-sm font-bold leading-tight ${
                            settings.calloutMode === c.id
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-zinc-700 dark:text-zinc-300"
                          }`}
                        >
                          <span>{c.icon}</span>
                          {c.label}
                        </span>
                        <span className="text-xs leading-tight text-zinc-500">
                          {c.desc}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300">
                    <span className="text-base">🎙️</span>
                    <div>
                      <strong>Пълен гласов асистент:</strong> Всички команди за
                      зони, удари и прибиране в центъра се изговарят изцяло с
                      естествен човешки глас. Темпото (
                      <strong>{settings.paceSec} сек</strong>) е паузата за
                      изчакване след като всички команди приключат.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Col 3: Court Config with Interactive Preview */}
          <div className="space-y-6">
            <Card className="flex h-full flex-col rounded-3xl border-2 border-zinc-100 shadow-sm dark:border-zinc-800">
              <div className="border-b border-zinc-100 bg-zinc-50 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                <h2 className="flex items-center gap-2 text-base font-bold">
                  <Target size={18} className="text-primary" /> Конфигурация на
                  корта
                </h2>
              </div>
              <CardContent className="flex flex-1 flex-col space-y-4 p-5">
                {/* Corners Mode */}
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Ъгли на корта
                  </Label>
                  <div className="flex w-full gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-900">
                    <button
                      type="button"
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          cornersMode: "2-corners",
                          drillMode:
                            prev.drillMode === "all" ||
                            prev.drillMode === "front_back"
                              ? "front_only"
                              : prev.drillMode,
                        }))
                      }
                      className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
                        settings.cornersMode === "2-corners"
                          ? "bg-white text-blue-600 shadow-xs dark:bg-zinc-800 dark:text-white"
                          : "text-zinc-500"
                      }`}
                    >
                      2 Ъгъла
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          cornersMode: "4-corners",
                          drillMode: "all",
                        }))
                      }
                      className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
                        settings.cornersMode === "4-corners"
                          ? "bg-white text-blue-600 shadow-xs dark:bg-zinc-800 dark:text-white"
                          : "text-zinc-500"
                      }`}
                    >
                      4 Ъгъла
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          cornersMode: "6-corners",
                          drillMode: "all",
                        }))
                      }
                      className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
                        settings.cornersMode === "6-corners"
                          ? "bg-white text-blue-600 shadow-xs dark:bg-zinc-800 dark:text-white"
                          : "text-zinc-500"
                      }`}
                    >
                      6 Ъгъла
                    </button>
                  </div>
                </div>

                {/* Drill Mode */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Насоченост на зоните
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      if (settings.cornersMode === "2-corners") {
                        return [
                          { id: "front_only", title: "Само мрежа" },
                          { id: "back_only", title: "Задна линия" },
                          { id: "forehand_only", title: "Само форхенд поле" },
                          { id: "backhand_only", title: "Само бекхенд поле" },
                        ];
                      }
                      if (settings.cornersMode === "4-corners") {
                        return [{ id: "all", title: "Цял корт (4 ъгъла)" }];
                      }
                      return [{ id: "all", title: "Цял корт (6 ъгъла)" }];
                    })().map((z) => (
                      <button
                        key={z.id}
                        type="button"
                        onClick={() =>
                          setSettings((prev) => ({
                            ...prev,
                            drillMode: z.id as ShadowSettings["drillMode"],
                          }))
                        }
                        className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${
                          settings.drillMode === z.id
                            ? "border-transparent bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                            : "border-zinc-300 bg-transparent text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
                        }`}
                      >
                        {z.title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Drill Pattern */}
                <div className="space-y-2 border-t border-zinc-100 pt-2 dark:border-zinc-800">
                  <Label className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-zinc-500">
                    <Star size={12} /> Шаблон на движение
                  </Label>
                  <div className="flex flex-col gap-1.5">
                    {[
                      {
                        id: "random",
                        label: "Случаен",
                        icon: "🎲",
                        desc: "Всички зони без фиксиран ред",
                      },
                      {
                        id: "fixed-triangle",
                        label: "Триъгълник",
                        icon: "🔺",
                        desc: "Мрежа ↔ среда ↔ задна линия",
                      },
                      {
                        id: "fixed-net-back",
                        label: "Мрежа ↔ Задна",
                        icon: "↕️",
                        desc: "Смяна предна и задна линия",
                      },
                      {
                        id: "forehand-only",
                        label: "Само форхенд поле",
                        icon: "🏸",
                        desc: "Команди само от форхенд страната",
                      },
                      {
                        id: "backhand-only",
                        label: "Само бекхенд поле",
                        icon: "🛡️",
                        desc: "Команди само от бекхенд страната",
                      },
                    ].map((p) => {
                      const isSelected = settings.drillPattern === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            shadowLogger.setup(
                              `Drill pattern selected: ${p.label}`,
                              { pattern: p.id }
                            );
                            setSettings((prev) => ({
                              ...prev,
                              drillPattern:
                                p.id as ShadowSettings["drillPattern"],
                            }));
                          }}
                          className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left transition-all ${
                            isSelected
                              ? "border-blue-600 bg-blue-50/80 text-blue-900 dark:border-blue-500 dark:bg-blue-950/50 dark:text-blue-200 ring-1 ring-blue-500/30 shadow-xs"
                              : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-base dark:bg-zinc-800">
                              {p.icon}
                            </span>
                            <div className="min-w-0 flex-1">
                              <span className="block text-xs font-bold leading-tight text-zinc-900 dark:text-zinc-100">
                                {p.label}
                              </span>
                              <span className="block text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight">
                                {p.desc}
                              </span>
                            </div>
                          </div>
                          <div className="ml-2 shrink-0">
                            <div
                              className={`flex size-4 items-center justify-center rounded-full border transition-all ${
                                isSelected
                                  ? "border-blue-600 bg-blue-600 text-white"
                                  : "border-zinc-300 dark:border-zinc-700"
                              }`}
                            >
                              {isSelected && (
                                <div className="size-1.5 rounded-full bg-white" />
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Live Court Preview */}
                <div className="mt-2 flex flex-col items-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="mb-2.5 flex w-full items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                      Активни тренировъчни зони
                    </span>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 shrink-0 dark:bg-blue-950 dark:text-blue-300">
                      {physicalCornersCount}{" "}
                      {physicalCornersCount === 1 ? "ъгъл" : "ъгъла"} + Център
                    </span>
                  </div>

                  <div className="mb-3 flex w-full gap-1 rounded-xl bg-zinc-200/70 p-1 dark:bg-zinc-900">
                    <button
                      type="button"
                      onClick={() => setCourtPreviewMode("half")}
                      className={`flex-1 rounded-lg py-1.5 text-[11px] font-bold transition-all ${
                        courtPreviewMode === "half"
                          ? "bg-white text-blue-600 shadow-xs dark:bg-zinc-800 dark:text-white"
                          : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                      }`}
                    >
                      1/2 Корт
                    </button>
                    <button
                      type="button"
                      onClick={() => setCourtPreviewMode("full")}
                      className={`flex-1 rounded-lg py-1.5 text-[11px] font-bold transition-all ${
                        courtPreviewMode === "full"
                          ? "bg-white text-blue-600 shadow-xs dark:bg-zinc-800 dark:text-white"
                          : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                      }`}
                    >
                      Цял корт
                    </button>
                  </div>

                  <div className="flex w-full items-center justify-center">
                    <CourtVisualizer
                      previewZones={previewZones}
                      viewMode={courtPreviewMode}
                      allowToggleView={false}
                      className={
                        courtPreviewMode === "full"
                          ? "max-h-95 w-auto"
                          : "max-w-64 w-full"
                      }
                    />
                  </div>
                  <span className="mt-2 text-center text-[11px] font-medium text-zinc-500">
                    {courtPreviewMode === "half"
                      ? "Показва се тренировъчната половина (от мрежата до задна линия)."
                      : "Показва се целият корт с разпределение на активните зони."}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ─── СЕЛЕКТОР НА ИГРАЧИ С БЪРЗИ ФИЛТРИ ─── */}
        <Card className="rounded-3xl border-2 border-zinc-100 shadow-sm dark:border-zinc-800">
          <div className="flex flex-col gap-3 border-b border-zinc-100 bg-zinc-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-900/50">
            <div>
              <h2 className="flex items-center gap-2 text-base font-bold">
                <Users size={18} className="text-primary" /> Присъстващи
                състезатели
              </h2>
              <p className="text-xs text-zinc-500">
                Маркирайте състезателите в залата. Ротацията ще ги разпределя
                автоматично.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-xl bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                {settings.activePlayers.length} избрани
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddMemberOpen(true)}
                className="h-8 rounded-xl border-dashed border-blue-400 bg-blue-50/50 text-xs font-semibold text-blue-700 hover:bg-blue-100 hover:text-blue-800 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50"
              >
                <UserPlus size={14} className="mr-1" />
                Добави състезател / външен
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAllFiltered}
                className="h-8 rounded-xl text-xs"
              >
                Маркирай показаните ({filteredPlayers.length})
              </Button>
              {settings.activePlayers.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSelected}
                  className="h-8 rounded-xl text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  Изчисти всички
                </Button>
              )}
            </div>
          </div>

          <CardContent className="space-y-4 p-5">
            {/* Search & Category Tabs */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  value={playerSearchQuery}
                  onChange={(e) => setPlayerSearchQuery(e.target.value)}
                  placeholder="Търсене на играч по име..."
                  className="h-10 rounded-xl pl-9 text-xs"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: "all", label: "Всички" },
                  { id: "u11", label: "9-11 г." },
                  { id: "u13", label: "11-13 г." },
                  { id: "u15", label: "13-15 г." },
                  { id: "u17", label: "15-17 г." },
                  { id: "adults", label: "17+ / Мъже / Жени" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() =>
                      setPlayerFilterCategory(
                        cat.id as
                          "all" | "u11" | "u13" | "u15" | "u17" | "adults"
                      )
                    }
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                      playerFilterCategory === cat.id
                        ? "bg-zinc-900 text-white shadow-xs dark:bg-white dark:text-zinc-900"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Players Grid */}
            {filteredPlayers.length === 0 ? (
              <p className="p-8 text-center text-sm text-zinc-500">
                Няма намерени играчи за избрания критерий.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                {filteredPlayers.map((m) => {
                  const isChecked = settings.activePlayers.some(
                    (p) => p.id === m.id
                  );
                  return (
                    <label
                      key={m.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition-all ${
                        isChecked
                          ? "border-blue-600 bg-blue-50/70 shadow-xs dark:border-blue-500 dark:bg-blue-950/40"
                          : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                      }`}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          const pName =
                            m.displayName ||
                            `${m.firstName || ""} ${m.lastName || ""}`.trim();
                          if (!checked) {
                            shadowLogger.setup(
                              `Player removed from drill: ${pName}`
                            );
                            setSettings((prev) => ({
                              ...prev,
                              activePlayers: prev.activePlayers.filter(
                                (p) => p.id !== m.id
                              ),
                            }));
                          } else {
                            shadowLogger.setup(
                              `Player added to drill: ${pName}`
                            );
                            setSettings((prev) => ({
                              ...prev,
                              activePlayers: [
                                ...prev.activePlayers,
                                {
                                  id: m.id,
                                  displayName: pName,
                                  ageGroup:
                                    m.ageGroup || resolveMemberAgeGroup(m),
                                },
                              ],
                            }));
                          }
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <span
                          className={`block text-xs font-bold leading-snug ${
                            isChecked
                              ? "text-blue-700 dark:text-blue-300"
                              : "text-zinc-800 dark:text-zinc-200"
                          }`}
                        >
                          {m.displayName || `${m.firstName} ${m.lastName}`}
                        </span>
                        {(() => {
                          const ag = m.ageGroup || resolveMemberAgeGroup(m);
                          if (!ag) return null;
                          return (
                            <span className="mt-0.5 inline-block rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                              {ag}
                            </span>
                          );
                        })()}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── ТАКТИЧЕСКО РАЗПРЕДЕЛЕНИЕ ПО КОРТОВЕ В ЗАЛАТА ─── */}
        <Card className="rounded-3xl border-2 border-zinc-100 shadow-sm dark:border-zinc-800">
          <div className="flex flex-col gap-2 border-b border-zinc-100 bg-zinc-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏸</span>
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                  Разпределение по кортове в залата ({settings.courtsAvailable}{" "}
                  {settings.courtsAvailable === 1 ? "корт" : "корта"})
                </h2>
                <p className="text-xs text-zinc-500">
                  {settings.activePlayers.length === 0
                    ? "Маркирайте състезатели по-горе, за да видите разпределението им по кортовете."
                    : "Автоматично разпределени състезатели за Серия 1:"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                {courtLogistics.activePlayers.length} активни на кортовете
              </span>
              {courtLogistics.restingPlayers.length > 0 && (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                  {courtLogistics.restingPlayers.length} почиващи
                </span>
              )}
            </div>
          </div>
          <CardContent className="space-y-5 p-5">
            <MultiCourtGrid
              slots={courtLogistics.slots}
              previewZones={previewZones}
            />

            {/* Почиващи състезатели на пейката */}
            {courtLogistics.restingPlayers.length > 0 && (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                  <span>
                    ⏸️ Чакащи състезатели (влизат на корта във втората част на
                    всяка серия):
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {courtLogistics.restingPlayers.map((p) => (
                    <span
                      key={p.id}
                      className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-800 dark:text-amber-200"
                    >
                      {p.displayName}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── СТАРТ БУТОН ─── */}
        <div className="mt-auto flex w-full shrink-0 justify-center p-4">
          <Button
            onClick={handleStart}
            className="group relative flex h-auto min-h-14 w-full max-w-xl cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-2xl bg-linear-to-r from-blue-600 via-indigo-600 to-blue-700 px-6 py-3.5 text-center text-sm font-black uppercase tracking-wider text-white shadow-xl shadow-blue-500/25 transition-all hover:scale-1.01 hover:shadow-2xl hover:shadow-blue-500/35 active:scale-0.99 sm:min-h-16 sm:gap-3 sm:text-base md:text-lg whitespace-normal"
          >
            <Play className="size-5 shrink-0 fill-current transition-transform group-hover:scale-110 sm:size-6" />
            <span className="leading-tight text-balance">
              ГОТОВНОСТ ЗА СТАРТ НА ТРЕНИРОВКАТА
            </span>
          </Button>
        </div>

        {/* Quick Add Member Dialog */}
        <QuickAddMemberDialog
          open={isAddMemberOpen}
          onOpenChange={setIsAddMemberOpen}
          onMemberAdded={handleMemberAdded}
        />
      </div>
    </div>
  );
}
