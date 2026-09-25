import { useCallback, useMemo } from "react";

import {
  isAudioPlaying,
  playAudio,
  playAudioSequence,
  queueRecoveryAudio,
  shadowAudioManager,
  stopAudio,
  stopVoiceAudio,
} from "@/lib/shadow-training/audio-map";

import { ShadowPlayer } from "./types";

export function useShadowAudio() {
  const unlock = useCallback(() => {
    shadowAudioManager.unlock();
  }, []);

  const triggerMotivation = useCallback(
    (currentPlayers: ShadowPlayer[], motivationEnabled: boolean) => {
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
        window.speechSynthesis.speak(msg);
      }
    },
    []
  );

  return useMemo(
    () => ({
      play: playAudio,
      playSequence: playAudioSequence,
      queueRecovery: queueRecoveryAudio,
      playSyntheticBeep: (freq = 800, dur = 0.08) =>
        shadowAudioManager.playSyntheticBeep(freq, dur),
      stop: stopAudio,
      stopVoiceOnly: stopVoiceAudio,
      isPlaying: isAudioPlaying,
      unlock,
      triggerMotivation,
    }),
    [unlock, triggerMotivation]
  );
}
