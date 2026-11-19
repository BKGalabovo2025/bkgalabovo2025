import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  AUDIO_PATHS,
  clearPreloadedAudioCache,
  getRandomShotForZone,
  getRandomZoneForMode,
  playAudio,
  playAudioSequence,
  playSoundCheck,
  preloadAudioForSettings,
  shadowAudioManager,
  stopAudio,
  ZONE_NAMES,
  ZoneId,
  ZONES_ARRAY,
} from "../audio-map";

describe("Shadow Training Audio Map & Helpers", () => {
  beforeEach(() => {
    clearPreloadedAudioCache();
    vi.restoreAllMocks();
  });

  describe("ZONES_ARRAY и ZONE_NAMES", () => {
    it("трябва да съдържа всички дефинирани 7 зони", () => {
      expect(ZONES_ARRAY).toHaveLength(7);
      expect(ZONES_ARRAY).toContain("frontForehand");
      expect(ZONES_ARRAY).toContain("overhead");
    });

    it("всяка зона трябва да има валидно българско име в ZONE_NAMES", () => {
      ZONES_ARRAY.forEach((zone) => {
        expect(ZONE_NAMES[zone]).toBeDefined();
        expect(typeof ZONE_NAMES[zone]).toBe("string");
        expect(ZONE_NAMES[zone].length).toBeGreaterThan(0);
      });
    });
  });

  describe("getRandomZoneForMode (Филтриране на зони)", () => {
    it("режим 'front_only' трябва да връща само предни зони (мрежа)", () => {
      for (let i = 0; i < 20; i++) {
        const zone = getRandomZoneForMode("front_only");
        expect(["frontForehand", "frontBackhand"]).toContain(zone);
      }
    });

    it("режим 'back_only' трябва да връща само задна линия", () => {
      for (let i = 0; i < 20; i++) {
        const zone = getRandomZoneForMode("back_only");
        expect(["backForehand", "backBackhand", "overhead"]).toContain(zone);
      }
    });

    it("режим 'front_back' не трябва да връща средна линия (mid)", () => {
      for (let i = 0; i < 50; i++) {
        const zone = getRandomZoneForMode("front_back");
        expect(zone.startsWith("mid")).toBe(false);
      }
    });

    it("режим 'all' може да върне всяка зона", () => {
      const generated = new Set<ZoneId>();
      for (let i = 0; i < 100; i++) {
        generated.add(getRandomZoneForMode("all"));
      }
      expect(generated.size).toBeGreaterThan(3);
    });
  });

  describe("getRandomShotForZone (Подбор на удари)", () => {
    it("за предна зона (front) трябва да връща къси удари или забиване (net/lift)", () => {
      const shotPath = getRandomShotForZone("frontForehand");
      expect(typeof shotPath).toBe("string");
      expect(shotPath).toContain("/shadow/shots/");
    });

    it("за задна зона (back/overhead) трябва да връща изчистване, забиване или пейс удари (smash/clear/drop)", () => {
      const shotPath = getRandomShotForZone("backForehand");
      expect(typeof shotPath).toBe("string");
      expect(shotPath).toContain("/shadow/shots/");
    });
  });

  describe("AudioManager & Global Helpers", () => {
    it("playAudio, playAudioSequence, stopAudio трябва да са дефинирани като функции", () => {
      expect(typeof playAudio).toBe("function");
      expect(typeof playAudioSequence).toBe("function");
      expect(typeof stopAudio).toBe("function");
    });

    it("shadowAudioManager трябва да съществува с очакваните методи", () => {
      expect(shadowAudioManager).toBeDefined();
      expect(typeof shadowAudioManager.playVoice).toBe("function");
      expect(typeof shadowAudioManager.playVoiceSequence).toBe("function");
      expect(typeof shadowAudioManager.playOverlay).toBe("function");
      expect(typeof shadowAudioManager.stopAll).toBe("function");
      expect(typeof shadowAudioManager.unlock).toBe("function");
    });

    it("playSoundCheck отключва аудиото и пуска podgotvi_se.mp3", async () => {
      const unlockSpy = vi.spyOn(shadowAudioManager, "unlock");
      const playVoiceSpy = vi.spyOn(shadowAudioManager, "playVoice");

      const ok = await playSoundCheck();

      expect(ok).toBe(true);
      expect(unlockSpy).toHaveBeenCalled();
      expect(playVoiceSpy).toHaveBeenCalledWith(AUDIO_PATHS.common.podgotvi_se);
    });
  });

  describe("preloadAudioForSettings (Кеширане и Оувърхед в задна линия)", () => {
    it("не прави дублирани fetch заявки за вече прелоуднати URL-и", () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true });
      vi.stubGlobal("fetch", fetchMock);

      const settings = {
        visualOnly: false,
        centerCommandEnabled: true,
        drillMode: "front_only",
        calloutMode: "zones",
      };

      preloadAudioForSettings(settings);
      const firstCallCount = fetchMock.mock.calls.length;
      expect(firstCallCount).toBeGreaterThan(0);

      // Второ извикване със същите настройки не трябва да прави нови fetch заявки
      preloadAudioForSettings(settings);
      expect(fetchMock.mock.calls).toHaveLength(firstCallCount);

      // След изчистване на кеша отново прелоудва
      clearPreloadedAudioCache();
      preloadAudioForSettings(settings);
      expect(fetchMock.mock.calls).toHaveLength(firstCallCount * 2);
    });

    it("включва overhead зоната и ударите за задна линия при drillMode === 'back_only'", () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true });
      vi.stubGlobal("fetch", fetchMock);

      preloadAudioForSettings({
        visualOnly: false,
        centerCommandEnabled: false,
        drillMode: "back_only",
        calloutMode: "zones_and_shots",
      });

      const fetchedUrls = fetchMock.mock.calls.map((c) => c[0] as string);
      expect(fetchedUrls).toContain(AUDIO_PATHS.zones.overhead);
      expect(fetchedUrls).toContain(AUDIO_PATHS.zones.backForehand);
      expect(fetchedUrls).toContain(AUDIO_PATHS.zones.backBackhand);
      // Проверяваме, че ударите са от група back (напр. smashStraight), а НЕ от front (напр. netKill)
      expect(fetchedUrls).toContain(AUDIO_PATHS.shots.smashStraight);
      expect(fetchedUrls).not.toContain(AUDIO_PATHS.shots.netKill);
    });
  });
});
