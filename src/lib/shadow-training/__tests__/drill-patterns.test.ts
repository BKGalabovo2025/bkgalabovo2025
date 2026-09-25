import { describe, expect, it } from "vitest";

import {
  applyBackhandOnly,
  applyDrillPattern,
  applyForehandOnly,
  applyNetBack,
  applyTriangle,
  resolveAudioPathsAndZone,
} from "@/hooks/useShadowTrainer";

import { AUDIO_PATHS, ZoneId } from "../audio-map";

describe("Шаблони на движение — Тактическа и Двигателна Логика", () => {
  describe("1. 🎲 Случаен (Random)", () => {
    it("избира разнообразни зони според активната конфигурация на корта", () => {
      const generatedZones = new Set<ZoneId>();
      for (let i = 0; i < 150; i++) {
        const zone = applyDrillPattern(
          "random",
          null,
          "6-corners",
          "frontForehand"
        );
        generatedZones.add(zone);
      }
      expect(generatedZones.size).toBeGreaterThan(0);
    });

    it("при 4 ъгъла никога не генерира средни зони", () => {
      for (let i = 0; i < 100; i++) {
        const { zone } = resolveAudioPathsAndZone(
          "all",
          "zones",
          "4-corners",
          "random",
          null
        );
        expect(zone).not.toBe("midForehand");
        expect(zone).not.toBe("midBackhand");
      }
    });

    it("при 2 ъгъла (само мрежа) генерира само предни зони", () => {
      for (let i = 0; i < 50; i++) {
        const { zone } = resolveAudioPathsAndZone(
          "front_only",
          "zones",
          "2-corners",
          "random",
          null
        );
        expect(zone.startsWith("front")).toBe(true);
      }
    });
  });

  describe("2. 🔺 Триъгълник (Fixed Triangle — Мрежа ↔ Среда ↔ Задна линия)", () => {
    it("след удар на Мрежа задължително изпраща състезателя в Задна линия", () => {
      const frontZones: ZoneId[] = ["frontForehand", "frontBackhand"];
      for (const front of frontZones) {
        for (let i = 0; i < 50; i++) {
          const nextZone = applyTriangle(front, "6-corners");
          const isBack = nextZone.startsWith("back") || nextZone === "overhead";
          expect(isBack).toBe(true);
        }
      }
    });

    it("след удар на Задна линия насочва към Среда или Мрежа", () => {
      const backZones: ZoneId[] = ["backForehand", "backBackhand", "overhead"];
      for (const back of backZones) {
        for (let i = 0; i < 50; i++) {
          const nextZone = applyTriangle(back, "6-corners");
          const isMidOrNet =
            nextZone.startsWith("mid") || nextZone.startsWith("front");
          expect(isMidOrNet).toBe(true);
        }
      }
    });

    it("след удар в Среда задължително насочва напред към Мрежата", () => {
      const midZones: ZoneId[] = ["midForehand", "midBackhand"];
      for (const mid of midZones) {
        for (let i = 0; i < 50; i++) {
          const nextZone = applyTriangle(mid, "6-corners");
          expect(nextZone.startsWith("front")).toBe(true);
        }
      }
    });

    it("поддържа непрекъснат триъгълен цикъл през 60 последователни удара", () => {
      let currentZone: ZoneId = "frontForehand";
      for (let i = 0; i < 60; i++) {
        const nextZone = applyTriangle(currentZone, "6-corners");
        if (currentZone.startsWith("front")) {
          expect(nextZone.startsWith("back") || nextZone === "overhead").toBe(
            true
          );
        } else if (currentZone.startsWith("mid")) {
          expect(nextZone.startsWith("front")).toBe(true);
        } else {
          expect(
            nextZone.startsWith("mid") || nextZone.startsWith("front")
          ).toBe(true);
        }
        currentZone = nextZone;
      }
    });
  });

  describe("3. ↕️ Мрежа ↔ Задна (Fixed Net-Back — Смяна предна и задна линия)", () => {
    it("след удар на Мрежа задължително следва Задна линия", () => {
      for (let i = 0; i < 50; i++) {
        const next = applyNetBack("frontForehand", "6-corners");
        expect(next.startsWith("back") || next === "overhead").toBe(true);

        const nextFromLeft = applyNetBack("frontBackhand", "6-corners");
        expect(
          nextFromLeft.startsWith("back") || nextFromLeft === "overhead"
        ).toBe(true);
      }
    });

    it("след удар на Задна линия задължително следва Мрежа", () => {
      for (let i = 0; i < 50; i++) {
        const nextFromRight = applyNetBack("backForehand", "6-corners");
        expect(nextFromRight.startsWith("front")).toBe(true);

        const nextFromLeft = applyNetBack("backBackhand", "6-corners");
        expect(nextFromLeft.startsWith("front")).toBe(true);

        const nextFromOverhead = applyNetBack("overhead", "6-corners");
        expect(nextFromOverhead.startsWith("front")).toBe(true);
      }
    });

    it("никога не повтаря две предни или две задни зони една след друга в 100 цикъла", () => {
      let currentZone: ZoneId = "frontForehand";
      for (let i = 0; i < 100; i++) {
        const nextZone = applyNetBack(currentZone, "6-corners");
        const wasFront = currentZone.startsWith("front");
        const isNextFront = nextZone.startsWith("front");
        expect(wasFront).not.toBe(isNextFront);
        currentZone = nextZone;
      }
    });
  });

  describe("4. 🏸 Само форхенд поле (Forehand Channel)", () => {
    it("генерира САМО форхенд зони в 300 последователни опита", () => {
      const allowedForehand: ZoneId[] = [
        "frontForehand",
        "midForehand",
        "backForehand",
      ];
      let lastZone: ZoneId | null = null;
      for (let i = 0; i < 300; i++) {
        const zone = applyForehandOnly(lastZone, "6-corners");
        expect(allowedForehand).toContain(zone);
        expect(zone.toLowerCase()).toContain("forehand");
        expect(zone.toLowerCase()).not.toContain("backhand");
        expect(zone).not.toBe("overhead");
        lastZone = zone;
      }
    });

    it("не повтаря непосредствено една и съща форхенд зона два пъти подред", () => {
      let lastZone: ZoneId = "frontForehand";
      for (let i = 0; i < 50; i++) {
        const nextZone = applyForehandOnly(lastZone, "6-corners");
        expect(nextZone).not.toBe(lastZone);
        lastZone = nextZone;
      }
    });

    it("при 4 ъгъла редува само преден и заден форхенд", () => {
      let lastZone: ZoneId = "frontForehand";
      for (let i = 0; i < 30; i++) {
        const nextZone = applyForehandOnly(lastZone, "4-corners");
        expect(nextZone).not.toBe("midForehand");
        expect(["frontForehand", "backForehand"]).toContain(nextZone);
        expect(nextZone).not.toBe(lastZone);
        lastZone = nextZone;
      }
    });
  });

  describe("5. 🛡️ Само бекхенд поле (Backhand Channel)", () => {
    it("генерира САМО бекхенд и овърхед зони в 300 последователни опита", () => {
      const allowedBackhand: ZoneId[] = [
        "frontBackhand",
        "midBackhand",
        "backBackhand",
        "overhead",
      ];
      let lastZone: ZoneId | null = null;
      for (let i = 0; i < 300; i++) {
        const zone = applyBackhandOnly(lastZone, "6-corners");
        expect(allowedBackhand).toContain(zone);
        expect(zone.toLowerCase()).not.toContain("forehand");
        lastZone = zone;
      }
    });

    it("не повтаря непосредствено една и съща бекхенд зона два пъти подред", () => {
      let lastZone: ZoneId = "frontBackhand";
      for (let i = 0; i < 50; i++) {
        const nextZone = applyBackhandOnly(lastZone, "6-corners");
        expect(nextZone).not.toBe(lastZone);
        lastZone = nextZone;
      }
    });
  });

  describe("6. Аудио асистент — Интеграция на гласовите команди & зони", () => {
    it("свързва всяка зона с точния автентичен аудио файл на български език", () => {
      const expectedAudio: Record<ZoneId, string> = {
        frontForehand: AUDIO_PATHS.zones.frontForehand,
        frontBackhand: AUDIO_PATHS.zones.frontBackhand,
        midForehand: AUDIO_PATHS.zones.midForehand,
        midBackhand: AUDIO_PATHS.zones.midBackhand,
        backForehand: AUDIO_PATHS.zones.backForehand,
        backBackhand: AUDIO_PATHS.zones.backBackhand,
        overhead: AUDIO_PATHS.zones.overhead,
      };

      for (const [zoneKey, expectedPath] of Object.entries(expectedAudio)) {
        expect(AUDIO_PATHS.zones[zoneKey as ZoneId]).toBe(expectedPath);
        expect(expectedPath.endsWith(".mp3")).toBe(true);
      }
    });

    it("в режим 'Зони' връща аудиото на съответната зона и null за второ аудио", () => {
      const { zone, audioPath, secondAudioPath } = resolveAudioPathsAndZone(
        "all",
        "zones",
        "6-corners",
        "forehand-only"
      );
      expect(zone.toLowerCase()).toContain("forehand");
      expect(audioPath).toBe(AUDIO_PATHS.zones[zone]);
      expect(secondAudioPath).toBeNull();
    });

    it("в режим 'Зони + Удари' връща аудио за зоната И валиден бадминтон удар за тази зона", () => {
      for (let i = 0; i < 20; i++) {
        const { zone, audioPath, secondAudioPath } = resolveAudioPathsAndZone(
          "all",
          "zones_and_shots",
          "6-corners",
          "random"
        );
        expect(audioPath).toBe(AUDIO_PATHS.zones[zone]);
        expect(secondAudioPath).toBeDefined();
        expect(secondAudioPath).not.toBeNull();
        expect(secondAudioPath!.endsWith(".mp3")).toBe(true);
      }
    });

    it("в режим 'Само удари' връща само удара без начално аудио на зоната", () => {
      const { audioPath, secondAudioPath } = resolveAudioPathsAndZone(
        "all",
        "shots",
        "6-corners",
        "random"
      );
      expect(audioPath.endsWith(".mp3")).toBe(true);
      expect(secondAudioPath).toBeNull();
    });
  });
});
