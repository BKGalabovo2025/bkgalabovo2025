"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

// Simple visual checkbox that avoids Radix compose-refs React 19 bug
export function VisualCheckbox({
  checked,
  className,
}: {
  checked?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-sm border border-zinc-300 dark:border-zinc-700",
        checked
          ? "border-zinc-950 bg-zinc-950 dark:border-zinc-100 dark:bg-zinc-100"
          : "bg-white dark:bg-zinc-900",
        className
      )}
    >
      {checked && (
        <Check
          className="text-white dark:text-zinc-950"
          strokeWidth={3}
          style={{ width: "70%", height: "70%" }}
        />
      )}
    </div>
  );
}
