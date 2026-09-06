import { AlertTriangle, Bug, Clock, TerminalSquare } from "lucide-react";

import { getAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

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
    <div className="mx-auto max-w-6xl space-y-8 p-6 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2 flex items-center gap-3 text-3xl font-semibold tracking-tight text-white">
            <TerminalSquare className="text-zinc-500" />
            Системни Логове
          </h1>
          <p className="text-sm text-zinc-400">
            Мониторинг на грешки и проблеми възникнали в системата.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center p-12 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
              <Bug size={32} />
            </div>
            <h3 className="mb-1 text-lg font-medium text-white">
              Няма регистрирани грешки
            </h3>
            <p className="text-sm text-zinc-500">Системата работи нормално.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/50">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-6 transition-colors hover:bg-zinc-800/20"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1 shrink-0">
                    <AlertTriangle className="text-red-500" size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <h4 className="truncate font-medium text-red-400">
                        {log.message}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs whitespace-nowrap text-zinc-500">
                        <Clock size={14} />
                        {new Date(log.timestamp).toLocaleString("bg-BG")}
                      </div>
                    </div>

                    <div className="mb-4 grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                      <div className="rounded-lg border border-zinc-800/50 bg-zinc-950 p-3">
                        <span className="mb-1 block text-xs tracking-wider text-zinc-500 uppercase">
                          Път (Path)
                        </span>
                        <code className="font-mono text-xs break-all text-zinc-300">
                          {log.path || "N/A"}
                        </code>
                      </div>
                      <div className="rounded-lg border border-zinc-800/50 bg-zinc-950 p-3">
                        <span className="mb-1 block text-xs tracking-wider text-zinc-500 uppercase">
                          Контекст
                        </span>
                        <span className="text-xs text-zinc-300">
                          {log.context || "N/A"}
                        </span>
                      </div>
                    </div>

                    {log.stack && (
                      <div className="overflow-x-auto rounded-lg border border-zinc-800/50 bg-zinc-950 p-3">
                        <span className="mb-2 block text-xs tracking-wider text-zinc-500 uppercase">
                          Stack Trace
                        </span>
                        <pre className="font-mono text-[10px] leading-relaxed text-zinc-400">
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
