"use client";

import { Analytics } from "@vercel/analytics/next";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import {
  CookieConsentBanner,
  getCookieConsent,
} from "@/components/shared/CookieConsentBanner";
import { GlobalConfirmDialog } from "@/components/shared/GlobalConfirmDialog";

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
  const [analyticsConsented, setAnalyticsConsented] = useState(false);

  useEffect(() => {
    setAnalyticsConsented(getCookieConsent() === "accepted");
    const onConsentChange = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      setAnalyticsConsented(detail === "accepted");
    };
    window.addEventListener("cookie-consent-changed", onConsentChange);
    return () =>
      window.removeEventListener("cookie-consent-changed", onConsentChange);
  }, []);

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

  return (
    <>
      <GlobalConfirmDialog />
      <CookieConsentBanner />
      {ready && (
        <>
          <OfflineStatusIndicator />
          <Toaster richColors closeButton position="top-right" />
          {analyticsConsented &&
            process.env.NODE_ENV === "production" &&
            process.env.VERCEL && <Analytics />}
        </>
      )}
    </>
  );
}
