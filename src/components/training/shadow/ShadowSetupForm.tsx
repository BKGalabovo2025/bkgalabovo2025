"use client";

import { ShadowSettings, ShadowPlayer } from "@/hooks/useShadowTrainer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Play,
  Users,
  Settings2,
  RotateCcw,
  Mic,
  Target,
  Zap,
  Star,
} from "lucide-react";

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
  colorClass: string;
  bgClass: string;
}

function ToggleButton({
  enabled,
  onClick,
  label,
  desc,
  colorClass,
  bgClass,
}: ToggleButtonProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onClick}
      className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border-2 p-3 text-left transition-colors ${
        enabled
          ? `border-${colorClass}-500 bg-${colorClass}-500/10`
          : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
      }`}
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <span
          className={`text-sm leading-tight font-bold ${
            enabled
              ? `text-${colorClass}-700 dark:text-${colorClass}-400`
              : "text-zinc-700 dark:text-zinc-300"
          }`}
        >
          {label}
        </span>
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

export function ShadowSetupForm({
  initialMembers,
  settings,
  setSettings,
  onStartTraining,
}: ShadowSetupFormProps) {
  return (
    <div className="relative flex size-full flex-col duration-300 animate-in fade-in">
      <div className="flex-1 space-y-4 overflow-visible pb-6 md:space-y-6">
        <div className="flex shrink-0 items-center gap-3 px-2">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary shadow-lg">
            <Settings2 className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
              Интелигентен Настройчик
            </h1>
            <p className="font-medium text-zinc-500">
              Конфигурирайте тренировката с един клик
            </p>
          </div>
        </div>

        <div className="w-full space-y-6">
          {/* Top Row: Category Selection */}
          <Card className="overflow-hidden border-2 border-zinc-100 shadow-sm dark:border-zinc-800">
            <div className="border-b border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <Users size={18} className="text-primary" /> Избор на Категория
              </h2>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                  { id: "U9-U11", title: "U9 - U11", sub: "Деца / Начинаещи" },
                  { id: "U13-U15", title: "U13 - U15", sub: "Юноши" },
                  { id: "U17+", title: "U17+", sub: "Мъже / Жени" },
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
                    className={`cursor-pointer rounded-2xl border-2 p-5 text-left transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none ${
                      settings.ageGroup === a.id
                        ? "scale-1.02 transform border-primary bg-primary text-primary-foreground shadow-[0_8px_16px_rgba(var(--primary),0.2)]"
                        : "border-zinc-200 bg-white text-zinc-900 hover:border-primary/50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                    }`}
                  >
                    <h3 className="text-2xl font-black">{a.title}</h3>
                    <p
                      className={`mt-1 text-sm font-medium ${settings.ageGroup === a.id ? "text-primary-foreground" : "text-zinc-500"}`}
                    >
                      {a.sub}
                    </p>
                  </button>
                ))}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-zinc-500 uppercase">
                    Серии
                  </Label>
                  <Input
                    type="number"
                    className="h-12 text-lg font-bold"
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
                  <Label className="text-xs font-bold text-zinc-500 uppercase">
                    {settings.mode === "agility_test"
                      ? "Брой движения"
                      : "Работа (с)"}
                  </Label>
                  <Input
                    type="number"
                    className="h-12 text-lg font-bold"
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
                  <Label className="text-xs font-bold text-zinc-500 uppercase">
                    Почивка (с)
                  </Label>
                  <Input
                    type="number"
                    className="h-12 text-lg font-bold"
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
                  <Label className="text-xs font-bold text-zinc-500 uppercase">
                    Темпо (с) {settings.mode === "ghost_match" && "(АВТО)"}
                  </Label>
                  <Input
                    type="number"
                    step="0.5"
                    disabled={settings.mode === "ghost_match"}
                    className="h-12 text-lg font-bold"
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

          {/* Bottom Row: 3 Columns Grid */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            {/* Col 1: Logistics & Toggles */}
            <div className="space-y-6">
              <Card className="flex h-full flex-col border-2 border-zinc-100 shadow-sm dark:border-zinc-800">
                <div className="border-b border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <h2 className="flex items-center gap-2 text-lg font-bold">
                    <RotateCcw size={18} className="text-primary" /> Логистика
                    на корта
                  </h2>
                </div>
                <CardContent className="flex flex-1 flex-col space-y-5 p-5">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-zinc-500 uppercase">
                      Налични кортове
                    </Label>
                    <Input
                      type="number"
                      className="h-12 text-lg font-bold"
                      value={settings.courtsAvailable}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          courtsAvailable: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                    <Label className="text-xs font-bold text-zinc-500 uppercase">
                      Модификатори
                    </Label>

                    <ToggleButton
                      enabled={settings.centerCommandEnabled}
                      onClick={() =>
                        setSettings({
                          ...settings,
                          centerCommandEnabled: !settings.centerCommandEnabled,
                        })
                      }
                      label="Команда Центре!"
                      desc="Гласова команда за връщане в центъра"
                      colorClass="orange"
                      bgClass="bg-orange-500"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Col 2: Mode */}
            <div className="space-y-6">
              <Card className="flex h-full flex-col border-2 border-zinc-100 shadow-sm dark:border-zinc-800">
                <div className="border-b border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <h2 className="flex items-center gap-2 text-lg font-bold">
                    <Zap size={18} className="text-primary" /> Режим на игра
                  </h2>
                </div>
                <CardContent className="flex flex-1 flex-col space-y-4 p-5">
                  <div className="flex flex-col gap-2">
                    {[
                      {
                        id: "standard",
                        title: "Стандартен",
                        desc: "Фиксирано таймиране",
                      },
                      {
                        id: "agility_test",
                        title: "Тест за бързина",
                        desc: "Спринт тест",
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
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                        }`}
                      >
                        <span className="text-sm leading-tight font-bold">
                          {m.title}
                        </span>
                        <span className="text-xs leading-tight font-medium opacity-60">
                          {m.desc}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Callout Mode */}
                  <div className="space-y-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                    <Label className="flex items-center gap-1 text-xs font-bold text-zinc-500 uppercase">
                      <Mic size={12} /> Тип на командите
                    </Label>
                    <div className="flex flex-col gap-1.5">
                      {[
                        {
                          id: "zones",
                          label: "Само зони",
                          icon: "🎯",
                          desc: '"Форхенд мрежа" – за позиция',
                        },
                        {
                          id: "shots",
                          label: "Само удари",
                          icon: "🏸",
                          desc: '"Клиър права" – за техника',
                        },
                        {
                          id: "zones_and_shots",
                          label: "Зони + Удари",
                          icon: "📢",
                          desc: "Зона, после удар – пълна информация",
                        },
                      ].map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() =>
                            setSettings({
                              ...settings,
                              calloutMode:
                                c.id as ShadowSettings["calloutMode"],
                            })
                          }
                          className={`flex w-full flex-col gap-0.5 rounded-lg border px-3 py-2.5 text-left transition-all ${
                            settings.calloutMode === c.id
                              ? "border-primary bg-primary/10"
                              : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                          }`}
                        >
                          <span
                            className={`flex items-center gap-1.5 text-sm leading-tight font-bold ${
                              settings.calloutMode === c.id
                                ? "text-primary"
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

            {/* Col 3: Court Config */}
            <div className="space-y-6">
              <Card className="flex h-full flex-col border-2 border-zinc-100 shadow-sm dark:border-zinc-800">
                <div className="border-b border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <h2 className="flex items-center gap-2 text-lg font-bold">
                    <Target size={18} className="text-primary" /> Конфигурация
                    на корта
                  </h2>
                </div>
                <CardContent className="flex flex-1 flex-col space-y-4 p-5">
                  {/* Corners mode */}
                  <div className="flex flex-col gap-3">
                    <Label className="text-sm font-bold tracking-wider text-zinc-500 uppercase">
                      Ъгли на корта
                    </Label>
                    <div className="flex w-full gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
                      <button
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
                        className={`flex-1 rounded-md py-2 text-sm font-bold transition-all ${
                          settings.cornersMode === "2-corners"
                            ? "bg-white text-primary shadow dark:bg-zinc-800"
                            : "text-zinc-500"
                        }`}
                      >
                        2 Ъгъла
                      </button>
                      <button
                        onClick={() =>
                          setSettings({
                            ...settings,
                            cornersMode: "4-corners",
                            drillMode: "all",
                          })
                        }
                        className={`flex-1 rounded-md py-2 text-sm font-bold transition-all ${
                          settings.cornersMode === "4-corners"
                            ? "bg-white text-primary shadow dark:bg-zinc-800"
                            : "text-zinc-500"
                        }`}
                      >
                        4 Ъгъла
                      </button>
                      <button
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
                        className={`flex-1 rounded-md py-2 text-sm font-bold transition-all ${
                          settings.cornersMode === "6-corners"
                            ? "bg-white text-primary shadow dark:bg-zinc-800"
                            : "text-zinc-500"
                        }`}
                      >
                        6 Ъгъла
                      </button>
                    </div>
                  </div>

                  {/* Drill Mode */}
                  <div className="space-y-2">
                    <Label className="text-sm font-bold tracking-wider text-zinc-500 uppercase">
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
                          return [{ id: "all", title: "Цял корт" }];
                        }
                        return [
                          { id: "all", title: "Цял корт" },
                          { id: "front_back", title: "Без среда" },
                        ];
                      })().map((z) => (
                        <button
                          key={z.id}
                          onClick={() =>
                            setSettings({
                              ...settings,
                              drillMode: z.id as ShadowSettings["drillMode"],
                            })
                          }
                          className={`rounded-full border px-3 py-2 text-sm font-bold transition-all ${
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
                    <Label className="flex items-center gap-1 text-sm font-bold tracking-wider text-zinc-500 uppercase">
                      <Star size={12} /> Шаблон на движение
                    </Label>
                    <div className="flex flex-col gap-1.5">
                      {[
                        {
                          id: "random",
                          label: "Произволен",
                          icon: "🎲",
                          desc: "Всяка зона е случайна – пълен сюрприз",
                        },
                        {
                          id: "fixed-triangle",
                          label: "Триъгълник",
                          icon: "🔺",
                          desc: "Мрежа → Задна → Среда → повтаря",
                        },
                        {
                          id: "fixed-net-back",
                          label: "Мрежа ↔ Задна",
                          icon: "↕️",
                          desc: "Само напред-назад, без среда",
                        },
                        {
                          id: "mixed",
                          label: "Смесен",
                          icon: "🔀",
                          desc: "67% мрежа↔задна + 33% произволен",
                        },
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
                          className={`flex w-full flex-col gap-0.5 rounded-lg border px-3 py-2.5 text-left transition-all ${
                            settings.drillPattern === p.id
                              ? "border-primary bg-primary/10"
                              : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                          }`}
                        >
                          <span
                            className={`flex items-center gap-1.5 text-sm leading-tight font-bold ${
                              settings.drillPattern === p.id
                                ? "text-primary"
                                : "text-zinc-700 dark:text-zinc-300"
                            }`}
                          >
                            <span>{p.icon}</span>
                            {p.label}
                          </span>
                          <span className="text-xs leading-tight text-zinc-500">
                            {p.desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Full-width: Players List */}
        <Card className="border-2 border-zinc-100 shadow-sm dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Users size={18} className="text-primary" /> Присъстващи играчи
            </h2>
            <span className="text-sm font-medium text-zinc-500">
              {settings.activePlayers.length} избрани
            </span>
          </div>
          <CardContent className="p-5">
            {initialMembers.length === 0 ? (
              <p className="p-4 text-center text-sm text-zinc-500">
                Няма намерени играчи
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {initialMembers.map((m) => {
                  const isChecked = settings.activePlayers.some(
                    (p) => p.id === m.id
                  );
                  return (
                    <label
                      key={m.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 transition-all ${
                        isChecked
                          ? "border-primary/40 bg-primary/10 shadow-sm"
                          : "border-zinc-200 bg-transparent hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                      }`}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          if (!checked) {
                            setSettings({
                              ...settings,
                              activePlayers: settings.activePlayers.filter(
                                (p) => p.id !== m.id
                              ),
                            });
                          } else {
                            setSettings({
                              ...settings,
                              activePlayers: [
                                ...settings.activePlayers,
                                {
                                  id: m.id,
                                  displayName: `${m.firstName} ${m.lastName}`,
                                },
                              ],
                            });
                          }
                        }}
                      />
                      <span
                        className={`min-w-0 truncate text-sm leading-tight font-semibold ${
                          isChecked
                            ? "text-primary"
                            : "text-zinc-600 dark:text-zinc-400"
                        }`}
                      >
                        {String(m.firstName)} {String(m.lastName)}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-auto flex w-full shrink-0 justify-center pt-6 pb-4">
          <Button
            onClick={onStartTraining}
            className="h-16 w-full max-w-2xl rounded-2xl bg-primary text-xl font-black text-primary-foreground shadow-[0_8px_30px_rgba(var(--primary),0.3)] transition-transform hover:-translate-y-1 hover:bg-primary/90 active:translate-y-0"
          >
            <Play className="mr-3 size-6" /> ГОТОВНОСТ ЗА СТАРТ
          </Button>
        </div>
      </div>
    </div>
  );
}
