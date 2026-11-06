import type { Metadata } from "next";
import { Suspense } from "react";

import ScheduleClient from "../ScheduleClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Резервация за възстановяване | График",
  description: "Резервации за възстановителни процедури в Recovery Zone.",
};

export default function Page() {
  return (
    <main className="pb-12">
      <Suspense fallback={null}>
        <ScheduleClient mainTab="recovery" />
      </Suspense>
    </main>
  );
}
