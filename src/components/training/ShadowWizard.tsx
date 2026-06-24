/* eslint-disable sonarjs/no-nested-conditional */
/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useShadowTrainer, ShadowSettings } from "@/hooks/useShadowTrainer";
import { CourtVisualizer } from "./CourtVisualizer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Play,
  Square,
  Pause,
  Save,
  CheckCircle2,
  Users,
  Activity,
  Settings2,
  RotateCcw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { createTrainingSessionAction } from "@/lib/actions/trainings";
import { preloadAudioForSettings } from "@/lib/shadow-training/audio-map";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  initialMembers?: any[];
}

export function ShadowWizard({ initialMembers = [] }: Props) {
  const router = useRouter();
  const { user } = useAuth();

  // We now have 3 screens: "setup" (Screen 1), "training" (Screen 2), "analytics" (Screen 3)
  const [screen, setScreen] = useState<"setup" | "training" | "analytics">(
    "setup"
  );

  const [settings, setSettings] = useState<ShadowSettings>({
    mode: "standard",
    preset: "custom",
    drillMode: "all",
    cornersMode: "6-corners",
    ageGroup: "U13-U15",
    drillPattern: "random",
    sets: 3,
    workSec: 45,
    restSec: 15,
    paceSec: 3,
    deceptionEnabled: false,
    motivationEnabled: false,
    visualOnly: false,
    calloutMode: "zones",
    centerCommandEnabled: false,
    activePlayers: [],
    courtsAvailable: 1,
  });

  const [rpeScore, setRpeScore] = useState<number>(5);
  const [rpeNotes, setRpeNotes] = useState("");

  const trainer = useShadowTrainer(screen === "training" ? settings : null);

  // Auto-transition to analytics when finished
  useEffect(() => {
    if (screen === "training" && trainer.state === "finished") {
      setScreen("analytics");
    }
  }, [trainer.state, screen]);

  // Preload audio when we have active players and are still in setup
  useEffect(() => {
    if (screen === "setup" && settings.activePlayers.length > 0) {
      preloadAudioForSettings(settings);
    }
  }, [screen, settings]);

  const handleStartTraining = () => {
    if (settings.activePlayers.length === 0) {
      alert("Моля, изберете поне един играч!");
      return;
    }
    setScreen("training");
  };

  const handleSave = async () => {
    if (!user) return;

    const elapsedSeconds = (trainer.actualElapsedMs || 0) / 1000;
    if (elapsedSeconds < 10) {
      const confirmSave = confirm(
        `Внимание: Тренировката е продължила само ${Math.round(elapsedSeconds)} секунди. Сигурни ли сте, че искате да я запишете в историята?`
      );
      if (!confirmSave) return;
    }

    try {
      const token = await user.getIdToken();
      // Apply the global RPE score to all participants for this UI version
      const rpeScores = settings.activePlayers.reduce(
        (acc, p) => {
          acc[p.id] = rpeScore;
          return acc;
        },
        {} as Record<string, number>
      );

      await createTrainingSessionAction(token, {
        siteId: "bkgalabovo",
        type: "shadow",
        date: new Date().toISOString(),
        memberIds: settings.activePlayers.map((p) => p.id),
        durationMs: trainer.actualElapsedMs || 0,
        notes: rpeNotes,
        shadowDetails: {
          mode: settings.mode,
          preset: settings.preset as any,
          cornersMode: settings.cornersMode,
          ageGroup: settings.ageGroup,
          drillPattern: settings.drillPattern,
          setsCompleted: trainer.currentSet,
          totalSets: settings.sets,
          workTimeSec:
            settings.mode === "agility_test"
              ? Math.round(trainer.actualElapsedMs / 1000)
              : settings.workSec,
          restTimeSec: settings.restSec,
          deceptionEnabled: settings.deceptionEnabled,
          rpeScores,
        },
      });
      alert("Тренировката е запазена успешно!");
      router.push("/training/shadow/history");
    } catch (e) {
      console.error("Save training error:", e);
      alert("Грешка при запазване.");
    }
  };

  if (screen === "analytics") {
    return (
      <div className="w-full max-w-2xl mx-auto animate-in slide-in-from-bottom-8 duration-500">
        <Card className="border-none shadow-2xl bg-zinc-950 overflow-hidden text-white relative p-8">
          <div className="flex flex-col items-center justify-center space-y-6">
            <CheckCircle2 size={72} className="text-green-500" />
            <h2 className="text-3xl font-black tracking-tight text-center">
              Лагерен Отчет
            </h2>
            <p className="text-zinc-400 text-center max-w-md text-lg">
              Оценете натоварването на групата (RPE) и добавете бележки за
              сесията.
            </p>

            <div className="w-full bg-zinc-900 rounded-2xl p-8 border border-zinc-800 space-y-8 mt-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-xl font-bold">
                    Оценка на умората (RPE)
                  </Label>
                  <span className="text-3xl font-black text-primary">
                    {rpeScore}/10
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={rpeScore}
                  onChange={(e) => setRpeScore(parseInt(e.target.value))}
                  className="w-full h-4 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-sm text-zinc-500 font-medium">
                  <span>Леко (1)</span>
                  <span>Умерено (5)</span>
                  <span>Максимум (10)</span>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-xl font-bold">Бързи бележки</Label>
                <Textarea
                  placeholder="Напр. Проблеми със сплит степа при задна линия..."
                  className="bg-zinc-950 border-zinc-800 text-lg p-4 min-h-[120px]"
                  value={rpeNotes}
                  onChange={(e) => setRpeNotes(e.target.value)}
                />
              </div>
            </div>

            <Button
              size="lg"
              onClick={handleSave}
              className="w-full h-16 text-xl bg-green-600 hover:bg-green-700 text-white font-black mt-8 rounded-xl"
            >
              <Save className="mr-3 h-6 w-6" />
              ЗАПИШИ В КЛУБНАТА БАЗА ДАННИ
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (screen === "training") {
    // Who is up next logic
    const activeIds = trainer.currentRotationPlayers.map((p) => p.id);
    const restingPlayers = settings.activePlayers.filter(
      (p) => !activeIds.includes(p.id)
    );

    return (
      <div className="space-y-4 md:space-y-6 animate-in fade-in zoom-in-95 duration-300 w-full flex flex-col">
        <Card className="border-none shadow-2xl bg-zinc-950 w-full flex flex-col text-white relative">
          {/* Top Rotation Bar */}
          <div className="bg-zinc-900 border-b border-zinc-800 p-4 flex flex-col md:flex-row gap-4 justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-zinc-400 font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                <Activity size={16} className="text-green-500" /> На Корта:
              </span>
              <div className="flex flex-wrap gap-2">
                {trainer.currentRotationPlayers.map((p, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full font-bold"
                  >
                    {p.displayName}
                  </span>
                ))}
              </div>
            </div>

            {restingPlayers.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-zinc-500 font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                  <RotateCcw size={16} /> Почиват/Следват:
                </span>
                <div className="flex flex-wrap gap-2">
                  {restingPlayers.map((p, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-zinc-800 text-zinc-400 rounded-full font-medium text-sm"
                    >
                      {p.displayName}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main Dashboard Area */}
          <CardContent className="p-4 md:p-8 flex-1 flex flex-col md:flex-row gap-6 md:gap-10 items-center justify-between">
            {/* Left side: Court */}
            <div className="flex-1 w-full max-w-[280px] md:max-w-[400px] flex items-center justify-center">
              <CourtVisualizer
                activeZone={trainer.activeZone}
                visualPhase={trainer.visualPhase}
                className="w-full scale-100 md:scale-110 origin-center"
              />
            </div>

            {/* Right side: Timer & Controls */}
            <div className="flex-1 w-full space-y-6 md:space-y-10 flex flex-col items-center md:items-start text-center md:text-left">
              <div className="space-y-2 md:space-y-4">
                <div className="inline-flex items-center px-4 py-2 bg-zinc-900 rounded-full border border-zinc-800">
                  <span className="w-3 h-3 rounded-full bg-primary animate-pulse mr-3" />
                  <span className="text-zinc-300 font-bold tracking-widest uppercase text-sm md:text-base">
                    {trainer.state === "countdown"
                      ? "Приготви се..."
                      : trainer.state === "working"
                        ? "РАБОТА"
                        : trainer.state === "resting"
                          ? "ПОЧИВКА"
                          : trainer.state === "paused"
                            ? "ПАУЗА"
                            : "ГОТОВНОСТ"}
                  </span>
                </div>

                <div className="text-8xl md:text-9xl lg:text-[10rem] leading-none font-black tabular-nums tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500">
                  {trainer.timeRemaining}
                </div>

                <p className="text-zinc-400 text-xl md:text-2xl font-medium mt-2 md:mt-4">
                  {settings.mode === "agility_test"
                    ? trainer.state === "working"
                      ? `Движение ${trainer.agilityActionsDone} от ${settings.workSec}`
                      : trainer.state === "countdown"
                        ? "Подготовка..."
                        : ""
                    : `Серия ${trainer.currentSet} от ${settings.sets}`}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4 w-full max-w-md">
                {trainer.state === "idle" ? (
                  <Button
                    size="lg"
                    className="col-span-2 h-20 md:h-24 text-2xl md:text-3xl font-black bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-[0_0_40px_rgba(var(--primary),0.3)]"
                    onClick={trainer.startTraining}
                  >
                    <Play className="mr-3 md:mr-4 w-8 h-8 md:w-10 md:h-10" />{" "}
                    СТАРТ
                  </Button>
                ) : (
                  <>
                    {trainer.state === "paused" ? (
                      <Button
                        size="lg"
                        className="h-20 md:h-24 text-xl md:text-2xl font-black bg-green-600 hover:bg-green-700 rounded-2xl"
                        onClick={trainer.resumeTraining}
                      >
                        <Play className="mr-2 md:mr-3 w-6 h-6 md:w-8 md:h-8" />{" "}
                        ПРОДЪЛЖИ
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        className="h-20 md:h-24 text-xl md:text-2xl font-black bg-yellow-500 hover:bg-yellow-600 text-yellow-950 rounded-2xl"
                        onClick={trainer.pauseTraining}
                      >
                        <Pause className="mr-2 md:mr-3 w-6 h-6 md:w-8 md:h-8" />{" "}
                        ПАУЗА
                      </Button>
                    )}
                    <Button
                      size="lg"
                      variant="destructive"
                      className="h-20 md:h-24 text-xl md:text-2xl font-black rounded-2xl"
                      onClick={() => {
                        const confirmExit = confirm(
                          "Сигурни ли сте, че искате да спрете тренировката предсрочно?"
                        );
                        if (confirmExit) trainer.stopTraining();
                      }}
                    >
                      <Square className="mr-2 md:mr-3 w-6 h-6 md:w-8 md:h-8" />{" "}
                      СТОП
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // SCREEN 1: Setup
  return (
    <div className="w-full flex flex-col space-y-4 md:space-y-6 animate-in fade-in duration-300 pb-20">
      <div className="flex items-center gap-3 px-2">
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: Core Setup */}
        <div className="xl:col-span-2 space-y-6">
          {/* Age Groups & Presets */}
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
                  <div
                    key={a.id}
                    onClick={() => {
                      const newSettings = {
                        ...settings,
                        ageGroup: a.id as any,
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
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                      settings.ageGroup === a.id
                        ? "border-primary bg-primary shadow-[0_8px_16px_rgba(var(--primary),0.2)] text-primary-foreground transform scale-[1.02]"
                        : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-primary/50 text-zinc-900 dark:text-zinc-100"
                    }`}
                  >
                    <h3 className="font-black text-2xl">{a.title}</h3>
                    <p
                      className={`text-sm mt-1 font-medium ${settings.ageGroup === a.id ? "text-primary-foreground/80" : "text-zinc-500"}`}
                    >
                      {a.sub}
                    </p>
                  </div>
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
                    Работа (с)
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
                <div className="space-y-1">
                  <Label className="text-zinc-500 text-xs uppercase font-bold">
                    Темпо (с)
                  </Label>
                  <Input
                    type="number"
                    step="0.5"
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

          {/* Mode & Drill Patterns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-2 border-zinc-100 dark:border-zinc-800 shadow-sm">
              <CardContent className="p-5 space-y-4">
                <Label className="text-sm font-bold uppercase text-zinc-500 tracking-wider">
                  Режим на игра
                </Label>
                <div className="flex flex-col gap-2">
                  {[
                    {
                      id: "standard",
                      title: "Стандартен",
                      desc: "Фиксирано таймиране",
                    },
                    {
                      id: "ghost_match",
                      title: "Мач на сенки",
                      desc: "Рандомизирани паузи",
                    },
                    {
                      id: "agility_test",
                      title: "Тест за бързина",
                      desc: "Спринт тест",
                    },
                  ].map((m) => (
                    <div
                      key={m.id}
                      onClick={() =>
                        setSettings({ ...settings, mode: m.id as any })
                      }
                      className={`px-4 py-3 rounded-xl border-2 cursor-pointer transition-all flex justify-between items-center ${
                        settings.mode === m.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      <span className="font-bold">{m.title}</span>
                      <span className="text-xs opacity-60 font-medium">
                        {m.desc}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-zinc-100 dark:border-zinc-800 shadow-sm">
              <CardContent className="p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-bold uppercase text-zinc-500 tracking-wider">
                    Конфигурация на корта
                  </Label>
                  <div className="flex bg-zinc-100 dark:bg-zinc-900 rounded-lg p-1">
                    <button
                      onClick={() =>
                        setSettings({ ...settings, cornersMode: "4-corners" })
                      }
                      className={`px-3 py-1 text-sm font-bold rounded-md transition-all ${settings.cornersMode === "4-corners" ? "bg-white dark:bg-zinc-800 shadow text-primary" : "text-zinc-500"}`}
                    >
                      4 Ъгъла
                    </button>
                    <button
                      onClick={() =>
                        setSettings({ ...settings, cornersMode: "6-corners" })
                      }
                      className={`px-3 py-1 text-sm font-bold rounded-md transition-all ${settings.cornersMode === "6-corners" ? "bg-white dark:bg-zinc-800 shadow text-primary" : "text-zinc-500"}`}
                    >
                      6 Ъгъла
                    </button>
                  </div>
                </div>

                <Label className="text-sm font-bold uppercase text-zinc-500 tracking-wider mt-4 block">
                  Насоченост на зоните
                </Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "all", title: "Цял корт" },
                    { id: "front_only", title: "Само мрежа" },
                    { id: "back_only", title: "Задна линия" },
                    { id: "front_back", title: "Без среда" },
                  ].map((z) => (
                    <button
                      key={z.id}
                      onClick={() =>
                        setSettings({ ...settings, drillMode: z.id as any })
                      }
                      className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${
                        settings.drillMode === z.id
                          ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent"
                          : "bg-transparent border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                      }`}
                    >
                      {z.title}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column: Rotation & Modifiers */}
        <div className="space-y-6">
          <Card className="border-2 border-zinc-100 dark:border-zinc-800 shadow-sm h-full flex flex-col">
            <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <RotateCcw size={18} className="text-primary" /> Логистика на
                корта
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

              <div className="space-y-2 flex-1 flex flex-col min-h-[200px]">
                <Label className="text-zinc-500 text-xs uppercase font-bold flex justify-between">
                  <span>Присъстващи играчи</span>
                  <span className="text-primary">
                    {settings.activePlayers.length} избрани
                  </span>
                </Label>
                <div className="border-2 border-zinc-100 dark:border-zinc-800 rounded-xl p-3 flex-1 overflow-y-auto custom-scrollbar space-y-2 bg-zinc-50/50 dark:bg-zinc-900/30">
                  {initialMembers.map((m) => {
                    const isChecked = settings.activePlayers.some(
                      (p) => p.id === m.id
                    );
                    return (
                      <div
                        key={m.id}
                        onClick={() => {
                          if (isChecked) {
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
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border ${isChecked ? "bg-white dark:bg-zinc-800 border-primary/30 shadow-sm" : "bg-transparent border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800/50"}`}
                      >
                        <Checkbox checked={isChecked} />
                        <span
                          className={`font-semibold ${isChecked ? "text-zinc-900 dark:text-white" : "text-zinc-500 dark:text-zinc-400"}`}
                        >
                          {m.firstName} {m.lastName}
                        </span>
                      </div>
                    );
                  })}
                  {initialMembers.length === 0 && (
                    <p className="text-sm text-zinc-500 p-2 text-center mt-4">
                      Няма намерени играчи
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <Label className="text-zinc-500 text-xs uppercase font-bold">
                  Експертни Модификатори
                </Label>

                <div
                  onClick={() =>
                    setSettings({
                      ...settings,
                      deceptionEnabled: !settings.deceptionEnabled,
                    })
                  }
                  className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-colors ${settings.deceptionEnabled ? "border-purple-500 bg-purple-500/10" : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"}`}
                >
                  <div className="flex flex-col">
                    <span
                      className={`font-bold ${settings.deceptionEnabled ? "text-purple-700 dark:text-purple-400" : "text-zinc-700 dark:text-zinc-300"}`}
                    >
                      Измамни удари (Deception)
                    </span>
                    <span className="text-xs text-zinc-500">
                      Алгоритъм за внезапна смяна
                    </span>
                  </div>
                  <div
                    className={`w-12 h-6 rounded-full transition-colors relative ${settings.deceptionEnabled ? "bg-purple-500" : "bg-zinc-300 dark:bg-zinc-700"}`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.deceptionEnabled ? "left-7" : "left-1"}`}
                    />
                  </div>
                </div>

                <div
                  onClick={() =>
                    setSettings({
                      ...settings,
                      visualOnly: !settings.visualOnly,
                    })
                  }
                  className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-colors ${settings.visualOnly ? "border-blue-500 bg-blue-500/10" : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"}`}
                >
                  <div className="flex flex-col">
                    <span
                      className={`font-bold ${settings.visualOnly ? "text-blue-700 dark:text-blue-400" : "text-zinc-700 dark:text-zinc-300"}`}
                    >
                      Без звук (Visual Only)
                    </span>
                    <span className="text-xs text-zinc-500">
                      Тренира периферното зрение
                    </span>
                  </div>
                  <div
                    className={`w-12 h-6 rounded-full transition-colors relative ${settings.visualOnly ? "bg-blue-500" : "bg-zinc-300 dark:bg-zinc-700"}`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.visualOnly ? "left-7" : "left-1"}`}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 z-50 flex justify-center">
        <Button
          onClick={handleStartTraining}
          className="w-full max-w-4xl h-16 text-xl font-black bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-[0_8px_30px_rgba(var(--primary),0.3)] transition-transform hover:-translate-y-1 active:translate-y-0"
        >
          <Play className="w-6 h-6 mr-3" /> ГОТОВНОСТ ЗА СТАРТ
        </Button>
      </div>
    </div>
  );
}
