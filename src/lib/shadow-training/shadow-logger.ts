/**
 * Dedicated Forensic Logger for Shadow Training (Интерактивен треньор за движения по корта)
 *
 * Provides high-contrast, formatted console logs for:
 *  - [🏸 SETUP]   : Configurations, presets, player selection
 *  - [⚡ TRAINER] : Drill states, target zones, strokes, rotations, pace
 *  - [⏱️ TIMER]   : Countdown ticks, series duration, rest intervals
 *  - [🔊 AUDIO]   : Web Audio API, voice cues, overlay hops, center recovery
 *
 * Also maintains an in-memory ring buffer accessible via window.__EXPORT_SHADOW_LOGS__()
 */

export interface ShadowLogEntry {
  timestamp: string;
  category:
    | "SETUP"
    | "TRAINER"
    | "TIMER"
    | "AUDIO"
    | "COURT"
    | "DIAG"
    | "WARN"
    | "ERROR";
  event: string;
  data?: unknown;
}

const MAX_LOG_BUFFER = 200;
const logHistory: ShadowLogEntry[] = [];

function getTimestamp(): string {
  const d = new Date();
  const pad = (n: number, z = 2) => String(n).padStart(z, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
}

function recordLog(
  category: ShadowLogEntry["category"],
  event: string,
  data?: unknown
) {
  const entry: ShadowLogEntry = {
    timestamp: getTimestamp(),
    category,
    event,
    data: data ? JSON.parse(JSON.stringify(data)) : undefined,
  };

  logHistory.push(entry);
  if (logHistory.length > MAX_LOG_BUFFER) {
    logHistory.shift();
  }
}

// Global hooks in browser window for diagnostics and inspection
if (typeof window !== "undefined") {
  (window as unknown as { __SHADOW_LOGS__: ShadowLogEntry[] }).__SHADOW_LOGS__ =
    logHistory;
  (
    window as unknown as { __EXPORT_SHADOW_LOGS__: () => string }
  ).__EXPORT_SHADOW_LOGS__ = () => {
    return JSON.stringify(logHistory, null, 2);
  };
  (window as unknown as { __SHADOW_HEALTH__: () => void }).__SHADOW_HEALTH__ =
    () => {
      const mgr = (
        globalThis as unknown as {
          __shadowAudioManager__?: {
            voiceAudio?: HTMLAudioElement;
            overlayAudio?: HTMLAudioElement;
            audioCtx?: AudioContext;
          };
        }
      ).__shadowAudioManager__;
      const report = {
        AudioContextState: mgr?.audioCtx?.state || "unlocked/native",
        VoiceAudio: {
          src: mgr?.voiceAudio?.src || "none",
          paused: mgr?.voiceAudio?.paused ?? true,
          playbackRate: mgr?.voiceAudio?.playbackRate ?? 1.0,
        },
        OverlayAudio: {
          src: mgr?.overlayAudio?.src || "none",
          paused: mgr?.overlayAudio?.paused ?? true,
        },
        ScreenWakeLock:
          typeof navigator !== "undefined" && "wakeLock" in navigator
            ? "Supported"
            : "Not supported",
        DocumentVisible:
          typeof document !== "undefined"
            ? document.visibilityState === "visible"
            : true,
        BufferedLogsCount: logHistory.length,
      };
      console.table(report);
      return report;
    };
}

const BADGE_STYLES = {
  SETUP:
    "background: #0284c7; color: #ffffff; font-weight: 800; padding: 2px 6px; border-radius: 4px;",
  TRAINER:
    "background: #6366f1; color: #ffffff; font-weight: 800; padding: 2px 6px; border-radius: 4px;",
  TIMER:
    "background: #d97706; color: #ffffff; font-weight: 800; padding: 2px 6px; border-radius: 4px;",
  AUDIO:
    "background: #059669; color: #ffffff; font-weight: 800; padding: 2px 6px; border-radius: 4px;",
  COURT:
    "background: #7c3aed; color: #ffffff; font-weight: 800; padding: 2px 6px; border-radius: 4px;",
  DIAG: "background: #0891b2; color: #ffffff; font-weight: 800; padding: 2px 6px; border-radius: 4px;",
  WARN: "background: #ea580c; color: #ffffff; font-weight: 800; padding: 2px 6px; border-radius: 4px;",
  ERROR:
    "background: #e11d48; color: #ffffff; font-weight: 800; padding: 2px 6px; border-radius: 4px;",
};

const TEXT_STYLES = {
  SETUP: "color: #38bdf8; font-weight: 600;",
  TRAINER: "color: #818cf8; font-weight: 600;",
  TIMER: "color: #fbbf24; font-weight: 600;",
  AUDIO: "color: #34d399; font-weight: 600;",
  COURT: "color: #c4b5fd; font-weight: 600;",
  DIAG: "color: #22d3ee; font-weight: 600;",
  WARN: "color: #fb923c; font-weight: 600;",
  ERROR: "color: #f87171; font-weight: 700;",
};

export const shadowLogger = {
  setup(event: string, data?: unknown) {
    const ts = getTimestamp();
    recordLog("SETUP", event, data);
    if (typeof window === "undefined") return;
    if (data !== undefined) {
      console.log(
        `%c[🏸 SETUP %c${ts}]%c ${event}`,
        BADGE_STYLES.SETUP,
        "color: #94a3b8; font-weight: normal; font-size: 10px;",
        TEXT_STYLES.SETUP,
        data
      );
    } else {
      console.log(
        `%c[🏸 SETUP %c${ts}]%c ${event}`,
        BADGE_STYLES.SETUP,
        "color: #94a3b8; font-weight: normal; font-size: 10px;",
        TEXT_STYLES.SETUP
      );
    }
  },

  trainer(event: string, data?: unknown) {
    const ts = getTimestamp();
    recordLog("TRAINER", event, data);
    if (typeof window === "undefined") return;
    if (data !== undefined) {
      console.log(
        `%c[⚡ TRAINER %c${ts}]%c ${event}`,
        getBadgeStyle("TRAINER"),
        "color: #94a3b8; font-weight: normal; font-size: 10px;",
        TEXT_STYLES.TRAINER,
        data
      );
    } else {
      console.log(
        `%c[⚡ TRAINER %c${ts}]%c ${event}`,
        getBadgeStyle("TRAINER"),
        "color: #94a3b8; font-weight: normal; font-size: 10px;",
        TEXT_STYLES.TRAINER
      );
    }
  },

  timer(event: string, data?: unknown) {
    const ts = getTimestamp();
    recordLog("TIMER", event, data);
    if (typeof window === "undefined") return;
    if (data !== undefined) {
      console.log(
        `%c[⏱️ TIMER %c${ts}]%c ${event}`,
        BADGE_STYLES.TIMER,
        "color: #94a3b8; font-weight: normal; font-size: 10px;",
        TEXT_STYLES.TIMER,
        data
      );
    } else {
      console.log(
        `%c[⏱️ TIMER %c${ts}]%c ${event}`,
        BADGE_STYLES.TIMER,
        "color: #94a3b8; font-weight: normal; font-size: 10px;",
        TEXT_STYLES.TIMER
      );
    }
  },

  audio(event: string, data?: unknown) {
    const ts = getTimestamp();
    recordLog("AUDIO", event, data);
    if (typeof window === "undefined") return;
    if (data !== undefined) {
      console.log(
        `%c[🔊 AUDIO %c${ts}]%c ${event}`,
        BADGE_STYLES.AUDIO,
        "color: #94a3b8; font-weight: normal; font-size: 10px;",
        TEXT_STYLES.AUDIO,
        data
      );
    } else {
      console.log(
        `%c[🔊 AUDIO %c${ts}]%c ${event}`,
        BADGE_STYLES.AUDIO,
        "color: #94a3b8; font-weight: normal; font-size: 10px;",
        TEXT_STYLES.AUDIO
      );
    }
  },

  court(event: string, data?: unknown) {
    const ts = getTimestamp();
    recordLog("COURT", event, data);
    if (typeof window === "undefined") return;
    if (data !== undefined) {
      console.log(
        `%c[🏟️ COURT %c${ts}]%c ${event}`,
        BADGE_STYLES.COURT,
        "color: #94a3b8; font-weight: normal; font-size: 10px;",
        TEXT_STYLES.COURT,
        data
      );
    } else {
      console.log(
        `%c[🏟️ COURT %c${ts}]%c ${event}`,
        BADGE_STYLES.COURT,
        "color: #94a3b8; font-weight: normal; font-size: 10px;",
        TEXT_STYLES.COURT
      );
    }
  },

  diagnostic(event: string, data?: unknown) {
    const ts = getTimestamp();
    recordLog("DIAG", event, data);
    if (typeof window === "undefined") return;
    if (data !== undefined) {
      console.log(
        `%c[🛠️ ДИАГНОСТИКА %c${ts}]%c ${event}`,
        BADGE_STYLES.DIAG,
        "color: #94a3b8; font-weight: normal; font-size: 10px;",
        TEXT_STYLES.DIAG,
        data
      );
    } else {
      console.log(
        `%c[🛠️ ДИАГНОСТИКА %c${ts}]%c ${event}`,
        BADGE_STYLES.DIAG,
        "color: #94a3b8; font-weight: normal; font-size: 10px;",
        TEXT_STYLES.DIAG
      );
    }
  },

  warn(event: string, data?: unknown) {
    const ts = getTimestamp();
    recordLog("WARN", event, data);
    if (typeof window === "undefined") return;
    console.warn(
      `%c[⚠️ WARN %c${ts}]%c ${event}`,
      BADGE_STYLES.WARN,
      "color: #94a3b8; font-weight: normal; font-size: 10px;",
      TEXT_STYLES.WARN,
      data ?? ""
    );
  },

  error(event: string, error?: unknown, data?: unknown) {
    const ts = getTimestamp();
    recordLog("ERROR", event, { error: String(error), details: data });
    if (typeof window === "undefined") return;
    console.error(
      `%c[❌ ERROR %c${ts}]%c ${event}`,
      BADGE_STYLES.ERROR,
      "color: #94a3b8; font-weight: normal; font-size: 10px;",
      TEXT_STYLES.ERROR,
      error,
      data ?? ""
    );
  },

  getHistory(): ShadowLogEntry[] {
    return [...logHistory];
  },

  clearHistory() {
    logHistory.length = 0;
  },
};

function getBadgeStyle(cat: keyof typeof BADGE_STYLES) {
  return BADGE_STYLES[cat] || BADGE_STYLES.TRAINER;
}
