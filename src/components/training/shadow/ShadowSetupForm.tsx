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
      className={`w-full text-left flex items-center justify-between gap-2 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
        enabled
          ? `border-${colorClass}-500 bg-${colorClass}-500/10`
          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
      }`}
    >
      <div className="flex flex-col min-w-0 flex-1">
        <span
          className={`font-bold text-sm leading-tight ${
            enabled
              ? `text-${colorClass}-700 dark:text-${colorClass}-400`
              : "text-zinc-700 dark:text-zinc-300"
          }`}
        >
          {label}
        </span>
        <span className="text-xs text-zinc-500 leading-tight mt-0.5">
          {desc}
        </span>
      </div>
      <div
        className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${enabled ? bgClass : "bg-zinc-300 dark:bg-zinc-700"}`}
      >
        <div
          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${enabled ? "left-6" : "left-1"}`}
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
    <div className="w-full h-full flex flex-col animate-in fade-in duration-300 relative">
      <div className="flex-1 overflow-visible space-y-4 md:space-y-6 pb-6">
        <div className="flex items-center gap-3 px-2 shrink-0">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg">
            <Settings2 className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
              Интелигентен Настройчик
            </h1>
            <p className="text-zinc-500 font-medium">
              Конфигурирайте тренировката с един клик
            </p>
          </div>
        </div>

        <div className="w-full space-y-6">
          {/* Top Row: Category Selection */}
          <Card className="border-2 border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Users size={18} className="text-primary" /> Избор на Категория
              </h2>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    className={`text-left p-5 rounded-2xl border-2 cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                      settings.ageGroup === a.id
                        ? "border-primary bg-primary shadow-[0_8px_16px_rgba(var(--primary),0.2)] text-primary-foreground transform scale-[1.02]"
                        : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-primary/50 text-zinc-900 dark:text-zinc-100"
                    }`}
                  >
                    <h3 className="font-black text-2xl">{a.title}</h3>
                    <p
                      className={`text-sm mt-1 font-medium ${settings.ageGroup === a.id ? "text-primary-foreground" : "text-zinc-500"}`}
                    >
                      {a.sub}
                    </p>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                <div className="space-y-1">
                  <Label className="text-zinc-500 text-xs uppercase font-bold">
                    Серии
                  </Label>
                  <Input
                    type="number"
                    className="font-bold text-lg h-12"
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
                  <Label className="text-zinc-500 text-xs uppercase font-bold">
                    {settings.mode === "agility_test"
                      ? "Брой движения"
                      : "Работа (с)"}
                  </Label>
                  <Input
                    type="number"
                    className="font-bold text-lg h-12"
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
                  <Label className="text-zinc-500 text-xs uppercase font-bold">
                    Почивка (с)
                  </Label>
                  <Input
                    type="number"
                    className="font-bold text-lg h-12"
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
                  className={`space-y-1 ${settings.mode === "ghost_match" ? "opacity-40 pointer-events-none" : "opacity-100"}`}
                >
                  <Label className="text-zinc-500 text-xs uppercase font-bold">
                    Темпо (с) {settings.mode === "ghost_match" && "(АВТО)"}
                  </Label>
                  <Input
                    type="number"
                    step="0.5"
                    disabled={settings.mode === "ghost_match"}
                    className="font-bold text-lg h-12"
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
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Col 1: Logistics & Toggles */}
            <div className="space-y-6">
              <Card className="border-2 border-zinc-100 dark:border-zinc-800 shadow-sm h-full flex flex-col">
                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 border-b border-zinc-100 dark:border-zinc-800">
                  <h2 className="font-bold text-lg flex items-center gap-2">
                    <RotateCcw size={18} className="text-primary" /> Логистика
                    на корта
                  </h2>
                </div>
                <CardContent className="p-5 flex-1 flex flex-col space-y-5">
                  <div className="space-y-1">
                    <Label className="text-zinc-500 text-xs uppercase font-bold">
                      Налични кортове
                    </Label>
                    <Input
                      type="number"
                      className="font-bold text-lg h-12"
                      value={settings.courtsAvailable}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          courtsAvailable: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <Label className="text-zinc-500 text-xs uppercase font-bold">
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
              <Card className="border-2 border-zinc-100 dark:border-zinc-800 shadow-sm h-full flex flex-col">
                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 border-b border-zinc-100 dark:border-zinc-800">
                  <h2 className="font-bold text-lg flex items-center gap-2">
                    <Zap size={18} className="text-primary" /> Режим на игра
                  </h2>
                </div>
                <CardContent className="p-5 space-y-4 flex-1 flex flex-col">
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
                        className={`w-full text-left px-4 py-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col gap-0.5 ${
                          settings.mode === m.id
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                        }`}
                      >
                        <span className="font-bold text-sm leading-tight">
                          {m.title}
                        </span>
                        <span className="text-xs opacity-60 font-medium leading-tight">
                          {m.desc}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Callout Mode */}
                  <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                    <Label className="text-zinc-500 text-xs uppercase font-bold flex items-center gap-1">
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
                          className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all flex flex-col gap-0.5 ${
                            settings.calloutMode === c.id
                              ? "border-primary bg-primary/10"
                              : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                          }`}
                        >
                          <span
                            className={`font-bold text-sm leading-tight flex items-center gap-1.5 ${
                              settings.calloutMode === c.id
                                ? "text-primary"
                                : "text-zinc-700 dark:text-zinc-300"
                            }`}
                          >
                            <span>{c.icon}</span>
                            {c.label}
                          </span>
                          <span className="text-xs text-zinc-500 leading-tight">
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
              <Card className="border-2 border-zinc-100 dark:border-zinc-800 shadow-sm h-full flex flex-col">
                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 border-b border-zinc-100 dark:border-zinc-800">
                  <h2 className="font-bold text-lg flex items-center gap-2">
                    <Target size={18} className="text-primary" /> Конфигурация
                    на корта
                  </h2>
                </div>
                <CardContent className="p-5 space-y-4 flex-1 flex flex-col">
                  {/* Corners mode */}
                  <div className="flex flex-col gap-3">
                    <Label className="text-sm font-bold uppercase text-zinc-500 tracking-wider">
                      Ъгли на корта
                    </Label>
                    <div className="flex w-full bg-zinc-100 dark:bg-zinc-900 rounded-lg p-1 gap-1">
                      <button
                        onClick={() =>
                          setSettings({
                            ...settings,
                            cornersMode: "2-corners",
                            // auto-select front_only if current drillMode is incompatible
                            drillMode:
                              settings.drillMode === "all" ||
                              settings.drillMode === "front_back"
                                ? "front_only"
                                : settings.drillMode,
                          })
                        }
                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${
                          settings.cornersMode === "2-corners"
                            ? "bg-white dark:bg-zinc-800 shadow text-primary"
                            : "text-zinc-500"
                        }`}
                      >
                        2 Ъгъла
                      </button>
                      <button
                        onClick={() =>
                          setSettings({ ...settings, cornersMode: "4-corners" })
                        }
                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${
                          settings.cornersMode === "4-corners"
                            ? "bg-white dark:bg-zinc-800 shadow text-primary"
                            : "text-zinc-500"
                        }`}
                      >
                        4 Ъгъла
                      </button>
                      <button
                        onClick={() =>
                          setSettings({ ...settings, cornersMode: "6-corners" })
                        }
                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${
                          settings.cornersMode === "6-corners"
                            ? "bg-white dark:bg-zinc-800 shadow text-primary"
                            : "text-zinc-500"
                        }`}
                      >
                        6 Ъгъла
                      </button>
                    </div>
                  </div>

                  {/* Drill Mode */}
                  <div className="space-y-2">
                    <Label className="text-sm font-bold uppercase text-zinc-500 tracking-wider">
                      Насоченост на зоните
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {(settings.cornersMode === "2-corners"
                        ? [
                            { id: "front_only", title: "Само мрежа" },
                            { id: "back_only", title: "Задна линия" },
                          ]
                        : [
                            { id: "all", title: "Цял корт" },
                            { id: "front_only", title: "Само мрежа" },
                            { id: "back_only", title: "Задна линия" },
                            { id: "front_back", title: "Без среда" },
                          ]
                      ).map((z) => (
                        <button
                          key={z.id}
                          onClick={() =>
                            setSettings({
                              ...settings,
                              drillMode: z.id as ShadowSettings["drillMode"],
                            })
                          }
                          className={`px-3 py-2 rounded-full text-sm font-bold border transition-all ${
                            settings.drillMode === z.id
                              ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent"
                              : "bg-transparent border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                          }`}
                        >
                          {z.title}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Drill Pattern */}
                  <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <Label className="text-sm font-bold uppercase text-zinc-500 tracking-wider flex items-center gap-1">
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
                          className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all flex flex-col gap-0.5 ${
                            settings.drillPattern === p.id
                              ? "border-primary bg-primary/10"
                              : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                          }`}
                        >
                          <span
                            className={`font-bold text-sm leading-tight flex items-center gap-1.5 ${
                              settings.drillPattern === p.id
                                ? "text-primary"
                                : "text-zinc-700 dark:text-zinc-300"
                            }`}
                          >
                            <span>{p.icon}</span>
                            {p.label}
                          </span>
                          <span className="text-xs text-zinc-500 leading-tight">
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
        <Card className="border-2 border-zinc-100 dark:border-zinc-800 shadow-sm">
          <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Users size={18} className="text-primary" /> Присъстващи играчи
            </h2>
            <span className="text-sm text-zinc-500 font-medium">
              {settings.activePlayers.length} избрани
            </span>
          </div>
          <CardContent className="p-5">
            {initialMembers.length === 0 ? (
              <p className="text-sm text-zinc-500 p-4 text-center">
                Няма намерени играчи
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                {initialMembers.map((m) => {
                  const isChecked = settings.activePlayers.some(
                    (p) => p.id === m.id
                  );
                  return (
                    <label
                      key={m.id}
                      className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all border ${
                        isChecked
                          ? "bg-primary/10 border-primary/40 shadow-sm"
                          : "bg-transparent border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
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
                        className={`font-semibold text-sm leading-tight min-w-0 truncate ${
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

        <div className="pt-6 pb-4 flex justify-center shrink-0 w-full mt-auto">
          <Button
            onClick={onStartTraining}
            className="w-full max-w-2xl h-16 text-xl font-black bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-[0_8px_30px_rgba(var(--primary),0.3)] transition-transform hover:-translate-y-1 active:translate-y-0"
          >
            <Play className="w-6 h-6 mr-3" /> ГОТОВНОСТ ЗА СТАРТ
          </Button>
        </div>
      </div>
    </div>
  );
}
