"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/sidebar";
import { Toaster } from "react-hot-toast";
import Image from "next/image";
import { useAppStore } from "@/store/use-app-store";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserNav } from "@/components/layout/user-nav";

function GlobalHeader() {
  const { activeBranch, setActiveBranch } = useAppStore();

  const sites = [
    {
      id: "bkgalabovo",
      logo: "/logo.png",
      title: "Бадминтон Клуб",
      subtitle: "Гълъбово",
      color: "blue",
    },
    {
      id: "recoveryzone",
      logo: "/1.png",
      title: "RECOVERY ZONE",
      subtitle: "by ZM",
      color: "emerald",
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full h-16 border-b border-zinc-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md flex items-center justify-between px-4 transition-all">
      <div className="flex items-center gap-6">
        <SidebarTrigger className="h-10 w-10 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900 shadow-sm transition-all active:scale-95 shrink-0" />

        <div className="flex items-center gap-3">
          {sites.map((site) => {
            const isActive = activeBranch === site.id;
            return (
              <button
                key={site.id}
                onClick={() => setActiveBranch(site.id)}
                className={`group flex items-center gap-2 p-1.5 rounded-xl transition-all duration-300 ${
                  isActive
                    ? "bg-white dark:bg-zinc-900 shadow-md ring-1 ring-zinc-200 dark:ring-zinc-800 opacity-100"
                    : "opacity-60 hover:opacity-100 grayscale-[0.5] hover:grayscale-0"
                }`}
              >
                <div
                  className={`h-9 w-9 rounded-lg overflow-hidden shrink-0 flex items-center justify-center border transition-all duration-300 ${
                    isActive
                      ? site.id === "bkgalabovo"
                        ? "border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20"
                        : "border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20"
                      : "border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900"
                  }`}
                >
                  <div className="relative h-6 w-6">
                    <Image
                      src={site.logo}
                      alt={site.title}
                      fill
                      sizes="100vw"
                      className={`object-contain transition-transform duration-500 ${isActive ? "scale-110" : "scale-90 group-hover:scale-100"}`}
                    />
                  </div>
                </div>

                {isActive && (
                  <div className="flex flex-col pr-2 overflow-hidden animate-in fade-in slide-in-from-left-2 duration-300">
                    <span className="font-bold text-[10px] tracking-wide text-zinc-900 dark:text-white leading-tight uppercase truncate">
                      {site.title}
                    </span>
                    <span
                      className={`font-medium text-[8px] tracking-wider uppercase truncate ${
                        site.id === "bkgalabovo"
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {site.subtitle}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <UserNav />
      </div>
    </header>
  );
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const { isSidebarOpen, setSidebarOpen, activeBranch } = useAppStore();

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
        <AppSidebar key={`sidebar-${activeBranch}`} />
        <SidebarInset className="flex flex-col flex-1 min-w-0 border-l border-gray-100 dark:border-zinc-800 relative bg-slate-50/50 dark:bg-zinc-950/50">
          <Toaster position="bottom-right" />

          <GlobalHeader key={`header-${activeBranch}`} />

          <main className="flex-1 overflow-y-auto">
            <div
              key={`content-${activeBranch}`}
              className="max-w-[1400px] mx-auto p-4 sm:p-6 md:p-8 lg:p-10 animate-in fade-in slide-in-from-bottom-2 duration-1000"
            >
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
