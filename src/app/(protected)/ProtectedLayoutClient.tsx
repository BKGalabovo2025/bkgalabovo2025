"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";

import { AppSidebar } from "@/components/layout/sidebar";
import { UserNav } from "@/components/layout/user-nav";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/context/auth-context";
import { useAppStore } from "@/store/use-app-store";

function GlobalHeader() {
  const { activeBranch, setActiveBranch } = useAppStore();

  const sites = [
    {
      id: "bkgalabovo",
      logo: "/icons/LOGO.jpg",
      title: "Бадминтон Клуб",
      subtitle: "Гълъбово",
      color: "blue",
      activeClasses: "border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20",
    },
    {
      id: "recoveryzone",
      logo: "/recovery-zone/rz-icon-square.png",
      title: "RECOVERY ZONE",
      subtitle: "by ZM",
      color: "emerald",
      activeClasses:
        "border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20",
    },
  ];

  return (
    <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-zinc-100 bg-white/80 px-4 backdrop-blur-md transition-all dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="flex items-center gap-6">
        <SidebarTrigger className="size-10 shrink-0 rounded-xl border border-zinc-200 bg-white shadow-sm transition-all hover:bg-zinc-100 active:scale-95 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900" />

        <div className="flex items-center gap-3">
          {sites.map((site) => {
            const isActive = activeBranch === site.id;
            return (
              <button
                key={site.id}
                onClick={() => setActiveBranch(site.id)}
                aria-label={`${site.title} ${site.subtitle}${isActive ? " — активен" : " — избери"}`}
                aria-pressed={isActive}
                className={`group flex items-center gap-2 rounded-xl p-1.5 transition-all duration-300 ${
                  isActive
                    ? "bg-white opacity-100 shadow-md ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800"
                    : "grayscale-0.5 opacity-60 hover:opacity-100 hover:grayscale-0"
                }`}
              >
                <div
                  className={`flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border transition-all duration-300 ${
                    isActive
                      ? site.activeClasses
                      : "border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
                  }`}
                >
                  <div className="relative size-6">
                    <Image
                      src={site.logo}
                      alt={site.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 20vw"
                      className={`object-contain transition-transform duration-500 ${isActive ? "scale-110" : "scale-90 group-hover:scale-100"}`}
                    />
                  </div>
                </div>

                {isActive && (
                  <div className="flex flex-col overflow-hidden pr-2 duration-300 animate-in fade-in slide-in-from-left-2">
                    <span className="truncate text-[10px] leading-tight font-bold tracking-wide text-zinc-900 uppercase dark:text-white">
                      {site.title}
                    </span>
                    <span
                      className={`truncate text-[8px] font-medium tracking-wider uppercase ${
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

export default function ProtectedLayoutClient({
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
      <div className="flex min-h-screen w-full bg-slate-50/50 font-sans dark:bg-zinc-950/50">
        <AppSidebar key={`sidebar-${activeBranch}`} />
        <SidebarInset className="relative flex min-w-0 flex-1 flex-col border-l border-gray-100 bg-slate-50/50 dark:border-zinc-800 dark:bg-zinc-950/50">
          <Toaster position="bottom-right" />

          <a href="#main-content" className="skip-link">
            Към основното съдържание
          </a>

          <GlobalHeader key={`header-${activeBranch}`} />

          <main id="main-content" className="flex-1 overflow-y-auto">
            <div
              key={`content-${activeBranch}`}
              className="mx-auto max-w-350 p-4 duration-1000 animate-in fade-in slide-in-from-bottom-2 sm:p-6 md:p-8 lg:p-10"
            >
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
