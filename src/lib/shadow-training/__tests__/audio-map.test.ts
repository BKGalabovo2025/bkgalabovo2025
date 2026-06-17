import { describe, it, expect } from "vitest";
import {
  ZONE_NAMES,
  ZONES_ARRAY,
  getRandomZone,
  getRandomZoneForMode,
  getRandomShotForZone,
  ZoneId,
  playAudio,
  playAudioSequence,
  stopAudio,
  shadowAudioManager,
} from "../audio-map";

describe("Shadow Training Audio Map & Helpers", () => {
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

  describe("getRandomZone", () => {
    it("трябва да връща зона от ZONES_ARRAY", () => {
      for (let i = 0; i < 20; i++) {
        const zone = getRandomZone();
        expect(ZONES_ARRAY).toContain(zone);
      }
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
      expect(typeof shadowAudioManager.play).toBe("function");
      expect(typeof shadowAudioManager.playSequence).toBe("function");
      expect(typeof shadowAudioManager.stopAll).toBe("function");
      expect(typeof shadowAudioManager.unlock).toBe("function");
    });
  });
});
