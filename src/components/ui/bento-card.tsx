import * as React from "react";
import { cn } from "@/lib/utils";

const BentoCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl border border-slate-100 bg-card text-card-foreground shadow-sm transition-all hover:shadow-md",
      className
    )}
    {...props}
  />
));
BentoCard.displayName = "BentoCard";

export { BentoCard };
