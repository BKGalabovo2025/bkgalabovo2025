"use client";

import { History, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { getActiveShadowSection, SHADOW_SECTIONS } from "./shadow-sections";

export function ShadowNav() {
  const pathname = usePathname() || "/training/shadow";
  const activeId = getActiveShadowSection(pathname);

  return (
    <TooltipProvider delayDuration={300}>
      <nav
        aria-label="Секции за Shadow Training"
        className="w-full overflow-x-auto pb-1 [-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden"
      >
        <div className="inline-flex min-w-full items-center gap-1 rounded-2xl border border-zinc-200/80 bg-zinc-100/90 p-1.5 sm:min-w-0 sm:w-fit dark:border-zinc-800 dark:bg-zinc-900/60">
          {SHADOW_SECTIONS.map((item) => {
            const isActive = item.id === activeId;
            const Icon = item.id === "history" ? History : Sparkles;

            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold whitespace-nowrap transition-all sm:flex-initial",
                      isActive
                        ? "bg-white text-zinc-950 shadow-xs dark:bg-zinc-800 dark:text-white"
                        : "text-zinc-600 hover:bg-white/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/40 dark:hover:text-zinc-200"
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-3.5 shrink-0",
                        isActive
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-zinc-400 dark:text-zinc-500"
                      )}
                    />
                    <span>{item.label}</span>
                  </Link>
                </TooltipTrigger>
                {item.tooltip && (
                  <TooltipContent
                    side="bottom"
                    className="max-w-xs text-center text-xs"
                  >
                    <p>{item.tooltip}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </div>
      </nav>
    </TooltipProvider>
  );
}
