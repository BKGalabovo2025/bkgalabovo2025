type LogLevel = "debug" | "info" | "warn" | "error";

interface LogPayload {
  level: LogLevel;
  message: string;
  context?: string;
  meta?: Record<string, unknown>;
  timestamp: string;
}

const isProduction = process.env.NODE_ENV === "production";
const isDebugEnabled = process.env.LOG_LEVEL === "debug";

function emitLog(payload: LogPayload) {
  if (payload.level === "debug" && isProduction && !isDebugEnabled) {
    return;
  }

  const serialized = JSON.stringify(payload);
  switch (payload.level) {
    case "error":
      console.error(serialized);
      break;
    case "warn":
      console.warn(serialized);
      break;
    default:
      if (!isProduction || isDebugEnabled) {
        console.log(serialized);
      }
      break;
  }
}

export const logger = {
  debug(message: string, context?: string, meta?: Record<string, unknown>) {
    emitLog({
      level: "debug",
      message,
      context,
      meta,
      timestamp: new Date().toISOString(),
    });
  },
  info(message: string, context?: string, meta?: Record<string, unknown>) {
    emitLog({
      level: "info",
      message,
      context,
      meta,
      timestamp: new Date().toISOString(),
    });
  },
  warn(message: string, context?: string, meta?: Record<string, unknown>) {
    emitLog({
      level: "warn",
      message,
      context,
      meta,
      timestamp: new Date().toISOString(),
    });
  },
  error(
    message: string,
    context?: string,
    error?: unknown,
    meta?: Record<string, unknown>
  ) {
    const errMeta =
      error instanceof Error
        ? { errorName: error.name, errorMessage: error.message }
        : error !== undefined
          ? { errorValue: String(error) }
          : undefined;
    emitLog({
      level: "error",
      message,
      context,
      meta: { ...meta, ...errMeta },
      timestamp: new Date().toISOString(),
    });
  },
};
