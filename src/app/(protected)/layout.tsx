"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/sidebar";
import { Toaster } from "react-hot-toast";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import { useAppStore } from "@/store/use-app-store";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const { isSidebarOpen, setSidebarOpen, toggleSidebar, activeBranch } =
    useAppStore();

  const isRecoveryZone = activeBranch === "recoveryzone";
  const brandLogo = isRecoveryZone ? "/1.png" : "/logo.png";

  const brandTitle = isRecoveryZone ? "RECOVERY ZONE" : "Бадминтон Клуб";
  const brandSubtitle = isRecoveryZone ? "by ZM" : "Гълъбово";

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return null;
  }

  return (
    <SidebarProvider open={isSidebarOpen} onOpenChange={setSidebarOpen}>
      <div className="flex min-h-screen w-full bg-slate-50/50 dark:bg-zinc-950/50 font-sans">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 min-w-0 overflow-hidden border-l border-gray-100 dark:border-zinc-800 relative bg-slate-50/50 dark:bg-zinc-950/50">
          <Toaster position="bottom-right" />

          {/* Mobile Header */}
          <header className="lg:hidden flex h-16 items-center px-4 border-b border-zinc-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
            <button
              type="button"
              onClick={() => toggleSidebar()}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all shadow-sm active:scale-95 shrink-0"
            >
              {isSidebarOpen ? (
                <X
                  size={20}
                  strokeWidth={1.5}
                  className="text-zinc-900 dark:text-white"
                />
              ) : (
                <Menu
                  size={20}
                  strokeWidth={1.5}
                  className="text-zinc-900 dark:text-white"
                />
              )}
            </button>

            <div className="ml-3 flex items-center gap-2 overflow-hidden">
              <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 overflow-hidden shrink-0 flex items-center justify-center">
                <Image
                  src={brandLogo}
                  alt="Logo"
                  width={24}
                  height={24}
                  className="object-contain"
                />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="font-medium text-[10px] tracking-wide text-zinc-900 dark:text-white leading-tight uppercase truncate">
                  {brandTitle}
                </span>
                <span className="font-light text-[9px] tracking-[0.2em] text-primary uppercase truncate">
                  {brandSubtitle}
                </span>
              </div>
            </div>
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
