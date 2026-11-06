import type { Metadata } from "next";
import { Suspense } from "react";

import ScheduleClient from "../ScheduleClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Резервация на кортове | График",
  description: "Дневен график, история и блокиране на кортове.",
};

export default function Page() {
  return (
    <main className="pb-12">
      <Suspense fallback={null}>
        <ScheduleClient mainTab="courts" />
      </Suspense>
    </main>
  );
}
