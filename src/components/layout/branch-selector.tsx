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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 h-9 border-slate-200 bg-white/50 backdrop-blur-sm"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          ) : (
            <MapPin className="h-4 w-4 text-blue-600" />
          )}
          <span className="hidden sm:inline font-medium">
            {isLoading ? "Зареждане..." : activeBranch}
          </span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {sites.map((site) => (
          <DropdownMenuItem
            key={site.id}
            onClick={() => setActiveBranch(site.id)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div
              className={`h-2 w-2 rounded-full ${activeBranch === site.id ? "bg-blue-600" : "bg-transparent"}`}
            />
            {site.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
