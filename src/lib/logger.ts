let Sentry: any = null;
let sentryInitialized = false;

const tryInitSentry = async () => {
  if (sentryInitialized) return;
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  try {
    // dynamic import to avoid hard dependency
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    Sentry = require("@sentry/node");
    Sentry.init({ dsn });
    sentryInitialized = true;
    console.info("Sentry initialized.");
  } catch (err) {
    console.warn("Sentry init failed or not installed:", String(err));
  }
};

const info = (...args: any[]) => {
  console.info(...args);
};

const warn = (...args: any[]) => {
  console.warn(...args);
};

const error = async (...args: any[]) => {
  console.error(...args);
  await tryInitSentry();
  if (sentryInitialized && Sentry) {
    try {
      Sentry.captureException(args[0] instanceof Error ? args[0] : new Error(JSON.stringify(args)));
    } catch (e) {
      console.error("Sentry capture failed:", e);
    }
  }
};

export default { info, warn, error, tryInitSentry };
