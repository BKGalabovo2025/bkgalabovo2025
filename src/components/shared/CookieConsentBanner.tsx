"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

export const COOKIE_CONSENT_KEY = "cookie_consent_v1";
export type CookieConsentValue = "accepted" | "essential";

export function getCookieConsent(): CookieConsentValue | null {
  if (typeof window === "undefined") return null;
  try {
    const val = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    return val === "accepted" || val === "essential" ? val : null;
  } catch {
    return null;
  }
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!getCookieConsent()) {
      setVisible(true);
    }
  }, []);

  const saveChoice = (choice: CookieConsentValue) => {
    try {
      window.localStorage.setItem(COOKIE_CONSENT_KEY, choice);
      window.dispatchEvent(
        new CustomEvent("cookie-consent-changed", { detail: choice })
      );
    } catch {
      // Ignore storage errors in private mode
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside
      aria-label="Съгласие за бисквитки"
      className="fixed bottom-4 z-50 mx-auto max-w-2xl rounded-2xl border border-zinc-200 bg-white/95 p-4 shadow-2xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95 inset-x-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
          Използваме само необходими бисквитки за работата на портала, а с ваше
          съгласие — и аналитика (Vercel Analytics) и превод (Google Translate).
          Вижте нашата{" "}
          <Link
            href="/privacy-policy"
            className="font-semibold text-blue-600 underline hover:text-blue-500 dark:text-blue-400"
          >
            Политика за поверителност
          </Link>
          .
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => saveChoice("essential")}
            className="h-8 rounded-xl text-xs"
          >
            Само необходими
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => saveChoice("accepted")}
            className="h-8 rounded-xl bg-blue-600 text-xs text-white hover:bg-blue-500"
          >
            Приемам всички
          </Button>
        </div>
      </div>
    </aside>
  );
}
