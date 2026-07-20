"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import * as React from "react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Home,
  Users,
  LogOut,
  ListTree,
  Calendar,
  CalendarCheck,
  BarChart,
  Trophy,
  Medal,
  Settings,
  PanelLeft,
  Zap,
  Target,
  Dumbbell,
  CalendarRange,
  Activity,
  FileSignature,
} from "lucide-react";

import { useAuth } from "@/context/auth-context";
import { useAppStore } from "@/store/use-app-store";

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname() || "";
  const { setOpen, isMobile, open } = useSidebar();
  const { logout } = useAuth();
  const { activeBranch, setActiveBranch } = useAppStore();

  // Handle Hydration
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isRecoveryZone = activeBranch === "recoveryzone";
  const brandLogo = isRecoveryZone ? "/1.png" : "/logo.png";
  const brandTitle = isRecoveryZone ? "RECOVERY ZONE" : "БАДМИНТОН КЛУБ";
  const brandSubtitle = isRecoveryZone ? "by ZM" : "ГЪЛЪБОВО";

  // Track previous pathname to detect real navigation
  const prevPathname = React.useRef(pathname);

  // Close sidebar on mobile when navigating
  React.useEffect(() => {
    if (isMobile && pathname !== prevPathname.current) {
      setOpen(false);
    }
    prevPathname.current = pathname;
  }, [pathname, isMobile, setOpen]);

  if (!mounted) {
    return (
      <Sidebar
        {...props}
        collapsible="icon"
        className="border-r-0 bg-white dark:bg-zinc-950"
      >
        <SidebarHeader className="h-auto py-6 px-6" />
        <SidebarContent className="px-4 py-4" />
      </Sidebar>
    );
  }

  return (
    <Sidebar
      {...props}
      collapsible="icon"
      className="border-r-0 bg-white dark:bg-zinc-950"
    >
      <SidebarHeader className="h-auto py-6 flex flex-col gap-4 px-6 border-none">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-900 overflow-hidden shrink-0">
              <Link href="/" className="relative h-10 w-10">
                <Image
                  src={brandLogo}
                  alt="Logo"
                  fill
                  sizes="40px"
                  className="object-contain"
                />
              </Link>
            </div>
            {open && (
              <div className="flex flex-col animate-in fade-in duration-300">
                <span className="font-medium text-sm tracking-wide whitespace-nowrap text-zinc-900 dark:text-white leading-tight">
                  {brandTitle}
                </span>
                <span className="font-light text-xs tracking-[0.2em] whitespace-nowrap text-primary uppercase">
                  {brandSubtitle}
                </span>
              </div>
            )}
          </div>
          {open && (
            <button
              onClick={() => setOpen(!open)}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 lg:hidden"
            >
              <PanelLeft size={18} />
            </button>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="px-4 py-4">
        <SidebarGroup>
          <SidebarMenu className="gap-0.5">
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/dashboard"}
                className="h-11 px-3 hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10 rounded-xl transition-all border-none active:bg-primary/10"
              >
                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 w-full"
                  onClick={() => isMobile && setOpen(false)}
                >
                  <Home size={18} strokeWidth={1.5} />
                  <span className="text-[14px]">Начало</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <li className="px-4 py-2 mt-2 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Управление и Бизнес Център
            </li>

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith("/members")}
                className="h-11 px-3 hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10 rounded-xl transition-all border-none"
              >
                <Link
                  href="/members"
                  className="flex items-center gap-3 w-full"
                  onClick={() => isMobile && setOpen(false)}
                >
                  <Users size={18} strokeWidth={1.5} />
                  <span className="text-[14px]">Членове</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith("/marketing")}
                className="h-11 px-3 hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10 rounded-xl transition-all border-none"
              >
                <Link
                  href="/marketing"
                  className="flex items-center gap-3 w-full"
                  onClick={() => isMobile && setOpen(false)}
                >
                  <Target size={18} strokeWidth={1.5} />
                  <span className="text-[14px]">Маркетинг</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={
                  pathname.startsWith("/schedule") ||
                  pathname.startsWith("/reservations")
                }
                className="h-11 px-3 hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10 rounded-xl transition-all border-none"
              >
                <Link
                  href={
                    !isRecoveryZone ? "/schedule" : "/schedule?tab=reservations"
                  }
                  className="flex items-center gap-3 w-full"
                  onClick={() => {
                    if (isRecoveryZone) {
                      setActiveBranch("recoveryzone");
                    } else {
                      setActiveBranch("bkgalabovo");
                    }
                    if (isMobile) setOpen(false);
                  }}
                >
                  {isRecoveryZone ? (
                    <CalendarCheck size={18} strokeWidth={1.5} />
                  ) : (
                    <Calendar size={18} strokeWidth={1.5} />
                  )}
                  <span className="text-[14px]">
                    {!isRecoveryZone ? "График" : "Резервации & Релакс"}
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {isRecoveryZone && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/declarations")}
                  className="h-11 px-3 hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10 rounded-xl transition-all border-none"
                >
                  <Link
                    href="/declarations"
                    className="flex items-center gap-3 w-full"
                    onClick={() => isMobile && setOpen(false)}
                  >
                    <FileSignature size={18} strokeWidth={1.5} />
                    <span className="text-[14px]">Декларации</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith("/catalogs")}
                className="h-11 px-3 hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10 rounded-xl transition-all border-none"
              >
                <Link
                  href="/catalogs"
                  className="flex items-center gap-3 w-full"
                  onClick={() => isMobile && setOpen(false)}
                >
                  <ListTree size={18} strokeWidth={1.5} />
                  <span className="text-[14px]">Каталози</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith("/reports")}
                className="h-11 px-3 hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10 rounded-xl transition-all border-none"
              >
                <Link
                  href="/reports"
                  className="flex items-center gap-3 w-full"
                  onClick={() => isMobile && setOpen(false)}
                >
                  <BarChart size={18} strokeWidth={1.5} />
                  <span className="text-[14px]">Отчети</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith("/settings")}
                className="h-11 px-3 hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10 rounded-xl transition-all border-none"
              >
                <Link
                  href="/settings"
                  className="flex items-center gap-3 w-full"
                  onClick={() => isMobile && setOpen(false)}
                >
                  <Settings size={18} strokeWidth={1.5} />
                  <span className="text-[14px]">Настройки</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {!isRecoveryZone && (
              <>
                <li className="px-4 py-2 mt-4 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Тренировъчен процес
                </li>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith("/training/planner")}
                    className="h-11 px-3 hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10 rounded-xl transition-all border-none"
                  >
                    <Link
                      href="/training/planner"
                      className="flex items-center gap-3 w-full"
                      onClick={() => isMobile && setOpen(false)}
                    >
                      <CalendarRange size={18} strokeWidth={1.5} />
                      <span className="text-[14px]">
                        Универсален Планировчик
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith("/training/exercises")}
                    className="h-11 px-3 hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10 rounded-xl transition-all border-none"
                  >
                    <Link
                      href="/training/exercises"
                      className="flex items-center gap-3 w-full"
                      onClick={() => isMobile && setOpen(false)}
                    >
                      <Dumbbell size={18} strokeWidth={1.5} />
                      <span className="text-[14px]">База с Упражнения</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith("/training/shadow")}
                    className="h-11 px-3 hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10 rounded-xl transition-all border-none"
                  >
                    <Link
                      href="/training/shadow"
                      className="flex items-center gap-3 w-full"
                      onClick={() => isMobile && setOpen(false)}
                    >
                      <Zap size={18} strokeWidth={1.5} />
                      <span className="text-[14px]">Shadow Training</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith("/training/beep-test")}
                    className="h-11 px-3 hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10 rounded-xl transition-all border-none"
                  >
                    <Link
                      href="/training/beep-test"
                      className="flex items-center gap-3 w-full"
                      onClick={() => isMobile && setOpen(false)}
                    >
                      <Activity size={18} strokeWidth={1.5} />
                      <span className="text-[14px]">Бийп Тест Аналитика</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith("/training/assessments")}
                    className="h-11 px-3 hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10 rounded-xl transition-all border-none"
                  >
                    <Link
                      href="/training/assessments"
                      className="flex items-center gap-3 w-full"
                      onClick={() => isMobile && setOpen(false)}
                    >
                      <Target size={18} strokeWidth={1.5} />
                      <span className="text-[14px]">Тестове и Оценяване</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith("/tournaments")}
                    className="h-11 px-3 hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10 rounded-xl transition-all border-none"
                  >
                    <Link
                      href="/tournaments"
                      className="flex items-center gap-3 w-full"
                      onClick={() => isMobile && setOpen(false)}
                    >
                      <Trophy size={18} strokeWidth={1.5} />
                      <span className="text-[14px]">Турнири</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith("/rankings")}
                    className="h-11 px-3 hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10 rounded-xl transition-all border-none"
                  >
                    <Link
                      href="/rankings"
                      className="flex items-center gap-3 w-full"
                      onClick={() => isMobile && setOpen(false)}
                    >
                      <Medal size={18} strokeWidth={1.5} />
                      <span className="text-[14px]">Ранглиста</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </>
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-6 border-none">
        <SidebarMenu className="gap-2">
          <SidebarMenuItem>
            <SidebarMenuButton
              type="button"
              onClick={logout}
              className="h-11 px-3 text-zinc-500 dark:text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all border-none cursor-pointer"
            >
              <LogOut size={18} strokeWidth={1.5} />{" "}
              <span className="text-[14px]">Изход</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
