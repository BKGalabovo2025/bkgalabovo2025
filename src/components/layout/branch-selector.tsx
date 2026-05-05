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
import { MapPin, ChevronDown } from "lucide-react";

const branches = ["Централна База", "Зала Гълъбово", "Спортен Комплекс"];

export function BranchSelector() {
  const { activeBranch, setActiveBranch } = useAppStore();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 h-9 border-slate-200 bg-white/50 backdrop-blur-sm"
        >
          <MapPin className="h-4 w-4 text-blue-600" />
          <span className="hidden sm:inline font-medium">{activeBranch}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {branches.map((branch) => (
          <DropdownMenuItem
            key={branch}
            onClick={() => setActiveBranch(branch)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div
              className={`h-2 w-2 rounded-full ${activeBranch === branch ? "bg-blue-600" : "bg-transparent"}`}
            />
            {branch}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
