"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

const HIGHLIGHT_CLASSES = [
  "ring-2",
  "ring-blue-500",
  "ring-offset-2",
  "dark:ring-offset-zinc-950",
];
const HIGHLIGHT_MS = 3500;

/**
 * Скролира и временно маркира елемент, към който сочи директен линк.
 *
 * Поддържа `?id=<id>` (или допълнителен параметър, напр. `?expenseId=<id>`)
 * и хеш `#<prefix>-<id>`. Елементът трябва да има `id="<prefix>-<id>"`.
 */
export function useDeepLinkHighlight(
  prefix: string,
  ready: boolean,
  extraParam?: string
): void {
  const searchParams = useSearchParams();
  const targetId =
    (extraParam ? searchParams.get(extraParam) : null) ??
    searchParams.get("id");

  useEffect(() => {
    if (!ready) return;

    const hashId =
      typeof window !== "undefined" &&
      window.location.hash.startsWith(`#${prefix}-`)
        ? window.location.hash.slice(1)
        : null;
    const elementId = targetId ? `${prefix}-${targetId}` : hashId;
    if (!elementId) return;

    let clearTimer: ReturnType<typeof setTimeout> | undefined;
    const startTimer = setTimeout(() => {
      const candidates = document.querySelectorAll(`[id="${elementId}"]`);
      if (candidates.length === 0) return;

      // Предпочитаме видим елемент (при отделни рендери за мобилен и десктоп екран)
      let el: HTMLElement | null = null;
      for (let i = 0; i < candidates.length; i++) {
        const item = candidates[i] as HTMLElement;
        if (
          item.offsetParent !== null ||
          window.getComputedStyle(item).display !== "none"
        ) {
          el = item;
          break;
        }
      }
      if (!el) el = candidates[0] as HTMLElement;

      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add(...HIGHLIGHT_CLASSES);
      clearTimer = setTimeout(
        () => el?.classList.remove(...HIGHLIGHT_CLASSES),
        HIGHLIGHT_MS
      );
    }, 150);

    return () => {
      clearTimeout(startTimer);
      if (clearTimer) clearTimeout(clearTimer);
    };
  }, [prefix, ready, targetId]);
}
