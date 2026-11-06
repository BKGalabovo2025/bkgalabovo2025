"use client";

import { useTheme } from "next-themes";
import * as React from "react";

/**
 * Dynamically keeps the mobile browser top notch, address bar, and status bar
 * in sync with the current theme (both in light and dark mode, and when toggled).
 */
export function ThemeColorMeta() {
  const { resolvedTheme } = useTheme();

  React.useEffect(() => {
    const isDark = resolvedTheme === "dark";
    const barColor = isDark ? "#09090b" : "#ffffff";

    // 1. Update standard theme-color meta tag
    let metaTheme = document.querySelector(
      'meta[name="theme-color"]:not([media])'
    );
    if (!metaTheme) {
      metaTheme = document.createElement("meta");
      metaTheme.setAttribute("name", "theme-color");
      document.head.appendChild(metaTheme);
    }
    metaTheme.setAttribute("content", barColor);

    // 2. Update iOS Safari status bar style meta tag
    let metaApple = document.querySelector(
      'meta[name="apple-mobile-web-app-status-bar-style"]'
    );
    if (!metaApple) {
      metaApple = document.createElement("meta");
      metaApple.setAttribute("name", "apple-mobile-web-app-status-bar-style");
      document.head.appendChild(metaApple);
    }
    metaApple.setAttribute("content", isDark ? "black-translucent" : "default");
  }, [resolvedTheme]);

  return null;
}
