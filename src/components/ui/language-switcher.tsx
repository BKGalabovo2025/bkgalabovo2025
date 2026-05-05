"use client";

import { useLanguage } from "@/context/language-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const LanguageSwitcher = ({ className }: { className?: string }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={cn("flex bg-slate-100 p-1 rounded-xl gap-1", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLanguage("bg")}
        className={cn(
          "px-3 py-1 text-xs font-bold rounded-lg transition-all",
          language === "bg" ? "bg-white shadow-sm" : "text-slate-500"
        )}
      >
        BG
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLanguage("en")}
        className={cn(
          "px-3 py-1 text-xs font-bold rounded-lg transition-all",
          language === "en" ? "bg-white shadow-sm" : "text-slate-500"
        )}
      >
        EN
      </Button>
    </div>
  );
};
