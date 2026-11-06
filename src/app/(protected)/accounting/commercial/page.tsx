export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Suspense } from "react";

import AccountingClient from "../AccountingClient";

export const metadata: Metadata = {
  title: "Стопанска дейност | Счетоводни отчети",
  description:
    "Командировки и разходи по стопанска дейност с месечни отчети и експорт.",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AccountingClient section="commercial" />
    </Suspense>
  );
}
