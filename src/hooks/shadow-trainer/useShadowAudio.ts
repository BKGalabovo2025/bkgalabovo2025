import { useCallback, useEffect, useMemo } from "react";

import {
  isAudioPlaying,
  playAudio,
  playAudioSequence,
  queueRecoveryAudio,
  shadowAudioManager,
  stopAudio as stopAudioEngine,
  stopVoiceAudio,
} from "@/lib/shadow-training/audio-map";

import { ShadowPlayer } from "./types";

export function useShadowAudio(voiceSpeed?: number) {
  useEffect(() => {
    if (
      voiceSpeed !== undefined &&
      typeof shadowAudioManager.setVoiceSpeed === "function"
    ) {
      shadowAudioManager.setVoiceSpeed(voiceSpeed);
    }
  }, [voiceSpeed]);

  const unlock = useCallback(() => {
    shadowAudioManager.unlock();
  }, []);

  const stop = useCallback(() => {
    stopAudioEngine();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  }, []);

  const setVoiceSpeed = useCallback((speed?: number) => {
    if (typeof shadowAudioManager.setVoiceSpeed === "function") {
      shadowAudioManager.setVoiceSpeed(speed);
    }
  }, []);

  const triggerMotivation = useCallback(
    (
      currentPlayers: ShadowPlayer[],
      motivationEnabled: boolean,
      customVoiceSpeed?: number
    ) => {
      if (!motivationEnabled) return;
      if (typeof window === "undefined" || !("speechSynthesis" in window))
        return;
      if (isAudioPlaying()) return;

      if (currentPlayers.length > 0) {
        const randomPlayer =
          currentPlayers[Math.floor(Math.random() * currentPlayers.length)];
        if (!randomPlayer?.displayName) return;

        const firstName = randomPlayer.displayName.split(" ")[0] || "играч";
        const phrases = [
          `Давай, ${firstName}!`,
          `Още малко, ${firstName}!`,
          `Дръж стойката, ${firstName}!`,
        ];
        const text = phrases[Math.floor(Math.random() * phrases.length)];

        const msg = new SpeechSynthesisUtterance(text);
        msg.lang = "bg-BG";
        const rate = customVoiceSpeed ?? voiceSpeed;
        if (typeof rate === "number" && Number.isFinite(rate) && rate > 0) {
          msg.rate = Math.max(0.5, Math.min(2.0, rate));
        }
        window.speechSynthesis.speak(msg);
      }
    },
    [voiceSpeed]
  );

  return useMemo(
    () => ({
      play: playAudio,
      playSequence: playAudioSequence,
      queueRecovery: queueRecoveryAudio,
      playSyntheticBeep: (freq = 800, dur = 0.08) =>
        shadowAudioManager.playSyntheticBeep(freq, dur),
      stop,
      stopAudio: stop,
      stopVoiceOnly: stopVoiceAudio,
      isPlaying: isAudioPlaying,
      unlock,
      triggerMotivation,
      setVoiceSpeed,
    }),
    [unlock, stop, triggerMotivation, setVoiceSpeed]
  );
}
