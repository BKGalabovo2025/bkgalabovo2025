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
        className={`size-10 rounded-xl border border-zinc-200 bg-white shadow-xs transition-all hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900 ${className || ""}`}
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
      className={`size-10 rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-xs transition-all hover:bg-zinc-100 active:scale-95 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 ${className || ""}`}
    >
      {isDark ? (
        <Sun className="size-4.5 text-amber-400 transition-transform hover:rotate-45" />
      ) : (
        <Moon className="size-4.5 text-zinc-700 transition-transform hover:-rotate-12" />
      )}
    </Button>
  );
}
