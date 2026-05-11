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
        <SidebarInset className="flex flex-col flex-1 min-w-0 overflow-hidden border-l border-gray-100 dark:border-zinc-800 relative">
          <Toaster position="bottom-right" />
          <div className="absolute top-4 left-4 z-50 lg:hidden">
            <SidebarTrigger className="hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition-colors h-10 w-10 shadow-sm border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950" />
          </div>
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
