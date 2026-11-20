"use client";

import dynamic from "next/dynamic";

const Toaster = dynamic(() => import("sonner").then((mod) => mod.Toaster), {
  ssr: false,
});

const OfflineStatusIndicator = dynamic(
  () =>
    import("@/components/shared/OfflineStatusIndicator").then(
      (mod) => mod.OfflineStatusIndicator
    ),
  { ssr: false }
);

export function ClientGlobalOverlays() {
  return (
    <>
      <OfflineStatusIndicator />
      <Toaster richColors closeButton position="top-right" />
    </>
  );
}
