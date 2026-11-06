"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";

import { Button } from "@/components/ui/button";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    if (!mounted) return;
    const current = resolvedTheme || theme;
    if (current === "dark") {
      setTheme("light");
    } else {
      setTheme("dark");
    }
  };

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label="Превключване на тема"
        className={`size-10 rounded-xl border border-zinc-300 bg-white shadow-xs transition-all hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800 ${className || ""}`}
      >
        <span className="size-4 opacity-0" />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      title={isDark ? "Превключи на светла тема" : "Превключи на тъмна тема"}
      aria-label={
        isDark ? "Превключи на светла тема" : "Превключи на тъмна тема"
      }
      className={`size-10 rounded-xl border border-zinc-300 bg-white text-zinc-900 shadow-xs transition-all hover:bg-zinc-100 active:scale-95 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 ${className || ""}`}
    >
      {isDark ? (
        <Sun className="size-4.5 text-amber-400 transition-transform hover:rotate-45" />
      ) : (
        <Moon className="size-4.5 text-zinc-700 dark:text-zinc-200 transition-transform hover:-rotate-12" />
      )}
    </Button>
  );
}
