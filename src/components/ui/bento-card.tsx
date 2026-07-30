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
      "rounded-4xl border border-zinc-100 bg-white text-zinc-950 shadow-none transition-all",
      className
    )}
    {...props}
  />
));
BentoCard.displayName = "BentoCard";

export { BentoCard };
