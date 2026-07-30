"use client";
import { Slot } from "@radix-ui/react-slot";
import { Menu, X } from "lucide-react";
import * as React from "react";

import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/use-app-store";

const SidebarContext = React.createContext<{
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  isMobile: boolean;
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
      defaultOpen: _defaultOpen = true,
      open: openProp,
      onOpenChange,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const isMobile = useIsMobile();
    const { isSidebarOpen, setSidebarOpen } = useAppStore();

    // Support external control via props, but fallback to global store
    const open = openProp ?? isSidebarOpen;

    const setOpen = React.useCallback(
      (value: boolean | ((prev: boolean) => boolean)) => {
        const nextValue = typeof value === "function" ? value(open) : value;
        if (onOpenChange) {
          onOpenChange(nextValue);
        }
        setSidebarOpen(nextValue);
      },
      [onOpenChange, open, setSidebarOpen]
    );

    const state = (open ? "expanded" : "collapsed") as "expanded" | "collapsed";

    const contextValue = React.useMemo(
      () => ({ state, open, setOpen, isMobile }),
      [state, open, setOpen, isMobile]
    );

    return (
      <SidebarContext.Provider value={contextValue}>
        <div
          className={cn(
            "group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full",
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
    side?: "left" | "right";
    variant?: "sidebar" | "floating" | "inset";
    collapsible?: "offcanvas" | "icon" | "none";
  }
>(
  (
    {
      side = "left",
      variant = "sidebar",
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
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm duration-300 animate-in fade-in"
              onClick={() => setOpen(false)}
            />
          )}
          <div
            ref={ref}
            role="dialog"
            aria-modal="true"
            className={cn(
              "pointer-events-auto fixed inset-y-0 left-0 z-999 flex w-70 flex-col overflow-y-auto border-r border-zinc-100 bg-white shadow-2xl transition-all duration-300 ease-in-out dark:border-zinc-900 dark:bg-zinc-950",
              open
                ? "visible translate-x-0 opacity-100"
                : "invisible -translate-x-full opacity-0",
              className
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
          "group peer hidden border-r border-sidebar-border text-sidebar-foreground md:block",
          className
        )}
        data-state={open ? "expanded" : "collapsed"}
        data-collapsible={collapsible}
        data-variant={variant}
        data-side={side}
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
      "flex min-h-0 flex-1 flex-col gap-2 overflow-auto",
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
    className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
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
    className={cn("flex flex-col gap-2 p-2", className)}
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
    className={cn("flex flex-col gap-2 p-2", className)}
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
    className={cn("flex w-full min-w-0 flex-col gap-1", className)}
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
    className={cn("group/menu-item relative", className)}
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
        "flex w-full items-center gap-2 rounded-md p-2 text-left text-sm outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium",
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
      "relative flex min-h-svh flex-1 flex-col bg-background",
      className
    )}
    {...props}
  />
));
SidebarInset.displayName = "SidebarInset";

export const SidebarTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button">
>(({ className, ...props }, ref) => {
  const { open, setOpen } = useSidebar();
  return (
    <button
      type="button"
      ref={ref}
      aria-label={open ? "Затвори меню" : "Отвори меню"}
      className={cn(
        "relative z-70 flex size-12 items-center justify-center rounded-2xl border border-zinc-100 bg-white shadow-sm transition-all hover:bg-zinc-50 active:scale-95",
        className
      )}
      onClick={(e) => {
        e.stopPropagation();
        setOpen((prev: boolean) => !prev);
      }}
      {...props}
    >
      {open ? (
        <X size={20} strokeWidth={1.5} className="text-zinc-900" />
      ) : (
        <Menu size={20} strokeWidth={1.5} className="text-zinc-900" />
      )}
    </button>
  );
});
SidebarTrigger.displayName = "SidebarTrigger";
