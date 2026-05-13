"use client";

import * as React from "react";
import { useAppStore } from "@/store/use-app-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MapPin, ChevronDown, Loader2 } from "lucide-react";
import { getAllSites } from "@/services/site-service";
import { Site } from "@/types/site.types";
import { cn } from "@/lib/utils";

export function BranchSelector() {
  const { activeBranch, setActiveBranch } = useAppStore();
  const [sites, setSites] = React.useState<Site[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadSites() {
      try {
        const data = await getAllSites();
        setSites(data);
      } catch (error) {
        console.error("Failed to load sites:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadSites();
  }, []);

  const activeSite = sites.find((s) => s.id === activeBranch);
  const isRecovery = activeBranch === "recoveryzone";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-2 h-10 border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md shadow-sm transition-all hover:bg-white dark:hover:bg-zinc-900",
            isRecovery
              ? "hover:border-purple-200 dark:hover:border-purple-900"
              : "hover:border-blue-200 dark:hover:border-blue-900"
          )}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
          ) : (
            <MapPin
              className={cn(
                "h-4 w-4",
                isRecovery ? "text-purple-600" : "text-blue-600"
              )}
            />
          )}
          <span className="hidden md:inline font-semibold text-xs text-zinc-700 dark:text-zinc-300">
            {isLoading ? "Зареждане..." : activeSite?.name || "Изберете обект"}
          </span>
          <ChevronDown className="h-3 w-3 opacity-30" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[220px] p-2 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-xl"
      >
        <div className="px-2 py-1.5 mb-2">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            Превключване на обект
          </p>
        </div>
        {sites.map((site) => (
          <DropdownMenuItem
            key={site.id}
            onClick={() => setActiveBranch(site.id)}
            className={cn(
              "flex items-center gap-3 cursor-pointer p-2 rounded-lg transition-all mb-1 last:mb-0",
              activeBranch === site.id
                ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white"
                : "hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
            )}
          >
            <div
              className={cn(
                "h-2.5 w-2.5 rounded-full ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950",
                site.id === "recoveryzone"
                  ? "bg-purple-600 ring-purple-100 dark:ring-purple-900/30"
                  : "bg-blue-600 ring-blue-100 dark:ring-blue-900/30",
                activeBranch === site.id ? "scale-110" : "scale-75 opacity-30"
              )}
            />
            <div className="flex flex-col">
              <span className="font-bold text-xs">{site.name}</span>
              <span className="text-[10px] opacity-50 truncate max-w-[140px]">
                {site.address}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
