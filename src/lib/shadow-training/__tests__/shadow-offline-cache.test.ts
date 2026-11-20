import { describe, expect, it } from "vitest";

import {
  checkShadowOfflineStatus,
  getAllShadowAudioPaths,
  SHADOW_CACHE_NAME,
} from "../shadow-offline-cache";

describe("shadow-offline-cache", () => {
  it("връща точно 32 уникални звукови пътя към MP3 файловете", () => {
    const paths = getAllShadowAudioPaths();
    expect(paths).toHaveLength(32);

    // Всички трябва да завършват на .mp3
    paths.forEach((p) => {
      expect(p.endsWith(".mp3")).toBe(true);
      expect(p.startsWith("/shadow/")).toBe(true);
    });

    // Проверка за ключови файлове
    expect(paths).toContain("/shadow/common/podgotvi_se.mp3");
    expect(paths).toContain("/shadow/common/pochivka.mp3");
    expect(paths).toContain("/shadow/common/krai.mp3");
    expect(paths).toContain("/shadow/zones/forhend_mrezha.mp3");
    expect(paths).toContain("/shadow/shots/smach_po_prava.mp3");
  });

  it("проверява офлайн статуса и дефинира коректно име на кеша", async () => {
    expect(SHADOW_CACHE_NAME).toBe("shadow-audio-offline-v1");
    const status = await checkShadowOfflineStatus();
    expect(status.totalCount).toBe(32);
    expect(typeof status.isOnline).toBe("boolean");
  });
});
