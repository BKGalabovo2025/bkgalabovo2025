"use client";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const SidebarContext = React.createContext<{
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
} | null>(null);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

export const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }
>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const isMobile = useIsMobile();
    const [_open, _setOpen] = React.useState(defaultOpen);
    const open = openProp ?? _open;
    const setOpen = React.useCallback(
      (value: boolean | ((prev: boolean) => boolean)) => {
        const nextValue = typeof value === "function" ? value(open) : value;
        if (onOpenChange) {
          onOpenChange(nextValue);
        }
        _setOpen(nextValue);
      },
      [onOpenChange, open]
    );

    const toggleSidebar = React.useCallback(() => {
      setOpen((prev) => !prev);
    }, [setOpen]);

    const state = (open ? "expanded" : "collapsed") as "expanded" | "collapsed";
    const contextValue = React.useMemo(
      () => ({ state, open, setOpen, isMobile, toggleSidebar }),
      [state, open, setOpen, isMobile, toggleSidebar]
    );

    return (
      <SidebarContext.Provider value={contextValue}>
        <div
          className={cn(
            "flex min-h-svh w-full bg-zinc-50 dark:bg-zinc-950",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      </SidebarContext.Provider>
    );
  }
);
SidebarProvider.displayName = "SidebarProvider";

export const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    collapsible?: "offcanvas" | "icon" | "none";
  }
>(
  (
    {
      collapsible = "offcanvas",
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { isMobile, open, setOpen } = useSidebar();

    if (isMobile) {
      return (
        <>
          {open && (
            <div 
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden" 
              onClick={() => setOpen(false)}
            />
          )}
          <div
            ref={ref}
            className={cn(
              "fixed inset-y-0 left-0 z-50 w-[280px] bg-white dark:bg-zinc-950 transition-transform duration-300 md:hidden",
              open ? "translate-x-0" : "-translate-x-full"
            )}
            {...props}
          >
            {children}
          </div>
        </>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "hidden md:flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 transition-all duration-300 overflow-hidden shrink-0",
          open ? "w-72" : "w-20",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Sidebar.displayName = "Sidebar";

export const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-1 flex-col overflow-y-auto overflow-x-hidden",
      className
    )}
    {...props}
  />
));
SidebarContent.displayName = "SidebarContent";

export const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col p-2", className)}
    {...props}
  />
));
SidebarGroup.displayName = "SidebarGroup";

export const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col p-4", className)}
    {...props}
  />
));
SidebarHeader.displayName = "SidebarHeader";

export const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col p-4 mt-auto", className)}
    {...props}
  />
));
SidebarFooter.displayName = "SidebarFooter";

export const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-col gap-1", className)}
    {...props}
  />
));
SidebarMenu.displayName = "SidebarMenu";

export const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn("relative", className)}
    {...props}
  />
));
SidebarMenuItem.displayName = "SidebarMenuItem";

export const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & { asChild?: boolean; isActive?: boolean }
>(({ asChild = false, isActive = false, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      ref={ref}
      data-active={isActive}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl p-3 text-left text-sm font-medium transition-all outline-none",
        "hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50",
        "data-[active=true]:bg-blue-600 data-[active=true]:text-white shadow-sm data-[active=true]:shadow-blue-500/20",
        className
      )}
      {...props}
    />
  );
});
SidebarMenuButton.displayName = "SidebarMenuButton";

export const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"main">
>(({ className, ...props }, ref) => (
  <main
    ref={ref}
    className={cn(
      "flex flex-1 flex-col min-w-0 bg-white dark:bg-zinc-950",
      className
    )}
    {...props}
  />
));
SidebarInset.displayName = "SidebarInset";

import { Menu } from "lucide-react";

export const SidebarTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button">
>(({ className, ...props }, ref) => {
  const { toggleSidebar } = useSidebar();
  return (
    <button
      type="button"
      ref={ref}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all shrink-0",
        className
      )}
      onClick={toggleSidebar}
      {...props}
    >
      <Menu className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
    </button>
  );
});
SidebarTrigger.displayName = "SidebarTrigger";
