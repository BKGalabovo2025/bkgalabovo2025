import { Suspense } from "react";

import GeneralServicesClient from "./GeneralServicesClient";

export const dynamic = "force-dynamic";

export default function GeneralServicesPage() {
  return (
    <Suspense fallback={null}>
      <GeneralServicesClient />
    </Suspense>
  );
}
