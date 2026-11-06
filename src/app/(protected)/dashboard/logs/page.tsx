import { AlertTriangle, Bug, Clock } from "lucide-react";
import { Metadata } from "next";

import { getAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Системен мониторинг | Табло - БК Гълъбово",
  description:
    "Мониторинг на системни грешки, събития и стабилност в реално време.",
};

interface SystemLog {
  id: string;
  message?: string;
  timestamp: string | number | Date;
  path?: string;
  context?: string;
  stack?: string;
}

export default async function SystemLogsPage() {
  let logs: SystemLog[] = [];
  try {
    const db = getAdminDb();
    // Fetch the latest 50 system errors
    const logsSnapshot = await db
      .collection("system_errors")
      .orderBy("timestamp", "desc")
      .limit(50)
      .get();

    logs = logsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as SystemLog[];
  } catch (error) {
    console.error("Failed to fetch system logs:", error);
  }

  return (
    <div className="space-y-4 duration-500 animate-in fade-in">
      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center p-8 sm:p-12 text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Bug className="size-7" />
            </div>
            <h3 className="mb-1 text-base font-bold text-zinc-900 dark:text-white">
              Няма регистрирани системни грешки
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Всички системни модули, квоти и услуги функционират стабилно.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-4 sm:p-5 transition-colors hover:bg-zinc-50/60 dark:hover:bg-zinc-800/20"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1 shrink-0 rounded-lg bg-rose-50 p-1.5 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                    <AlertTriangle className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                      <h4 className="truncate font-semibold text-rose-700 dark:text-rose-400 text-xs sm:text-sm">
                        {log.message}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[11px] whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                        <Clock className="size-3" />
                        {new Date(log.timestamp).toLocaleString("bg-BG")}
                      </div>
                    </div>

                    <div className="mb-3 grid grid-cols-1 gap-2.5 text-xs md:grid-cols-2">
                      <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-2.5 dark:border-zinc-800 dark:bg-zinc-950/60">
                        <span className="mb-1 block text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                          Път (Path)
                        </span>
                        <code className="font-mono text-[11px] break-all text-zinc-800 dark:text-zinc-200">
                          {log.path || "N/A"}
                        </code>
                      </div>
                      <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-2.5 dark:border-zinc-800 dark:bg-zinc-950/60">
                        <span className="mb-1 block text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                          Контекст
                        </span>
                        <span className="text-[11px] text-zinc-800 dark:text-zinc-200">
                          {log.context || "N/A"}
                        </span>
                      </div>
                    </div>

                    {log.stack && (
                      <div className="overflow-x-auto rounded-xl border border-zinc-100 bg-zinc-50/80 p-2.5 dark:border-zinc-800 dark:bg-zinc-950/60">
                        <span className="mb-1 block text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                          Stack Trace
                        </span>
                        <pre className="font-mono text-[10px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                          {log.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
