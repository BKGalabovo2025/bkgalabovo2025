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
          <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md px-6 sticky top-0 z-30 shadow-sm">
            <SidebarTrigger className="-ml-1" />
            <div className="h-4 w-px bg-border mx-1" />
            <div className="flex-1">
              <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                БАДМИНТОН КЛУБ ГЪЛЪБОВО
              </h1>
            </div>
            <BranchSelector />
          </header>
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-10 animate-in fade-in duration-500">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
