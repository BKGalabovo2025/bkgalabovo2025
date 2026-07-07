"use client";

import { useState, useEffect } from "react";

import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import {
  useShadowTrainer,
  ShadowSettings,
  ShadowPlayer,
} from "@/hooks/useShadowTrainer";
import { createTrainingSessionAction } from "@/lib/actions/trainings";
import { preloadAudioForSettings } from "@/lib/shadow-training/audio-map";

// Import the new split components
import { ShadowSetupForm } from "./shadow/ShadowSetupForm";
import { ShadowActiveScreen } from "./shadow/ShadowActiveScreen";
import { ShadowReportForm } from "./shadow/ShadowReportForm";
import type { TrainingSession } from "@/types/training.types";

interface Props {
  initialMembers?: ShadowPlayer[];
}

export function ShadowWizard({ initialMembers = [] }: Props) {
  const { user } = useAuth();

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
    restSec: 30,
    paceSec: 3,
    deceptionEnabled: false,
    motivationEnabled: false,
    visualOnly: false,
    calloutMode: "zones",
    centerCommandEnabled: true,
    activePlayers: [],
    courtsAvailable: 1,
  });

  const [rpeScore, setRpeScore] = useState<number>(5);
  const [rpeNotes, setRpeNotes] = useState("");

  const trainer = useShadowTrainer(screen === "training" ? settings : null);

  useEffect(() => {
    if (screen === "training" && trainer.state === "finished") {
      setScreen("analytics");
    }
  }, [trainer.state, screen]);

  useEffect(() => {
    if (screen === "setup" && settings.activePlayers.length > 0) {
      preloadAudioForSettings(settings);
    }
  }, [screen, settings]);

  const handleStartTraining = () => {
    if (settings.activePlayers.length === 0) {
      toast.error("Моля, изберете поне един играч!");
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
      const rpeScores = settings.activePlayers.reduce(
        (acc, p) => {
          acc[p.id] = rpeScore;
          return acc;
        },
        {} as Record<string, number>
      );

      const payload = {
        siteId: "bkgalabovo",
        type: "shadow" as const,
        date: new Date().toISOString(),
        memberIds: settings.activePlayers.map((p) => p.id),
        durationMs: trainer.actualElapsedMs || 0,
        notes: rpeNotes,
        shadowDetails: {
          mode: settings.mode,
          preset: settings.preset,
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
      } as unknown as Omit<TrainingSession, "id" | "createdAt" | "createdBy">;

      // 1. Оптимистичен UI - Светкавично нулиране и обратна връзка!
      toast.success("Тренировката е записана успешно!");

      // Нулираме данните от последната сесия за всеки случай
      setRpeNotes("");
      setRpeScore(5);

      // Нулираме състоянието на таймера и ротацията в хука
      trainer.stopTraining();

      // Връщаме потребителя веднага на екрана с настройки
      setScreen("setup");

      // 2. Асинхронно запазване (background task) - без await
      createTrainingSessionAction(token, payload).catch((e) => {
        console.error("Save training background error:", e);
        toast.error("Възникна грешка при запазване в базата данни.");
      });
    } catch (e: unknown) {
      console.error("Preparation error:", e);
      toast.error("Възникна грешка при подготовката на данните.");
    }
  };

  if (screen === "analytics") {
    return (
      <ShadowReportForm
        rpeScore={rpeScore}
        setRpeScore={setRpeScore}
        rpeNotes={rpeNotes}
        setRpeNotes={setRpeNotes}
        onSave={handleSave}
        settings={settings}
        actualElapsedMs={trainer.actualElapsedMs}
        completedSets={trainer.currentSet}
        agilityActionsDone={trainer.agilityActionsDone}
      />
    );
  }

  if (screen === "training") {
    return <ShadowActiveScreen trainer={trainer} settings={settings} />;
  }

  return (
    <ShadowSetupForm
      initialMembers={initialMembers}
      settings={settings}
      setSettings={setSettings}
      onStartTraining={handleStartTraining}
    />
  );
}
