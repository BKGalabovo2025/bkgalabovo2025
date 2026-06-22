import { getAdminDb } from "@/lib/firebase-admin";
import { AlertTriangle, Clock, Bug, TerminalSquare } from "lucide-react";

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
  const db = getAdminDb();

  // Fetch the latest 50 system errors
  const logsSnapshot = await db
    .collection("system_errors")
    .orderBy("timestamp", "desc")
    .limit(50)
    .get();

  const logs = logsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as SystemLog[];

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white mb-2 flex items-center gap-3">
            <TerminalSquare className="text-zinc-500" />
            Системни Логове
          </h1>
          <p className="text-zinc-400 text-sm">
            Мониторинг на грешки и проблеми възникнали в системата.
          </p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="h-16 w-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-4">
              <Bug size={32} />
            </div>
            <h3 className="text-lg font-medium text-white mb-1">
              Няма регистрирани грешки
            </h3>
            <p className="text-zinc-500 text-sm">Системата работи нормално.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/50">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-6 hover:bg-zinc-800/20 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1 shrink-0">
                    <AlertTriangle className="text-red-500" size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <h4 className="text-red-400 font-medium truncate">
                        {log.message}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500 whitespace-nowrap">
                        <Clock size={14} />
                        {new Date(log.timestamp).toLocaleString("bg-BG")}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                      <div className="bg-zinc-950 rounded-lg p-3 border border-zinc-800/50">
                        <span className="text-zinc-500 block mb-1 text-xs uppercase tracking-wider">
                          Път (Path)
                        </span>
                        <code className="text-zinc-300 font-mono text-xs break-all">
                          {log.path || "N/A"}
                        </code>
                      </div>
                      <div className="bg-zinc-950 rounded-lg p-3 border border-zinc-800/50">
                        <span className="text-zinc-500 block mb-1 text-xs uppercase tracking-wider">
                          Контекст
                        </span>
                        <span className="text-zinc-300 text-xs">
                          {log.context || "N/A"}
                        </span>
                      </div>
                    </div>

                    {log.stack && (
                      <div className="bg-zinc-950 rounded-lg p-3 border border-zinc-800/50 overflow-x-auto">
                        <span className="text-zinc-500 block mb-2 text-xs uppercase tracking-wider">
                          Stack Trace
                        </span>
                        <pre className="text-zinc-400 font-mono text-[10px] leading-relaxed">
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
