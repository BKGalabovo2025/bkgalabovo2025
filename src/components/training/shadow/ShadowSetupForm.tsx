"use client";

import {
  CheckCircle2,
  Flame,
  Mic,
  Play,
  RotateCcw,
  Search,
  Settings2,
  Shield,
  Sparkles,
  Star,
  Swords,
  Target,
  Users,
  Zap,
} from "lucide-react";
import React, { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShadowPlayer, ShadowSettings } from "@/hooks/useShadowTrainer";
import { ZoneId } from "@/lib/shadow-training/audio-map";
import { shadowLogger } from "@/lib/shadow-training/shadow-logger";

import { CourtVisualizer } from "../CourtVisualizer";

interface ShadowSetupFormProps {
  initialMembers: ShadowPlayer[];
  settings: ShadowSettings;
  setSettings: (s: ShadowSettings) => void;
  onStartTraining: () => void;
}

interface ToggleButtonProps {
  enabled: boolean;
  onClick: () => void;
  label: string;
  desc: string;
  colorClass: "orange" | "blue" | "red" | "green" | "purple";
  bgClass: string;
}

function getToggleBorderClass(
  enabled: boolean,
  colorClass: ToggleButtonProps["colorClass"]
) {
  if (!enabled) {
    return "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300";
  }
  switch (colorClass) {
    case "orange":
      return "border-orange-500 bg-orange-500/10 text-orange-700 dark:text-orange-400";
    case "red":
      return "border-red-500 bg-red-500/10 text-red-700 dark:text-red-400";
    case "purple":
      return "border-purple-500 bg-purple-500/10 text-purple-700 dark:text-purple-400";
    default:
      return "border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-400";
  }
}

function ToggleButton({
  enabled,
  onClick,
  label,
  desc,
  colorClass,
  bgClass,
}: ToggleButtonProps) {
  const borderClass = getToggleBorderClass(enabled, colorClass);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onClick}
      className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border-2 p-3 text-left transition-colors ${borderClass}`}
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-bold leading-tight">{label}</span>
        <span className="mt-0.5 text-xs leading-tight text-zinc-500">
          {desc}
        </span>
      </div>
      <div
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${enabled ? bgClass : "bg-zinc-300 dark:bg-zinc-700"}`}
      >
        <div
          className={`absolute top-1 size-4 rounded-full bg-white transition-all ${enabled ? "left-6" : "left-1"}`}
        />
      </div>
    </button>
  );
}

// ─── 1-Клик Треньорски Пресети ─────────────────────────────────
const SMART_PRESETS = [
  {
    id: "warmup",
    title: "Крачна Загрявка",
    subtitle: "Активация & Основни Стъпки",
    icon: Flame,
    color: "from-amber-500 to-orange-500",
    badge: "2 серии • 3.5s темпо",
    desc: "Раздвижване на глезени и базова координация по 4 ъгъла",
    config: {
      mode: "standard" as const,
      preset: "warmup",
      sets: 2,
      workSec: 30,
      restSec: 45,
      paceSec: 3.5,
      cornersMode: "4-corners" as const,
      drillMode: "all" as const,
      drillPattern: "random" as const,
      calloutMode: "zones" as const,
      deceptionEnabled: false,
      centerCommandEnabled: true,
    },
  },
  {
    id: "smash_net",
    title: "Смаш & Мрежа",
    subtitle: "Атакуващ ритъм & Преса",
    icon: Sparkles,
    color: "from-red-500 to-rose-600",
    badge: "4 серии • 2.2s темпо",
    desc: "Задна линия (смаш/клиър) с експлозивно дотичване на мрежата",
    config: {
      mode: "standard" as const,
      preset: "smash_net",
      sets: 4,
      workSec: 45,
      restSec: 30,
      paceSec: 2.2,
      cornersMode: "4-corners" as const,
      drillMode: "all" as const,
      drillPattern: "fixed-net-back" as const,
      calloutMode: "zones_and_shots" as const,
      deceptionEnabled: false,
      centerCommandEnabled: true,
    },
  },
  {
    id: "defense_drives",
    title: "Защита & Среда",
    subtitle: "Блокове, Флатове & Реакция",
    icon: Shield,
    color: "from-blue-600 to-indigo-600",
    badge: "3 серии • 2.0s темпо",
    desc: "Бърза защита в средата и ъглите с 15% децепционна изненада",
    config: {
      mode: "standard" as const,
      preset: "defense_drives",
      sets: 3,
      workSec: 40,
      restSec: 30,
      paceSec: 2.0,
      cornersMode: "6-corners" as const,
      drillMode: "all" as const,
      drillPattern: "random" as const,
      calloutMode: "shots" as const,
      deceptionEnabled: true,
      centerCommandEnabled: true,
    },
  },
  {
    id: "ghost_match",
    title: "Мач на Сенки",
    subtitle: "Симулация на Реален Гейм",
    icon: Swords,
    color: "from-purple-600 to-pink-600",
    badge: "Динамично темпо 0.6x-1.3x",
    desc: "Непредвидими разигравания, редуване на бавни и спринтови удари",
    config: {
      mode: "ghost_match" as const,
      preset: "ghost_match",
      sets: 3,
      workSec: 60,
      restSec: 45,
      paceSec: 2.5,
      cornersMode: "6-corners" as const,
      drillMode: "all" as const,
      drillPattern: "mixed" as const,
      calloutMode: "zones_and_shots" as const,
      deceptionEnabled: true,
      centerCommandEnabled: true,
    },
  },
  {
    id: "agility_sprint",
    title: "Спринт за Бързина",
    subtitle: "Тест 20 Движения",
    icon: Zap,
    color: "from-emerald-500 to-teal-600",
    badge: "20 движения • Макс Скорост",
    desc: "Спринтов хронометър за скоростна издръжливост и реакция",
    config: {
      mode: "agility_test" as const,
      preset: "agility_sprint",
      sets: 1,
      workSec: 20,
      restSec: 60,
      paceSec: 1.5,
      cornersMode: "6-corners" as const,
      drillMode: "all" as const,
      drillPattern: "random" as const,
      calloutMode: "zones" as const,
      deceptionEnabled: false,
      centerCommandEnabled: false,
    },
  },
  {
    id: "kids_footwork",
    title: "Детска Координация",
    subtitle: "За Най-Малките (U9-U11)",
    icon: CheckCircle2,
    color: "from-amber-400 to-yellow-500",
    badge: "2 серии • 4.0s темпо",
    desc: "Позициониране със спокойни гласови напътствия и широк интервал",
    config: {
      mode: "standard" as const,
      preset: "kids_footwork",
      ageGroup: "U9-U11" as const,
      sets: 2,
      workSec: 30,
      restSec: 60,
      paceSec: 4.0,
      cornersMode: "4-corners" as const,
      drillMode: "all" as const,
      drillPattern: "random" as const,
      calloutMode: "zones" as const,
      deceptionEnabled: false,
      centerCommandEnabled: true,
    },
  },
];

export function ShadowSetupForm({
  initialMembers,
  settings,
  setSettings,
  onStartTraining,
}: ShadowSetupFormProps) {
  const [playerSearchQuery, setPlayerSearchQuery] = useState("");
  const [playerFilterCategory, setPlayerFilterCategory] = useState<
    "all" | "u11" | "u15" | "u17"
  >("all");

  // Calculate preview zones for live court visualization in the configurator
  const previewZones = useMemo<ZoneId[]>(() => {
    const mode = settings.cornersMode;
    const drill = settings.drillMode;

    if (mode === "2-corners") {
      if (drill === "back_only") return ["backForehand", "backBackhand"];
      return ["frontForehand", "frontBackhand"];
    }
    if (mode === "4-corners") {
      return ["frontForehand", "frontBackhand", "backForehand", "backBackhand"];
    }
    // 6-corners
    if (drill === "front_back") {
      return [
        "frontForehand",
        "frontBackhand",
        "backForehand",
        "backBackhand",
        "overhead",
      ];
    }
    return [
      "frontForehand",
      "frontBackhand",
      "midForehand",
      "midBackhand",
      "backForehand",
      "backBackhand",
      "overhead",
    ];
  }, [settings.cornersMode, settings.drillMode]);

  // Apply a smart preset
  const handleApplyPreset = (presetId: string) => {
    const p = SMART_PRESETS.find((x) => x.id === presetId);
    if (!p) return;
    shadowLogger.setup(`Preset selected: ${p.title} (${p.badge})`, p.config);
    setSettings({
      ...settings,
      ...p.config,
    });
  };

  const handleStart = () => {
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
    let list = initialMembers;
    if (playerFilterCategory !== "all") {
      list = list.filter((m) => {
        const ag = (m.ageGroup || "").toLowerCase();
        if (playerFilterCategory === "u11") {
          return ag.includes("u9") || ag.includes("u11");
        }
        if (playerFilterCategory === "u15") {
          return ag.includes("u13") || ag.includes("u15");
        }
        if (playerFilterCategory === "u17") {
          return (
            ag.includes("u17") ||
            ag.includes("u19") ||
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
  }, [initialMembers, playerFilterCategory, playerSearchQuery]);

  const handleSelectAllFiltered = () => {
    const newSelected = [...settings.activePlayers];
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
    setSettings({ ...settings, activePlayers: newSelected });
  };

  const handleClearSelected = () => {
    setSettings({ ...settings, activePlayers: [] });
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
                Конфигурирайте тренировката с 1 клик или персонализирайте
                параметрите
              </p>
            </div>
          </div>
        </div>

        {/* ─── 1-КЛИК ТРЕНЬОРСКИ ПРОГРАМИ (SMART PRESETS) ─── */}
        <Card className="overflow-hidden rounded-3xl border-2 border-zinc-100 bg-linear-to-b from-zinc-50/50 to-white shadow-sm dark:border-zinc-800 dark:from-zinc-900/40 dark:to-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/80 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900/80">
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-amber-500" />
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                1-Клик Треньорски Програми (Готови Пресети)
              </h2>
            </div>
            <span className="text-xs font-semibold text-zinc-500">
              Изберете дрил за автоматично конфигуриране
            </span>
          </div>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {SMART_PRESETS.map((p) => {
                const IconComponent = p.icon;
                const isSelected = settings.preset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleApplyPreset(p.id)}
                    className={`group relative flex cursor-pointer flex-col justify-between rounded-2xl border-2 p-4 text-left transition-all hover:shadow-md ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/60 shadow-md ring-2 ring-blue-500/20 dark:border-blue-500 dark:bg-blue-950/30"
                        : "border-zinc-200/80 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div
                          className={`flex size-10 items-center justify-center rounded-xl bg-linear-to-br ${p.color} text-white shadow-sm`}
                        >
                          <IconComponent size={20} />
                        </div>
                        <Badge
                          variant="secondary"
                          className="rounded-lg text-[10px] font-bold"
                        >
                          {p.badge}
                        </Badge>
                      </div>
                      <h3 className="mt-3 text-base font-black text-zinc-900 dark:text-white">
                        {p.title}
                      </h3>
                      <p className="text-xs font-medium text-zinc-500">
                        {p.subtitle}
                      </p>
                      <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                        {p.desc}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center gap-1.5 pt-2 text-[11px] font-bold text-blue-600 dark:text-blue-400">
                      {isSelected
                        ? "✓ Активна програма"
                        : "Приложи програмата →"}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ─── КАТЕГОРИЯ & ПАРАМЕТРИ ─── */}
        <Card className="overflow-hidden rounded-3xl border-2 border-zinc-100 shadow-sm dark:border-zinc-800">
          <div className="border-b border-zinc-100 bg-zinc-50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900/50">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <Users size={18} className="text-primary" /> Избор на Категория &
              Времеви Параметри
            </h2>
          </div>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { id: "U9-U11", title: "U9 - U11", sub: "Деца / Начинаещи" },
                { id: "U13-U15", title: "U13 - U15", sub: "Юноши / Младша" },
                {
                  id: "U17+",
                  title: "U17+",
                  sub: "Старша възраст / Мъже / Жени",
                },
              ].map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    const newSettings = {
                      ...settings,
                      ageGroup: a.id as ShadowSettings["ageGroup"],
                    };
                    if (a.id === "U9-U11") {
                      newSettings.cornersMode = "4-corners";
                      newSettings.workSec = 30;
                      newSettings.restSec = 60;
                      newSettings.paceSec = 4.0;
                      newSettings.deceptionEnabled = false;
                    } else if (a.id === "U13-U15") {
                      newSettings.workSec = 45;
                      newSettings.restSec = 30;
                      newSettings.paceSec = 3.0;
                    } else {
                      newSettings.workSec = 60;
                      newSettings.restSec = 30;
                      newSettings.paceSec = 2.0;
                    }
                    setSettings(newSettings);
                  }}
                  className={`cursor-pointer rounded-2xl border-2 p-5 text-left transition-all ${
                    settings.ageGroup === a.id
                      ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                      : "border-zinc-200 bg-white text-zinc-900 hover:border-blue-500/50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                  }`}
                >
                  <h3 className="text-2xl font-black">{a.title}</h3>
                  <p
                    className={`mt-1 text-sm font-medium ${settings.ageGroup === a.id ? "text-blue-100" : "text-zinc-500"}`}
                  >
                    {a.sub}
                  </p>
                </button>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase text-zinc-500">
                  Серии
                </Label>
                <Input
                  type="number"
                  className="h-12 rounded-xl text-lg font-bold"
                  value={settings.sets}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      sets: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase text-zinc-500">
                  {settings.mode === "agility_test"
                    ? "Брой движения"
                    : "Работа (сек)"}
                </Label>
                <Input
                  type="number"
                  className="h-12 rounded-xl text-lg font-bold"
                  value={settings.workSec}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      workSec: parseInt(e.target.value) || 30,
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold uppercase text-zinc-500">
                  Почивка (сек)
                </Label>
                <Input
                  type="number"
                  className="h-12 rounded-xl text-lg font-bold"
                  value={settings.restSec}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      restSec: parseInt(e.target.value) || 30,
                    })
                  }
                />
              </div>
              <div
                className={`space-y-1 ${settings.mode === "ghost_match" ? "pointer-events-none opacity-40" : "opacity-100"}`}
              >
                <Label className="text-xs font-bold uppercase text-zinc-500">
                  Темпо (сек) {settings.mode === "ghost_match" && "(АВТО)"}
                </Label>
                <Input
                  type="number"
                  step="0.5"
                  disabled={settings.mode === "ghost_match"}
                  className="h-12 rounded-xl text-lg font-bold"
                  value={settings.paceSec}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      paceSec: parseFloat(e.target.value) || 3,
                    })
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
                <div className="space-y-1">
                  <Label className="text-xs font-bold uppercase text-zinc-500">
                    Налични кортове в залата
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    max="12"
                    className="h-12 rounded-xl text-lg font-bold"
                    value={settings.courtsAvailable}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        courtsAvailable: parseInt(e.target.value) || 1,
                      })
                    }
                  />
                  <p className="text-[11px] text-zinc-500">
                    Определя колко играчи ще работят едновременно на корта във
                    всяка серия.
                  </p>
                </div>

                <div className="space-y-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                  <Label className="text-xs font-bold uppercase text-zinc-500">
                    Треньорски Модификатори
                  </Label>

                  <ToggleButton
                    enabled={settings.centerCommandEnabled}
                    onClick={() =>
                      setSettings({
                        ...settings,
                        centerCommandEnabled: !settings.centerCommandEnabled,
                      })
                    }
                    label="Команда „Център!“"
                    desc="Гласова команда за бързо връщане в центъра"
                    colorClass="orange"
                    bgClass="bg-orange-500"
                  />

                  <ToggleButton
                    enabled={settings.deceptionEnabled}
                    onClick={() =>
                      setSettings({
                        ...settings,
                        deceptionEnabled: !settings.deceptionEnabled,
                      })
                    }
                    label="Фалшив сигнал (Децепция)"
                    desc="15% шанс за внезапна смяна на посоката в последния момент"
                    colorClass="purple"
                    bgClass="bg-purple-500"
                  />

                  <ToggleButton
                    enabled={settings.visualOnly}
                    onClick={() =>
                      setSettings({
                        ...settings,
                        visualOnly: !settings.visualOnly,
                      })
                    }
                    label="Само визуален режим"
                    desc="Заглушава звука – разчита само на екрана"
                    colorClass="blue"
                    bgClass="bg-blue-500"
                  />
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
                      desc: "Фиксирано таймиране и равни интервали",
                      badge: "Стабилно темпо",
                    },
                    {
                      id: "ghost_match",
                      title: "Мач на сенки (Ghost Match)",
                      desc: "Реалистични ралита и вариращо мачово темпо",
                      badge: "0.6x – 1.3x",
                    },
                    {
                      id: "agility_test",
                      title: "Тест за бързина (Agility Test)",
                      desc: "Спринт тест на брой движения срещу времето",
                      badge: "Хронометър",
                    },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() =>
                        setSettings({
                          ...settings,
                          mode: m.id as ShadowSettings["mode"],
                        })
                      }
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
                        onClick={() =>
                          setSettings({
                            ...settings,
                            calloutMode: c.id as ShadowSettings["calloutMode"],
                          })
                        }
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
                        setSettings({
                          ...settings,
                          cornersMode: "2-corners",
                          drillMode:
                            settings.drillMode === "all" ||
                            settings.drillMode === "front_back"
                              ? "front_only"
                              : settings.drillMode,
                        })
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
                        setSettings({
                          ...settings,
                          cornersMode: "4-corners",
                          drillMode: "all",
                        })
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
                        setSettings({
                          ...settings,
                          cornersMode: "6-corners",
                          drillMode:
                            settings.drillMode === "front_only" ||
                            settings.drillMode === "back_only"
                              ? "all"
                              : settings.drillMode,
                        })
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
                        ];
                      }
                      if (settings.cornersMode === "4-corners") {
                        return [{ id: "all", title: "Цял корт (4 ъгъла)" }];
                      }
                      return [
                        { id: "all", title: "Цял корт (6 ъгъла)" },
                        { id: "front_back", title: "Без среда" },
                      ];
                    })().map((z) => (
                      <button
                        key={z.id}
                        type="button"
                        onClick={() =>
                          setSettings({
                            ...settings,
                            drillMode: z.id as ShadowSettings["drillMode"],
                          })
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
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "random", label: "Случаен", icon: "🎲" },
                      { id: "fixed-triangle", label: "Триъгълник", icon: "🔺" },
                      {
                        id: "fixed-net-back",
                        label: "Мрежа ↔ Задна",
                        icon: "↕️",
                      },
                      { id: "mixed", label: "Смесен (67/33)", icon: "🔀" },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() =>
                          setSettings({
                            ...settings,
                            drillPattern:
                              p.id as ShadowSettings["drillPattern"],
                          })
                        }
                        className={`flex items-center gap-1.5 rounded-xl border p-2.5 text-left text-xs font-bold transition-all ${
                          settings.drillPattern === p.id
                            ? "border-blue-600 bg-blue-50/70 text-blue-700 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300"
                            : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        <span>{p.icon}</span>
                        <span className="truncate">{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Court Preview */}
                <div className="mt-2 flex flex-col items-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
                  <span className="mb-2 text-[11px] font-bold uppercase text-zinc-400">
                    Визуален преглед на активните зони
                  </span>
                  <div className="w-full max-w-45">
                    <CourtVisualizer previewZones={previewZones} />
                  </div>
                  <span className="mt-2 text-center text-[10px] text-zinc-500">
                    Активни: {previewZones.length} зони от корта
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

              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: "all", label: "Всички" },
                  { id: "u11", label: "U9 - U11" },
                  { id: "u15", label: "U13 - U15" },
                  { id: "u17", label: "U17+ / Мъже / Жени" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() =>
                      setPlayerFilterCategory(
                        cat.id as "all" | "u11" | "u15" | "u17"
                      )
                    }
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                      playerFilterCategory === cat.id
                        ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
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
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {filteredPlayers.map((m) => {
                  const isChecked = settings.activePlayers.some(
                    (p) => p.id === m.id
                  );
                  return (
                    <label
                      key={m.id}
                      className={`flex cursor-pointer items-center gap-2.5 rounded-2xl border p-3 transition-all ${
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
                            setSettings({
                              ...settings,
                              activePlayers: settings.activePlayers.filter(
                                (p) => p.id !== m.id
                              ),
                            });
                          } else {
                            shadowLogger.setup(
                              `Player added to drill: ${pName}`
                            );
                            setSettings({
                              ...settings,
                              activePlayers: [
                                ...settings.activePlayers,
                                {
                                  id: m.id,
                                  displayName: pName,
                                  ageGroup: m.ageGroup,
                                },
                              ],
                            });
                          }
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <span
                          className={`block truncate text-xs font-bold ${
                            isChecked
                              ? "text-blue-700 dark:text-blue-300"
                              : "text-zinc-800 dark:text-zinc-200"
                          }`}
                        >
                          {m.displayName || `${m.firstName} ${m.lastName}`}
                        </span>
                        {m.ageGroup && (
                          <span className="block truncate text-[10px] text-zinc-400">
                            {m.ageGroup}
                          </span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── СТАРТ БУТОН ─── */}
        <div className="mt-auto flex w-full shrink-0 justify-center py-4">
          <Button
            onClick={handleStart}
            className="h-16 w-full max-w-2xl cursor-pointer rounded-2xl bg-linear-to-r from-blue-600 via-indigo-600 to-blue-700 text-xl font-black text-white shadow-xl shadow-blue-500/25 transition-all hover:scale-1.01 hover:shadow-2xl hover:shadow-blue-500/35 active:scale-0.99"
          >
            <Play className="mr-3 size-6 fill-current" /> ГОТОВНОСТ ЗА СТАРТ НА
            ТРЕНИРОВКАТА
          </Button>
        </div>
      </div>
    </div>
  );
}
