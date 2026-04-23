import { cn } from "@/lib/utils";

type HeadingProps = {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  className?: string;
  children: React.ReactNode;
};

export function Heading({ as: Comp = "h1", className, children }: HeadingProps) {
  return (
    <Comp
      className={cn(
        "text-2xl font-bold tracking-tight",
        {
          "text-4xl lg:text-5xl": Comp === "h1",
          "text-3xl lg:text-4xl": Comp === "h2",
          "text-2xl lg:text-3xl": Comp === "h3",
        },
        className
      )}
    >
      {children}
    </Comp>
  );
}
