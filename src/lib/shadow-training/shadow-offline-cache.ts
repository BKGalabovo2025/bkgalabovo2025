import { AUDIO_PATHS } from "./audio-map";
import { shadowLogger } from "./shadow-logger";

export const SHADOW_CACHE_NAME = "shadow-audio-offline-v1";

/**
 * Връща списък с уникалните пътища към всички 32 MP3 звукови файла за Shadow Training.
 */
export function getAllShadowAudioPaths(): string[] {
  const paths = new Set<string>();

  // 1. Основни системни команди (7 броя)
  Object.values(AUDIO_PATHS.common).forEach((path) => {
    if (path) paths.add(path);
  });

  // 2. Зони на корта (7 броя)
  Object.values(AUDIO_PATHS.zones).forEach((path) => {
    if (path) paths.add(path);
  });

  // 3. Специфични удари (18 броя)
  Object.values(AUDIO_PATHS.shots).forEach((path) => {
    if (path) paths.add(path);
  });

  return Array.from(paths);
}

export interface ShadowOfflineStatus {
  isFullyCached: boolean;
  cachedCount: number;
  totalCount: number;
  isOnline: boolean;
  cacheSupported: boolean;
}

/**
 * Проверява колко от аудио файловете са налични в браузърния Cache Storage.
 */
export async function checkShadowOfflineStatus(): Promise<ShadowOfflineStatus> {
  const allPaths = getAllShadowAudioPaths();
  const totalCount = allPaths.length;
  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

  if (typeof window === "undefined" || !("caches" in window)) {
    return {
      isFullyCached: false,
      cachedCount: 0,
      totalCount,
      isOnline,
      cacheSupported: false,
    };
  }

  try {
    const cache = await caches.open(SHADOW_CACHE_NAME);
    let cachedCount = 0;

    for (const path of allPaths) {
      const match = await cache.match(path);
      if (match) {
        cachedCount++;
      }
    }

    return {
      isFullyCached: cachedCount >= totalCount,
      cachedCount,
      totalCount,
      isOnline,
      cacheSupported: true,
    };
  } catch (err) {
    shadowLogger.audio("Грешка при проверка на офлайн кеша:", err);
    return {
      isFullyCached: false,
      cachedCount: 0,
      totalCount,
      isOnline,
      cacheSupported: true,
    };
  }
}

/**
 * Сваля и кешира предварително всички 32 звукови файла в Cache Storage,
 * за да гарантира 100% автономна работа на треньора в спортни зали без интернет.
 */
export async function cacheAllShadowAudio(
  onProgress?: (current: number, total: number) => void
): Promise<{ success: boolean; cachedCount: number; totalCount: number }> {
  const allPaths = getAllShadowAudioPaths();
  const totalCount = allPaths.length;

  if (typeof window === "undefined") {
    return { success: false, cachedCount: 0, totalCount };
  }

  // Ако Cache API е налично (PWA стандарт)
  if ("caches" in window) {
    try {
      const cache = await caches.open(SHADOW_CACHE_NAME);
      let loaded = 0;

      await Promise.all(
        allPaths.map(async (path) => {
          try {
            // Първо проверяваме дали вече не е кеширан
            const existing = await cache.match(path);
            if (!existing) {
              const res = await fetch(path, { cache: "reload" });
              if (res.ok) {
                await cache.put(path, res);
              }
            }
            loaded++;
            onProgress?.(loaded, totalCount);
          } catch (fetchErr) {
            shadowLogger.audio(`Неуспешно кеширане на ${path}:`, fetchErr);
          }
        })
      );

      const status = await checkShadowOfflineStatus();
      shadowLogger.audio(
        `📦 Офлайн кеширането завърши: ${status.cachedCount}/${totalCount} файла са локално запазени.`
      );
      return {
        success: status.cachedCount >= totalCount,
        cachedCount: status.cachedCount,
        totalCount,
      };
    } catch (cacheErr) {
      shadowLogger.audio("Грешка при запис в Cache Storage:", cacheErr);
    }
  }

  // Fallback: предварително зареждане през Audio елементи в браузърната памет
  let memoryLoaded = 0;
  await Promise.all(
    allPaths.map((path) => {
      return new Promise<void>((resolve) => {
        try {
          const audio = new Audio();
          audio.preload = "auto";
          audio.src = path;
          audio.oncanplaythrough = () => {
            memoryLoaded++;
            onProgress?.(memoryLoaded, totalCount);
            resolve();
          };
          audio.onerror = () => {
            resolve();
          };
          audio.load();
        } catch {
          resolve();
        }
      });
    })
  );

  return {
    success: memoryLoaded > 0,
    cachedCount: memoryLoaded,
    totalCount,
  };
}
