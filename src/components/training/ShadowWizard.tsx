"use client";

import { useState } from "react";
import { useShadowTrainer, ShadowSettings } from "@/hooks/useShadowTrainer";
import { CourtVisualizer } from "./CourtVisualizer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Play, Square, Pause, Save, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { createTrainingSessionAction } from "@/lib/actions/trainings";

interface Props {
  initialMembers?: any[];
}

export function ShadowWizard({ initialMembers = [] }: Props) {
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [settings, setSettings] = useState<ShadowSettings>({
    mode: "standard",
    preset: "custom",
    drillMode: "all",
    sets: 3,
    workSec: 45,
    restSec: 15,
    paceSec: 3,
    deceptionEnabled: false,
    motivationEnabled: false,
    visualOnly: false,
    calloutMode: "zones",
    centerCommandEnabled: false,
    activePlayers: [], // Empty initially
    courtsAvailable: 1,
  });

  const trainer = useShadowTrainer(step === 5 ? settings : null);

  const handleNext = () => setStep((s) => s + 1);
  const handlePrev = () => setStep((s) => s - 1);

  const handleSave = async () => {
    if (!user) return;

    // Threshold verification: at least 10 seconds of actual exercise elapsed
    const elapsedSeconds = (trainer.actualElapsedMs || 0) / 1000;
    if (elapsedSeconds < 10) {
      const confirmSave = confirm(
        `Внимание: Тренировката е продължила само ${Math.round(elapsedSeconds)} секунди. Сигурни ли сте, че искате да я запишете в историята?`
      );
      if (!confirmSave) return;
    }

    try {
      const token = await user.getIdToken();
      await createTrainingSessionAction(token, {
        siteId: "bkgalabovo",
        type: "shadow",
        date: new Date().toISOString(),
        memberIds: settings.activePlayers.map((p) => p.id),
        durationMs: trainer.actualElapsedMs || 0,
        shadowDetails: {
          mode: settings.mode,
          preset: settings.preset as any,
          setsCompleted: trainer.currentSet,
          totalSets: settings.sets,
          workTimeSec:
            settings.mode === "agility_test"
              ? Math.round(trainer.actualElapsedMs / 1000)
              : settings.workSec,
          restTimeSec: settings.restSec,
          deceptionEnabled: settings.deceptionEnabled,
        },
      });
      alert("Тренировката е запазена успешно!");
      router.push("/training/shadow/history");
    } catch (e) {
      alert("Грешка при запазване.");
    }
  };

  if (step === 5) {
    // Training Screen
    return (
      <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
        <Card className="border-none shadow-xl bg-zinc-900 overflow-hidden text-white relative">
          {trainer.state === "finished" && (
            <div className="absolute inset-0 bg-green-900/90 z-50 flex flex-col items-center justify-center space-y-4">
              <CheckCircle2 size={64} className="text-green-400" />
              <h2 className="text-2xl font-bold">Тренировката приключи!</h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  onClick={handleSave}
                  className="bg-white text-green-900 hover:bg-zinc-200"
                >
                  <Save className="mr-2 h-5 w-5" />
                  Запази в историята
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    const confirmExit = confirm(
                      "Сигурни ли сте, че искате да излезете без да запазвате тренировката?"
                    );
                    if (confirmExit) {
                      setStep(1);
                    }
                  }}
                  className="bg-transparent text-white border-white hover:bg-white/10"
                >
                  Затвори без запис
                </Button>
              </div>
            </div>
          )}

          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
              <div className="flex-1 w-full space-y-6">
                <div className="text-center md:text-left">
                  <p className="text-zinc-400 uppercase tracking-widest text-sm font-semibold mb-1">
                    {trainer.state === "countdown"
                      ? "Приготви се..."
                      : trainer.state === "working"
                        ? "РАБОТА"
                        : trainer.state === "resting"
                          ? "ПОЧИВКА"
                          : trainer.state === "paused"
                            ? "ПАУЗА"
                            : ""}
                  </p>
                  <div className="text-8xl font-black tabular-nums tracking-tighter">
                    {trainer.timeRemaining}
                  </div>
                  <p className="text-zinc-400 text-lg mt-2">
                    {settings.mode === "agility_test"
                      ? trainer.state === "working"
                        ? `Движение ${trainer.agilityActionsDone} от ${settings.workSec}`
                        : trainer.state === "countdown"
                          ? "Подготовка..."
                          : ""
                      : `Серия ${trainer.currentSet} от ${settings.sets}`}
                  </p>
                </div>

                <div className="bg-zinc-800/50 p-4 rounded-xl">
                  <h3 className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
                    На корта в момента:
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {trainer.currentRotationPlayers.map((p, i) => (
                      <div
                        key={i}
                        className="px-3 py-1.5 bg-primary/20 text-primary rounded-md text-sm font-medium"
                      >
                        {p.displayName}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  {trainer.state === "idle" ? (
                    <Button
                      size="lg"
                      className="w-full h-14 text-lg"
                      onClick={trainer.startTraining}
                    >
                      <Play className="mr-2" /> СТАРТ
                    </Button>
                  ) : (
                    <>
                      {trainer.state === "paused" ? (
                        <Button
                          size="lg"
                          variant="default"
                          className="flex-1 h-14"
                          onClick={trainer.resumeTraining}
                        >
                          ПРОДЪЛЖИ
                        </Button>
                      ) : (
                        <Button
                          size="lg"
                          variant="outline"
                          className="flex-1 h-14 text-zinc-900"
                          onClick={trainer.pauseTraining}
                        >
                          <Pause className="mr-2" /> ПАУЗА
                        </Button>
                      )}
                      <Button
                        size="lg"
                        variant="destructive"
                        className="flex-1 h-14"
                        onClick={trainer.stopTraining}
                      >
                        <Square className="mr-2" /> СТОП
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="flex-1 w-full max-w-sm">
                <CourtVisualizer activeZone={trainer.activeZone} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm h-full flex flex-col overflow-hidden">
      <CardContent className="p-4 sm:p-6 flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar space-y-6 sm:space-y-8 pb-6">
        {/* Wizard Progress */}
        <div className="flex items-center justify-between mb-8 relative px-2 shrink-0">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full z-0" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full z-0 transition-all duration-300"
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          />

          {[1, 2, 3, 4].map((num) => (
            <div
              key={num}
              className={`w-8 h-8 rounded-full flex items-center justify-center z-10 transition-colors duration-300 font-bold text-sm ${step >= num ? "bg-primary text-primary-foreground" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500"}`}
            >
              {num}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <div>
              <h2 className="text-xl font-bold">1. Режим на тренировка</h2>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                Изберете типа на натоварването.
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  id: "standard",
                  title: "Стандартен",
                  desc: "Свободна тренировка с фиксиран таймер и равномерни команди.",
                },
                {
                  id: "ghost_match",
                  title: "Симулация на мач (Ghost Match)",
                  desc: "Симулация на реален мач. Разиграванията и паузите са с различна дължина.",
                },
                {
                  id: "agility_test",
                  title: "Скоростен Тест",
                  desc: "Тест за време на 20 зони. Измерва скоростта на придвижване.",
                },
              ].map((mode) => (
                <div
                  key={mode.id}
                  onClick={() =>
                    setSettings({
                      ...settings,
                      mode: mode.id as any,
                      workSec: mode.id === "agility_test" ? 20 : 45,
                      sets: mode.id === "agility_test" ? 1 : 3,
                    })
                  }
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${settings.mode === mode.id ? "border-primary bg-primary/5" : "border-transparent bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800"}`}
                >
                  <h3 className="font-semibold">{mode.title}</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                    {mode.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-6 pt-6 pb-6 border-t border-zinc-200 dark:border-zinc-800">
              <div className="space-y-2">
                <Label>Движение по корта</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                  {[
                    { id: "all", title: "Цял корт" },
                    { id: "front_only", title: "Само мрежа" },
                    { id: "back_only", title: "Само задна линия" },
                    { id: "front_back", title: "Мрежа и Задна (без среда)" },
                  ].map((d) => (
                    <div
                      key={d.id}
                      onClick={() =>
                        setSettings({ ...settings, drillMode: d.id as any })
                      }
                      className={`p-3 rounded-xl border text-center cursor-pointer text-sm font-medium transition-colors ${settings.drillMode === d.id ? "bg-sky-100/70 border-sky-500 text-sky-700 dark:bg-primary/10 dark:border-primary dark:text-primary" : "bg-zinc-50 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
                    >
                      {d.title}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Произнасяне (Аудио)</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-1">
                  {[
                    { id: "zones", title: "Само зони" },
                    { id: "shots", title: "Само удари" },
                    { id: "mixed", title: "Смесено" },
                    { id: "zones_and_shots", title: "Зони + Удари" },
                  ].map((c) => (
                    <div
                      key={c.id}
                      onClick={() =>
                        setSettings({ ...settings, calloutMode: c.id as any })
                      }
                      className={`p-3 rounded-xl border text-center cursor-pointer text-sm font-medium transition-colors ${settings.calloutMode === c.id ? "bg-sky-100/70 border-sky-500 text-sky-700 dark:bg-primary/10 dark:border-primary dark:text-primary" : "bg-zinc-50 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850"}`}
                    >
                      {c.title}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <div>
              <h2 className="text-xl font-bold">2. Участници и Ротация</h2>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                Кой тренира в момента и на колко корта?
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <Label>Маркирай играчи</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[250px] overflow-y-auto p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 custom-scrollbar">
                  {initialMembers.map((m) => {
                    const isChecked = settings.activePlayers.some(
                      (p) => p.id === m.id
                    );
                    return (
                      <div key={m.id} className="flex items-center gap-3 py-1">
                        <Checkbox
                          id={`player-${m.id}`}
                          checked={isChecked}
                          onCheckedChange={(c) => {
                            if (c) {
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
                            } else {
                              setSettings({
                                ...settings,
                                activePlayers: settings.activePlayers.filter(
                                  (p) => p.id !== m.id
                                ),
                              });
                            }
                          }}
                        />
                        <label
                          htmlFor={`player-${m.id}`}
                          className="cursor-pointer text-sm font-medium select-none"
                        >
                          {m.firstName} {m.lastName}
                        </label>
                      </div>
                    );
                  })}
                  {initialMembers.length === 0 && (
                    <div className="text-zinc-600 dark:text-zinc-400 text-sm">
                      Няма активни играчи.
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Label>Брой свободни кортове</Label>
                <Input
                  type="number"
                  min={1}
                  value={settings.courtsAvailable}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      courtsAvailable: parseInt(e.target.value) || 1,
                    })
                  }
                />
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                  Ако маркирате повече играчи, отколкото са кортовете, системата
                  автоматично ще ги ротира след всяка серия.
                </p>
                {settings.activePlayers.length > 0 &&
                  settings.activePlayers.length <
                    settings.courtsAvailable * 2 && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 p-3 rounded-lg text-sm mt-4">
                      <strong>Внимание:</strong> За {settings.courtsAvailable}{" "}
                      {settings.courtsAvailable === 1 ? "корт" : "корта"} са
                      необходими поне {settings.courtsAvailable * 2} играчи за
                      пълно натоварване. Възможни са празни места при ротацията.
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <div>
              <h2 className="text-xl font-bold">3. Време и Програма</h2>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                Настройте интервалите на натоварване.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Брой серии</Label>
                <Input
                  type="number"
                  value={settings.sets}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      sets: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Темпо (сек. между команди)</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={settings.paceSec}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      paceSec: parseFloat(e.target.value) || 3,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>
                  {settings.mode === "agility_test"
                    ? "Цел: Брой движения"
                    : "Работа (секунди)"}
                </Label>
                <Input
                  type="number"
                  value={settings.workSec}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      workSec:
                        parseInt(e.target.value) ||
                        (settings.mode === "agility_test" ? 20 : 45),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Почивка (секунди)</Label>
                <Input
                  type="number"
                  value={settings.restSec}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      restSec: parseInt(e.target.value) || 15,
                    })
                  }
                />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <div>
              <h2 className="text-xl font-bold">4. Разширени опции</h2>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                Включете специалните модификатори.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3 bg-zinc-100 dark:bg-zinc-900 p-4 rounded-xl">
                <Checkbox
                  id="deception"
                  checked={settings.deceptionEnabled}
                  onCheckedChange={(c) =>
                    setSettings({ ...settings, deceptionEnabled: !!c })
                  }
                  className="mt-1"
                />
                <div className="space-y-1 leading-none">
                  <label
                    htmlFor="deception"
                    className="font-semibold cursor-pointer"
                  >
                    Измамни удари (Реакция)
                  </label>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Понякога аудиото сменя командата в последния момент,
                    тренирайки баланса и рязкото спиране.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 bg-zinc-100 dark:bg-zinc-900 p-4 rounded-xl">
                <Checkbox
                  id="ai"
                  checked={settings.motivationEnabled}
                  onCheckedChange={(c) =>
                    setSettings({ ...settings, motivationEnabled: !!c })
                  }
                  className="mt-1"
                />
                <div className="space-y-1 leading-none">
                  <label htmlFor="ai" className="font-semibold cursor-pointer">
                    AI Мотивация (Гласово надъхване)
                  </label>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Системата ще изговаря имената на децата (напр. &quot;Давай,
                    Иван!&quot;), за да ги надъхва в края на серията.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 bg-zinc-100 dark:bg-zinc-900 p-4 rounded-xl">
                <Checkbox
                  id="visual"
                  checked={settings.visualOnly}
                  onCheckedChange={(c) =>
                    setSettings({ ...settings, visualOnly: !!c })
                  }
                  className="mt-1"
                />
                <div className="space-y-1 leading-none">
                  <label
                    htmlFor="visual"
                    className="font-semibold cursor-pointer"
                  >
                    Визуален режим (без звук)
                  </label>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Спира звука. Зоната само светва на екрана. Тренира
                    периферното зрение.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 bg-zinc-100 dark:bg-zinc-900 p-4 rounded-xl">
                <Checkbox
                  id="center"
                  checked={settings.centerCommandEnabled}
                  onCheckedChange={(c) =>
                    setSettings({ ...settings, centerCommandEnabled: !!c })
                  }
                  className="mt-1"
                />
                <div className="space-y-1 leading-none">
                  <label
                    htmlFor="center"
                    className="font-semibold cursor-pointer"
                  >
                    Команда &quot;Център&quot;
                  </label>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Системата автоматично ще изисква връщане в центъра по
                    средата на интервала.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <div className="flex justify-between p-4 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950 shrink-0">
        <Button variant="outline" onClick={handlePrev} disabled={step === 1}>
          Назад
        </Button>
        {step < 4 ? (
          <Button
            onClick={() => {
              if (step === 2) {
                if (settings.activePlayers.length === 0) {
                  alert("Моля, изберете поне един играч!");
                  return;
                }
              }
              handleNext();
            }}
          >
            Напред
          </Button>
        ) : (
          <Button
            onClick={() => {
              if (settings.activePlayers.length === 0) {
                alert("Трябва да изберете поне един играч в стъпка 2!");
                setStep(2);
                return;
              }
              handleNext();
            }}
            className="bg-green-600 hover:bg-green-700 text-white font-bold"
          >
            <Play className="w-4 h-4 mr-2" /> СТАРТИРАЙ ТРЕНИРОВКА
          </Button>
        )}
      </div>
    </Card>
  );
}
