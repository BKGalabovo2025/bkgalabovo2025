"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/sidebar";
import { Toaster } from "react-hot-toast";

import { BranchSelector } from "@/components/layout/branch-selector";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return null; // AuthProvider handles the initial loader
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-slate-50/50 dark:bg-zinc-950/50 font-sans">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 min-w-0 overflow-hidden border-l border-gray-100 dark:border-zinc-800">
          <Toaster position="bottom-right" />
          <header className="flex h-20 shrink-0 items-center gap-4 border-b border-zinc-100 dark:border-zinc-900 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md px-4 md:px-10 sticky top-0 z-30 shadow-none">
            <SidebarTrigger className="-ml-1 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-xl transition-colors h-10 w-10" />
            <div className="h-4 w-px bg-zinc-100 dark:bg-zinc-800 mx-1 hidden sm:block" />
            <div className="flex-1">
              <h1 className="font-medium text-[10px] sm:text-[11px] uppercase tracking-[0.2em] sm:tracking-[0.4em] text-zinc-900 dark:text-white opacity-80 line-clamp-1">
                Antigravity Dashboard
              </h1>
            </div>
            <BranchSelector />
          </header>
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-[1400px] mx-auto p-4 sm:p-6 md:p-10 lg:p-12 animate-in fade-in slide-in-from-bottom-2 duration-1000">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
