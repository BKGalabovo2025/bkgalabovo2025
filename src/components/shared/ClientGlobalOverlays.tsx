"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

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
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Defer non-critical global overlays until browser is idle so initial hydration stays fast on mobile
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const id = (
        window as unknown as {
          requestIdleCallback: (
            cb: () => void,
            opts?: { timeout: number }
          ) => number;
          cancelIdleCallback: (id: number) => void;
        }
      ).requestIdleCallback(() => setReady(true), { timeout: 4000 });
      return () =>
        (
          window as unknown as { cancelIdleCallback: (id: number) => void }
        ).cancelIdleCallback(id);
    }
    const timer = setTimeout(() => setReady(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (!ready) return null;

  return (
    <>
      <OfflineStatusIndicator />
      <Toaster richColors closeButton position="top-right" />
    </>
  );
}
