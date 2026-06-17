import { Suspense } from "react";
import ScheduleClient from "./ScheduleClient";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default function SchedulePage() {
  return (
    <main className="pb-12">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center py-40 space-y-6">
            <Loader2
              className="h-12 w-12 animate-spin text-primary opacity-20"
              strokeWidth={1}
            />
            <p className="text-zinc-400 font-medium uppercase tracking-[0.2em] text-[10px]">
              Зареждане на график...
            </p>
          </div>
        }
      >
        <ScheduleClient />
      </Suspense>
    </main>
  );
}
