"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

/**
 * Returns a back-navigation handler for member document subpages.
 * Uses browser history when available, otherwise navigates to fallbackHref
 * (defaulting to `/members/${memberId}/documents`).
 */
export function useMemberBackNavigation(
  memberId: string,
  fallbackHref?: string
) {
  const router = useRouter();

  return useCallback(() => {
    const targetFallback = fallbackHref ?? `/members/${memberId}/documents`;

    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(targetFallback);
    }
  }, [router, memberId, fallbackHref]);
}
