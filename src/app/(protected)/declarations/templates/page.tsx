import { Metadata } from "next";
import { Suspense } from "react";

import DeclarationsClient from "../DeclarationsClient";

export const metadata: Metadata = {
  title: "Шаблони за декларации | БК Гълъбово",
  description: "Празни бланки на декларации за информирано съгласие за печат.",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <DeclarationsClient section="templates" />
    </Suspense>
  );
}
