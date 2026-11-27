"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/context/auth-context";
import {
  ShadowPlayer,
  ShadowSettings,
  useShadowTrainer,
} from "@/hooks/useShadowTrainer";
import { syncShadowAttendanceToScheduleAction } from "@/lib/actions/events";
import { createTrainingSessionAction } from "@/lib/actions/trainings";
import { confirmDialog } from "@/lib/confirm-dialog";
import { preloadAudioForSettings } from "@/lib/shadow-training/audio-map";
import type { TrainingSession } from "@/types/training.types";

import { ShadowActiveScreen } from "./shadow/ShadowActiveScreen";
import { ShadowReportForm } from "./shadow/ShadowReportForm";
import { ShadowSetupForm } from "./shadow/ShadowSetupForm";

interface Props {
  initialMembers?: ShadowPlayer[];
  preselectedMemberId?: string | null;
}

function scrollToTopSmooth() {
  try {
    if (
      typeof window !== "undefined" &&
      typeof window.scrollTo === "function"
    ) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  } catch {
    // Ignore in jsdom environments where window.scrollTo is not implemented
  }
}

type ShadowScreen = "setup" | "training" | "analytics";

function syncViewInUrl(nextScreen: ShadowScreen) {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    if (nextScreen === "training") {
      url.searchParams.set("view", "live");
    } else if (nextScreen === "analytics") {
      url.searchParams.set("view", "report");
    } else {
      url.searchParams.delete("view");
    }
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);
  } catch {
    // Ignore history/URL errors in test environments
  }
}

export function ShadowWizard({
  initialMembers = [],
  preselectedMemberId = null,
}: Props) {
  const { user, idToken: token } = useAuth();

  const [screen, setScreen] = useState<ShadowScreen>("setup");
  const [urlMemberId, setUrlMemberId] = useState<string | null>(
    preselectedMemberId
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
    paceSec: 2.5,
    deceptionEnabled: false,
    motivationEnabled: false,
    visualOnly: false,
    calloutMode: "zones",
    centerCommandEnabled: true,
    activePlayers: [],
    courtsAvailable: 6,
    courtAllocationStrategy: "two_per_court",
    leftHanded: false,
    voiceSpeed: 1.0,
  });

  const [rpeScore, setRpeScore] = useState<number>(5);
  const [rpeNotes, setRpeNotes] = useState("");

  useEffect(() => {
    if (preselectedMemberId) {
      setUrlMemberId(preselectedMemberId);
    }
    if (typeof window !== "undefined") {
      try {
        const params = new URLSearchParams(window.location.search);
        const mId = params.get("memberId");
        if (mId && !preselectedMemberId) setUrlMemberId(mId);

        const view = params.get("view");
        if (view === "live" || view === "training") {
          setScreen("training");
        } else if (view === "report" || view === "analytics") {
          setScreen("analytics");
        }
      } catch {
        // Ignore URL errors
      }
    }
  }, [preselectedMemberId]);

  const trainer = useShadowTrainer(screen === "training" ? settings : null);
  const trainerWithExtras = trainer as typeof trainer & {
    resetTraining?: () => void;
    zoneCounts?: Record<string, number>;
  };

  const changeScreen = useCallback((nextScreen: ShadowScreen) => {
    setScreen(nextScreen);
    syncViewInUrl(nextScreen);
    scrollToTopSmooth();
  }, []);

  const prevTrainerStateRef = useRef(trainer.state);

  useEffect(() => {
    const prevState = prevTrainerStateRef.current;
    prevTrainerStateRef.current = trainer.state;
    if (
      screen === "training" &&
      trainer.state === "finished" &&
      prevState !== "finished"
    ) {
      changeScreen("analytics");
    }
  }, [trainer.state, screen, changeScreen]);

  useEffect(() => {
    if (!settings) return;
    preloadAudioForSettings(settings);
    // Only primitive audio-relevant dependencies so selecting players or courts does not reload audio
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    settings?.drillMode,
    settings?.cornersMode,
    settings?.calloutMode,
    settings?.centerCommandEnabled,
  ]);

  const handleStartTraining = () => {
    if (settings.activePlayers.length === 0) {
      toast.error("Моля, изберете поне един играч!");
      return;
    }
    trainerWithExtras.resetTraining?.();
    prevTrainerStateRef.current = "idle";
    changeScreen("training");
  };

  const handleBackToSetup = () => {
    trainer.stopTraining();
    trainerWithExtras.resetTraining?.();
    prevTrainerStateRef.current = "idle";
    changeScreen("setup");
  };

  const handleSave = async (
    customRpe?: number,
    customNotes?: string,
    individualRpe?: Record<string, number>
  ) => {
    if (!user && !token) return;

    const elapsedSeconds = (trainer.actualElapsedMs || 0) / 1000;
    if (elapsedSeconds < 10) {
      const confirmSave = await confirmDialog(
        `Внимание: Тренировката е продължила само ${Math.round(elapsedSeconds)} секунди. Сигурни ли сте, че искате да я запишете в историята?`
      );
      if (!confirmSave) return;
    }

    try {
      const freshToken = user ? await user.getIdToken() : token || "";
      const finalRpe = typeof customRpe === "number" ? customRpe : rpeScore;
      const finalNotes =
        typeof customNotes === "string" ? customNotes : rpeNotes;

      const rpeScores =
        individualRpe && Object.keys(individualRpe).length > 0
          ? individualRpe
          : settings.activePlayers.reduce(
              (acc, p) => {
                acc[p.id] = finalRpe;
                return acc;
              },
              {} as Record<string, number>
            );

      const zoneCounts = trainerWithExtras.zoneCounts || {};
      const heatmap =
        Object.keys(zoneCounts).length > 0 ? zoneCounts : undefined;

      const payload = {
        siteId: "bkgalabovo",
        type: "shadow" as const,
        date: new Date().toISOString(),
        memberIds: settings.activePlayers.map((p) => p.id),
        scheduleId: settings.scheduleId || undefined,
        durationMs: trainer.actualElapsedMs || 0,
        notes: finalNotes,
        rpeScores,
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
          paceSec: settings.paceSec,
          calloutMode: settings.calloutMode,
          deceptionEnabled: settings.deceptionEnabled,
          leftHanded: settings.leftHanded,
          heatmap,
          agilityActionsDone: trainer.agilityActionsDone,
          agilityTestTimeSec:
            settings.mode === "agility_test"
              ? Math.round((trainer.actualElapsedMs / 1000) * 10) / 10
              : undefined,
          rpeScores,
          individualRpe: rpeScores,
        },
      } as unknown as Omit<TrainingSession, "id" | "createdAt" | "createdBy">;

      const res = (await createTrainingSessionAction(freshToken, payload)) as {
        success?: boolean;
        error?: string;
        message?: string;
      };

      if (res && res.success === false) {
        toast.error(
          res.error || res.message || "Грешка при запис на тренировката."
        );
        return;
      }

      toast.success("Тренировката е записана успешно!");

      // Автоматичен синхрон на присъствията към графика, ако тренировката е стартирана от събитие
      if (settings.scheduleId) {
        try {
          const syncRes = await syncShadowAttendanceToScheduleAction(
            settings.scheduleId,
            settings.activePlayers.map((p) => ({
              id: p.id,
              displayName: p.displayName,
            })),
            freshToken
          );
          if (syncRes.success) {
            toast.success(
              "Присъствията бяха автоматично валидирани в графика!"
            );
          }
        } catch (syncErr) {
          console.error("Schedule sync error:", syncErr);
        }
      }

      setRpeNotes("");
      setRpeScore(5);
      trainer.stopTraining();
      trainerWithExtras.resetTraining?.();
      prevTrainerStateRef.current = "idle";
      changeScreen("setup");
    } catch (e: unknown) {
      console.error("Save training error:", e);
      toast.error("Възникна грешка при запазване в базата данни.");
    }
  };

  const handleDiscard = () => {
    setRpeNotes("");
    setRpeScore(5);
    trainer.stopTraining();
    trainerWithExtras.resetTraining?.();
    prevTrainerStateRef.current = "idle";
    changeScreen("setup");
    toast.info("Сесията беше приключена без запазване.");
  };

  if (screen === "analytics") {
    return (
      <ShadowReportForm
        rpeScore={rpeScore}
        setRpeScore={setRpeScore}
        rpeNotes={rpeNotes}
        setRpeNotes={setRpeNotes}
        onSave={handleSave}
        onDiscard={handleDiscard}
        settings={settings}
        actualElapsedMs={trainer.actualElapsedMs}
        completedSets={trainer.currentSet}
        agilityActionsDone={trainer.agilityActionsDone}
        zoneCounts={trainerWithExtras.zoneCounts || {}}
      />
    );
  }

  if (screen === "training") {
    return (
      <ShadowActiveScreen
        trainer={trainer}
        settings={settings}
        onBackToSetup={handleBackToSetup}
      />
    );
  }

  return (
    <ShadowSetupForm
      initialMembers={initialMembers}
      settings={settings}
      setSettings={setSettings}
      onStartTraining={handleStartTraining}
      preselectedMemberId={urlMemberId}
    />
  );
}
