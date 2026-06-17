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

// This would normally fetch real members. Using dummy logic for Wizard UX demo.
// In real life, fetch members from a store or context.
const dummyMembers = [
  { id: "1", displayName: "Иван Иванов" },
  { id: "2", displayName: "Георги Георгиев" },
];

export function ShadowWizard() {
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
    activePlayers: dummyMembers,
    courtsAvailable: 1,
  });

  const trainer = useShadowTrainer(step === 5 ? settings : null);

  const handleNext = () => setStep(s => s + 1);
  const handlePrev = () => setStep(s => s - 1);

  const handleSave = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      await createTrainingSessionAction(token, {
        siteId: "bkgalabovo",
        type: "shadow",
        date: new Date().toISOString(),
        memberIds: settings.activePlayers.map(p => p.id),
        durationMs: (settings.workSec + settings.restSec) * settings.sets * 1000,
        shadowDetails: {
          mode: settings.mode,
          preset: settings.preset as any,
          setsCompleted: trainer.currentSet,
          totalSets: settings.sets,
          workTimeSec: settings.workSec,
          restTimeSec: settings.restSec,
          deceptionEnabled: settings.deceptionEnabled,
        }
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
               <Button size="lg" onClick={handleSave} className="bg-white text-green-900 hover:bg-zinc-200">
                 <Save className="mr-2 h-5 w-5" />
                 Запази в историята
               </Button>
            </div>
          )}

          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
              
              <div className="flex-1 w-full space-y-6">
                <div className="text-center md:text-left">
                  <p className="text-zinc-400 uppercase tracking-widest text-sm font-semibold mb-1">
                    {trainer.state === "countdown" ? "Приготви се..." : 
                     trainer.state === "working" ? "РАБОТА" : 
                     trainer.state === "resting" ? "ПОЧИВКА" : 
                     trainer.state === "paused" ? "ПАУЗА" : ""}
                  </p>
                  <div className="text-8xl font-black tabular-nums tracking-tighter">
                    {trainer.timeRemaining}
                  </div>
                  <p className="text-zinc-400 text-lg mt-2">
                    Серия {trainer.currentSet} от {settings.sets}
                  </p>
                </div>

                <div className="bg-zinc-800/50 p-4 rounded-xl">
                  <h3 className="text-xs text-zinc-500 uppercase tracking-wider mb-2">На корта в момента:</h3>
                  <div className="flex flex-wrap gap-2">
                    {trainer.currentRotationPlayers.map((p, i) => (
                      <div key={i} className="px-3 py-1.5 bg-primary/20 text-primary rounded-md text-sm font-medium">
                        {p.displayName}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  {trainer.state === "idle" ? (
                    <Button size="lg" className="w-full h-14 text-lg" onClick={trainer.startTraining}>
                      <Play className="mr-2" /> СТАРТ
                    </Button>
                  ) : (
                    <>
                      {trainer.state === "paused" ? (
                        <Button size="lg" variant="default" className="flex-1 h-14" onClick={trainer.resumeTraining}>
                          ПРОДЪЛЖИ
                        </Button>
                      ) : (
                        <Button size="lg" variant="outline" className="flex-1 h-14 text-zinc-900" onClick={trainer.pauseTraining}>
                          <Pause className="mr-2" /> ПАУЗА
                        </Button>
                      )}
                      <Button size="lg" variant="destructive" className="flex-1 h-14" onClick={trainer.stopTraining}>
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
    <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm">
      <CardContent className="p-6 space-y-8">
        {/* Wizard Progress */}
        <div className="flex items-center justify-between mb-8 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full z-0" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full z-0 transition-all duration-300" style={{ width: `${((step - 1) / 3) * 100}%` }} />
          
          {[1, 2, 3, 4].map(num => (
            <div key={num} className={`w-8 h-8 rounded-full flex items-center justify-center z-10 transition-colors duration-300 font-bold text-sm ${step >= num ? "bg-primary text-primary-foreground" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500"}`}>
              {num}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <div>
              <h2 className="text-xl font-bold">1. Режим на тренировка</h2>
              <p className="text-zinc-500 text-sm">Изберете типа на натоварването.</p>
            </div>
            
            <div className="space-y-3">
              {[
                { id: "standard", title: "Стандартен", desc: "Свободна тренировка с фиксиран таймер и равномерни команди." },
                { id: "ghost_match", title: "Ghost Match", desc: "Симулация на реален мач. Разиграванията и паузите са с различна дължина." },
                { id: "agility_test", title: "Скоростен Тест", desc: "Тест за време на 20 зони. Измерва скоростта на придвижване." },
              ].map(mode => (
                <div key={mode.id} 
                     onClick={() => setSettings({ ...settings, mode: mode.id as any })}
                     className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${settings.mode === mode.id ? "border-primary bg-primary/5" : "border-transparent bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800"}`}>
                  <h3 className="font-semibold">{mode.title}</h3>
                  <p className="text-sm text-zinc-500 mt-1">{mode.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <div>
              <h2 className="text-xl font-bold">2. Участници и Ротация</h2>
              <p className="text-zinc-500 text-sm">Кой тренира в момента и на колко корта?</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Брой свободни кортове</Label>
                <Input 
                  type="number" 
                  min={1} 
                  value={settings.courtsAvailable} 
                  onChange={e => setSettings({...settings, courtsAvailable: parseInt(e.target.value) || 1})} 
                />
                <p className="text-xs text-zinc-500">
                  Ако маркирате повече играчи, отколкото са кортовете, системата автоматично ще ги ротира след всяка серия.
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <div>
              <h2 className="text-xl font-bold">3. Време и Програма</h2>
              <p className="text-zinc-500 text-sm">Настройте интервалите на натоварване.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Брой серии</Label>
                <Input type="number" value={settings.sets} onChange={e => setSettings({...settings, sets: parseInt(e.target.value) || 1})} />
              </div>
              <div className="space-y-2">
                <Label>Темпо (сек. между команди)</Label>
                <Input type="number" step="0.5" value={settings.paceSec} onChange={e => setSettings({...settings, paceSec: parseFloat(e.target.value) || 3})} />
              </div>
              <div className="space-y-2">
                <Label>Работа (секунди)</Label>
                <Input type="number" value={settings.workSec} onChange={e => setSettings({...settings, workSec: parseInt(e.target.value) || 45})} />
              </div>
              <div className="space-y-2">
                <Label>Почивка (секунди)</Label>
                <Input type="number" value={settings.restSec} onChange={e => setSettings({...settings, restSec: parseInt(e.target.value) || 15})} />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <div>
              <h2 className="text-xl font-bold">4. Разширени опции (God-Tier)</h2>
              <p className="text-zinc-500 text-sm">Включете специалните модификатори.</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3 bg-zinc-100 dark:bg-zinc-900 p-4 rounded-xl">
                <Checkbox 
                  id="deception" 
                  checked={settings.deceptionEnabled} 
                  onCheckedChange={(c) => setSettings({...settings, deceptionEnabled: !!c})}
                  className="mt-1"
                />
                <div className="space-y-1 leading-none">
                  <label htmlFor="deception" className="font-semibold cursor-pointer">Измамни удари (Deception)</label>
                  <p className="text-sm text-zinc-500">Понякога аудиото сменя командата в последния момент, тренирайки баланса и рязкото спиране.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 bg-zinc-100 dark:bg-zinc-900 p-4 rounded-xl">
                <Checkbox 
                  id="ai" 
                  checked={settings.motivationEnabled} 
                  onCheckedChange={(c) => setSettings({...settings, motivationEnabled: !!c})}
                  className="mt-1"
                />
                <div className="space-y-1 leading-none">
                  <label htmlFor="ai" className="font-semibold cursor-pointer">AI Мотивация (Глас)</label>
                  <p className="text-sm text-zinc-500">Системата ще изговаря имената на децата (напр. "Давай, Иван!"), за да ги надъхва в края на серията.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 bg-zinc-100 dark:bg-zinc-900 p-4 rounded-xl">
                <Checkbox 
                  id="visual" 
                  checked={settings.visualOnly} 
                  onCheckedChange={(c) => setSettings({...settings, visualOnly: !!c})}
                  className="mt-1"
                />
                <div className="space-y-1 leading-none">
                  <label htmlFor="visual" className="font-semibold cursor-pointer">Visual Reaction Mode (Без звук)</label>
                  <p className="text-sm text-zinc-500">Спира звука. Зоната само светва на екрана. Тренира периферното зрение.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={handlePrev} disabled={step === 1}>Назад</Button>
          {step < 4 ? (
            <Button onClick={handleNext}>Напред</Button>
          ) : (
            <Button onClick={handleNext} className="bg-green-600 hover:bg-green-700 text-white font-bold">
              <Play className="w-4 h-4 mr-2" /> СТАРТИРАЙ ТРЕНИРОВКА
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
