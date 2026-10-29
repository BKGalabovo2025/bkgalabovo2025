"use client";
import {
  Activity,
  Award,
  BarChart,
  Box,
  Briefcase,
  Calendar,
  CalendarCheck,
  CalendarRange,
  Dumbbell,
  FileSignature,
  FileText,
  GraduationCap,
  Handshake,
  HeartHandshake,
  Home,
  Inbox,
  ListTree,
  LogOut,
  Medal,
  MessageSquareHeart,
  PanelLeft,
  Settings,
  Target,
  Tent,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/context/auth-context";
import { useParentPortalAdmin } from "@/hooks/useParentPortalAdmin";
import { useAppStore } from "@/store/use-app-store";

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname() || "";
  const { setOpen, isMobile, open } = useSidebar();
  const { logout } = useAuth();
  const { activeBranch, setActiveBranch } = useAppStore();
  const { stats, parents, onlineParentsCount, isParentOnline } =
    useParentPortalAdmin();

  // Handle Hydration
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isRecoveryZone = activeBranch === "recoveryzone";
  const brandLogo = isRecoveryZone
    ? "/recovery-zone/rz-icon-square.png"
    : "/icons/badge-option-3-light-squircle.png";
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
        <SidebarHeader className="h-auto p-6" />
        <SidebarContent className="p-4" />
      </Sidebar>
    );
  }

  return (
    <Sidebar
      {...props}
      collapsible="icon"
      className="border-r-0 bg-white dark:bg-zinc-950"
    >
      <SidebarHeader className="flex h-auto flex-col gap-4 border-none p-6">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900">
              <Link href="/" className="relative size-10">
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
              <div className="flex flex-col duration-300 animate-in fade-in">
                <span className="text-sm leading-tight font-medium tracking-wide whitespace-nowrap text-zinc-900 dark:text-white">
                  {brandTitle}
                </span>
                <span className="text-xs font-light tracking-[0.2em] whitespace-nowrap text-primary uppercase">
                  {brandSubtitle}
                </span>
              </div>
            )}
          </div>
          {open && (
            <button
              onClick={() => setOpen(!open)}
              className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 lg:hidden dark:hover:bg-zinc-800"
            >
              <PanelLeft size={18} />
            </button>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarMenu className="gap-0.5">
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/dashboard"}
                className="h-11 rounded-xl border-none px-3 transition-all hover:bg-primary/5 hover:text-primary active:bg-primary/10 dark:hover:bg-primary/10"
              >
                <Link
                  href="/dashboard"
                  className="flex w-full items-center gap-3"
                  onClick={() => isMobile && setOpen(false)}
                >
                  <Home size={18} strokeWidth={1.5} />
                  <span className="text-[14px]">Начало</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <li className="mt-2 px-4 py-2 text-[10px] font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
              Управление и Бизнес Център
            </li>

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith("/members")}
                className="h-11 rounded-xl border-none px-3 transition-all hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10"
              >
                <Link
                  href="/members"
                  className="flex w-full items-center gap-3"
                  onClick={() => isMobile && setOpen(false)}
                >
                  <Users size={18} strokeWidth={1.5} />
                  <span className="text-[14px]">Членове</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {!isRecoveryZone && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/parents")}
                  className="h-11 rounded-xl border-none px-3 transition-all hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10"
                >
                  <Link
                    href="/parents"
                    className="flex w-full items-center justify-between"
                    onClick={() => isMobile && setOpen(false)}
                  >
                    <div className="flex items-center gap-3">
                      <HeartHandshake
                        size={18}
                        strokeWidth={1.5}
                        className="text-blue-500"
                      />
                      <span className="text-[14px]">Родителски достъп</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {onlineParentsCount > 0 && (
                        <span
                          className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                          title={`${onlineParentsCount} родител(и) на линия в портала`}
                        >
                          <span className="relative flex size-2">
                            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
                          </span>
                          <span>{onlineParentsCount} на линия</span>
                        </span>
                      )}

                      {stats?.totalPending > 0 && (
                        <span className="flex size-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm animate-pulse">
                          {stats.totalPending}
                        </span>
                      )}
                    </div>
                  </Link>
                </SidebarMenuButton>

                {/* Live Parent Activity Widget inside expanded sidebar */}
                {open && parents.length > 0 && (
                  <div className="mx-2 mt-1 mb-2 rounded-xl border border-zinc-200/70 bg-zinc-50/70 p-2.5 text-xs dark:border-zinc-800/80 dark:bg-zinc-900/50">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                      <span className="flex items-center gap-1">
                        <Users size={11} />
                        <span>Родители на живо</span>
                      </span>
                      <Link
                        href="/parents?tab=activity"
                        className="text-[10px] text-blue-600 hover:underline dark:text-blue-400 font-semibold"
                      >
                        История ↗
                      </Link>
                    </div>

                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {parents.slice(0, 4).map((p) => {
                        const online = isParentOnline(p);
                        return (
                          <div
                            key={p.id}
                            className="flex items-start justify-between gap-1.5 rounded-lg bg-white/80 p-1.5 dark:bg-zinc-800/60 shadow-2xs"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`size-2 shrink-0 rounded-full ${
                                    online
                                      ? "bg-emerald-500 ring-2 ring-emerald-300 dark:ring-emerald-900 animate-pulse"
                                      : "bg-zinc-300 dark:bg-zinc-600"
                                  }`}
                                  title={
                                    online ? "На линия в момента" : "Офлайн"
                                  }
                                />
                                <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate text-[11px]">
                                  {p.name}
                                </span>
                              </div>
                              <p className="mt-0.5 text-[10px] text-zinc-500 dark:text-zinc-400 truncate pl-3.5">
                                {online
                                  ? p.lastAction || "Разглежда портала"
                                  : p.lastActiveAt
                                    ? `Последно: ${new Date(p.lastActiveAt).toLocaleDateString("bg-BG", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}`
                                    : "Очаква първи вход"}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </SidebarMenuItem>
            )}

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith("/documents")}
                className="h-11 rounded-xl border-none px-3 transition-all hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10"
              >
                <Link
                  href="/documents"
                  className="flex w-full items-center gap-3"
                  onClick={() => isMobile && setOpen(false)}
                >
                  <FileText size={18} strokeWidth={1.5} />
                  <span className="text-[14px]">Документи & Бланки</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith("/marketing")}
                className="h-11 rounded-xl border-none px-3 transition-all hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10"
              >
                <Link
                  href="/marketing"
                  className="flex w-full items-center gap-3"
                  onClick={() => isMobile && setOpen(false)}
                >
                  <Target size={18} strokeWidth={1.5} />
                  <span className="text-[14px]">Маркетинг и Комуникация</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith("/certificates")}
                className="h-11 rounded-xl border-none px-3 transition-all hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10"
              >
                <Link
                  href="/certificates"
                  className="flex w-full items-center gap-3"
                  onClick={() => isMobile && setOpen(false)}
                >
                  <Award size={18} strokeWidth={1.5} />
                  <span className="text-[14px]">Сертификати & Ваучери</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith("/partners")}
                className="h-11 rounded-xl border-none px-3 transition-all hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10"
              >
                <Link
                  href="/partners"
                  className="flex w-full items-center gap-3"
                  onClick={() => isMobile && setOpen(false)}
                >
                  <Handshake size={18} strokeWidth={1.5} />
                  <span className="text-[14px]">Партньори & Спонсори</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith("/feedback")}
                className="h-11 rounded-xl border-none px-3 transition-all hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10"
              >
                <Link
                  href="/feedback"
                  className="flex w-full items-center gap-3"
                  onClick={() => isMobile && setOpen(false)}
                >
                  <MessageSquareHeart size={18} strokeWidth={1.5} />
                  <span className="text-[14px]">Отзиви и Анкети</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith("/inquiries")}
                className="h-11 rounded-xl border-none px-3 transition-all hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10"
              >
                <Link
                  href="/inquiries"
                  className="flex w-full items-center gap-3"
                  onClick={() => isMobile && setOpen(false)}
                >
                  <Inbox size={18} strokeWidth={1.5} />
                  <span className="text-[14px]">Запитвания от сайта</span>
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
                className="h-11 rounded-xl border-none px-3 transition-all hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10"
              >
                <Link
                  href={
                    !isRecoveryZone ? "/schedule" : "/schedule?tab=reservations"
                  }
                  className="flex w-full items-center gap-3"
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
                  className="h-11 rounded-xl border-none px-3 transition-all hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10"
                >
                  <Link
                    href="/declarations"
                    className="flex w-full items-center gap-3"
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
                className="h-11 rounded-xl border-none px-3 transition-all hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10"
              >
                <Link
                  href="/catalogs"
                  className="flex w-full items-center gap-3"
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
                className="h-11 rounded-xl border-none px-3 transition-all hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10"
              >
                <Link
                  href="/reports"
                  className="flex w-full items-center gap-3"
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
                isActive={pathname.startsWith("/accounting")}
                className="h-11 rounded-xl border-none px-3 transition-all hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10"
              >
                <Link
                  href="/accounting"
                  className="flex w-full items-center gap-3"
                  onClick={() => isMobile && setOpen(false)}
                >
                  <Briefcase size={18} strokeWidth={1.5} />
                  <span className="text-[14px]">Счетоводство</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith("/settings")}
                className="h-11 rounded-xl border-none px-3 transition-all hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10"
              >
                <Link
                  href="/settings"
                  className="flex w-full items-center gap-3"
                  onClick={() => isMobile && setOpen(false)}
                >
                  <Settings size={18} strokeWidth={1.5} />
                  <span className="text-[14px]">Настройки</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {!isRecoveryZone && (
              <>
                <li className="mt-4 px-4 py-2 text-[10px] font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                  Тренировъчен процес
                </li>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith("/inventory")}
                    className="h-11 rounded-xl border-none px-3 transition-all hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10"
                  >
                    <Link
                      href="/inventory"
                      className="flex w-full items-center gap-3"
                      onClick={() => isMobile && setOpen(false)}
                    >
                      <Box size={18} strokeWidth={1.5} />
                      <span className="text-[14px]">Инвентар</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith("/training/planner")}
                    className="h-11 rounded-xl border-none px-3 transition-all hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10"
                  >
                    <Link
                      href="/training/planner"
                      className="flex w-full items-center gap-3"
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
                    isActive={pathname.startsWith("/training/camps")}
                    className="h-11 rounded-xl border-none px-3 transition-all hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10"
                  >
                    <Link
                      href="/training/camps"
                      className="flex w-full items-center gap-3"
                      onClick={() => isMobile && setOpen(false)}
                    >
                      <Tent size={18} strokeWidth={1.5} />
                      <span className="text-[14px]">Лагери</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith("/training/annual-plans")}
                    className="h-11 rounded-xl border-none px-3 transition-all hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10"
                  >
                    <Link
                      href="/training/annual-plans"
                      className="flex w-full items-center gap-3"
                      onClick={() => isMobile && setOpen(false)}
                    >
                      <CalendarRange size={18} strokeWidth={1.5} />
                      <span className="text-[14px]">Годишни Планове</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith("/training/exercises")}
                    className="h-11 rounded-xl border-none px-3 transition-all hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10"
                  >
                    <Link
                      href="/training/exercises"
                      className="flex w-full items-center gap-3"
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
                    className="h-11 rounded-xl border-none px-3 transition-all hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10"
                  >
                    <Link
                      href="/training/shadow"
                      className="flex w-full items-center gap-3"
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
                    className="h-11 rounded-xl border-none px-3 transition-all hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10"
                  >
                    <Link
                      href="/training/beep-test"
                      className="flex w-full items-center gap-3"
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
                    className="h-11 rounded-xl border-none px-3 transition-all hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10"
                  >
                    <Link
                      href="/training/assessments"
                      className="flex w-full items-center gap-3"
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
                    isActive={pathname.startsWith("/training/theory")}
                    className="h-11 rounded-xl border-none px-3 transition-all hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10"
                  >
                    <Link
                      href="/training/theory"
                      className="flex w-full items-center gap-3"
                      onClick={() => isMobile && setOpen(false)}
                    >
                      <GraduationCap size={18} strokeWidth={1.5} />
                      <span className="text-[14px]">Теория и Викторини</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith("/tournaments")}
                    className="h-11 rounded-xl border-none px-3 transition-all hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10"
                  >
                    <Link
                      href="/tournaments"
                      className="flex w-full items-center gap-3"
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
                    className="h-11 rounded-xl border-none px-3 transition-all hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10"
                  >
                    <Link
                      href="/rankings"
                      className="flex w-full items-center gap-3"
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
      <SidebarFooter className="border-none p-6">
        <SidebarMenu className="gap-2">
          <SidebarMenuItem>
            <SidebarMenuButton
              type="button"
              onClick={logout}
              className="h-11 cursor-pointer rounded-xl border-none px-3 text-zinc-500 transition-all hover:bg-red-50 hover:text-red-500 dark:text-zinc-400 dark:hover:bg-red-900/10"
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
