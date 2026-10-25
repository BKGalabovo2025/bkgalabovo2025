"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const BentoCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl border border-zinc-200/80 bg-white text-zinc-950 shadow-none transition-all dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50",
      className
    )}
    {...props}
  />
));
BentoCard.displayName = "BentoCard";

export { BentoCard };
