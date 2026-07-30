import { Loader2 } from "lucide-react";
import { Suspense } from "react";

import ScheduleClient from "./ScheduleClient";

export const dynamic = "force-dynamic";

export default function SchedulePage() {
  return (
    <main className="pb-12">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center space-y-6 py-40">
            <Loader2
              className="size-12 animate-spin text-primary opacity-20"
              strokeWidth={1}
            />
            <p className="text-[10px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
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
