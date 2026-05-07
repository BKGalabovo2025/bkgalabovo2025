"use client";
import Link from "next/link";
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
  Landmark,
  ShoppingCart,
  Boxes,
  Calendar,
  CalendarCheck,
  Repeat,
  BarChart,
  Trophy,
  Medal,
  Settings,
  User,
} from "lucide-react";

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname() || "";
  const { setOpen, isMobile } = useSidebar();

  React.useEffect(() => {
    if (isMobile) {
      setOpen(false);
    }
  }, [pathname, isMobile, setOpen]);

  return (
    <Sidebar
      {...props}
      collapsible="icon"
      className="border-r-0 bg-white dark:bg-zinc-950"
    >
      <SidebarHeader className="h-20 flex items-center px-6 border-none">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
            <Trophy size={20} />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-sm tracking-wide whitespace-nowrap text-zinc-900 dark:text-white leading-tight">
              БАДМИНТОН КЛУБ
            </span>
            <span className="font-light text-xs tracking-[0.2em] whitespace-nowrap text-primary uppercase">
              ГЪЛЪБОВО
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-4 py-4">
        <SidebarGroup>
          <SidebarMenu className="gap-2">
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/dashboard"}
                className="h-12 px-4 hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10 rounded-xl transition-all border-none active:bg-primary/10"
              >
                <Link href="/dashboard" className="flex items-center gap-4">
                  <Home size={20} strokeWidth={1.5} />
                  <span className="text-[15px]">Начало</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <div className="px-4 py-4 mt-2 text-[11px] font-medium text-zinc-400 uppercase tracking-[0.15em]">
              Управление
            </div>

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith("/members")}
                className="h-12 px-4 hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10 rounded-xl transition-all border-none"
              >
                <Link href="/members" className="flex items-center gap-4">
                  <Users size={20} strokeWidth={1.5} />
                  <span className="text-[15px]">Членове</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith("/schedule")}
                className="h-12 px-4 hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10 rounded-xl transition-all border-none"
              >
                <Link href="/schedule" className="flex items-center gap-4">
                  <Calendar size={20} strokeWidth={1.5} />
                  <span className="text-[15px]">График</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith("/reservations")}
                className="h-12 px-4 hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10 rounded-xl transition-all border-none"
              >
                <Link href="/reservations" className="flex items-center gap-4">
                  <CalendarCheck size={20} strokeWidth={1.5} />
                  <span className="text-[15px]">Резервации</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <div className="px-4 py-4 mt-2 text-[11px] font-medium text-zinc-400 uppercase tracking-[0.15em]">
              Финанси
            </div>

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith("/finances")}
                className="h-12 px-4 hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10 rounded-xl transition-all border-none"
              >
                <Link href="/finances" className="flex items-center gap-4">
                  <Landmark size={20} strokeWidth={1.5} />
                  <span className="text-[15px]">Финанси</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith("/sales")}
                className="h-12 px-4 hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10 rounded-xl transition-all border-none"
              >
                <Link href="/sales" className="flex items-center gap-4">
                  <ShoppingCart size={20} strokeWidth={1.5} />
                  <span className="text-[15px]">Продажби</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith("/inventory")}
                className="h-12 px-4 hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10 rounded-xl transition-all border-none"
              >
                <Link href="/inventory" className="flex items-center gap-4">
                  <Boxes size={20} strokeWidth={1.5} />
                  <span className="text-[15px]">Инвентар</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <div className="px-4 py-4 mt-2 text-[11px] font-medium text-zinc-400 uppercase tracking-[0.15em]">
              Спорт
            </div>

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith("/subscriptions")}
                className="h-12 px-4 hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10 rounded-xl transition-all border-none"
              >
                <Link href="/subscriptions" className="flex items-center gap-4">
                  <Repeat size={20} strokeWidth={1.5} />
                  <span className="text-[15px]">Абонаменти</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith("/tournaments")}
                className="h-12 px-4 hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10 rounded-xl transition-all border-none"
              >
                <Link href="/tournaments" className="flex items-center gap-4">
                  <Trophy size={20} strokeWidth={1.5} />
                  <span className="text-[15px]">Турнири</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith("/rankings")}
                className="h-12 px-4 hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10 rounded-xl transition-all border-none"
              >
                <Link href="/rankings" className="flex items-center gap-4">
                  <Medal size={20} strokeWidth={1.5} />
                  <span className="text-[15px]">Ранглиста</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith("/reports")}
                className="h-12 px-4 hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10 rounded-xl transition-all border-none"
              >
                <Link href="/reports" className="flex items-center gap-4">
                  <BarChart size={20} strokeWidth={1.5} />
                  <span className="text-[15px]">Отчети</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith("/settings")}
                className="h-12 px-4 hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10 rounded-xl transition-all border-none"
              >
                <Link href="/settings" className="flex items-center gap-4">
                  <Settings size={20} strokeWidth={1.5} />
                  <span className="text-[15px]">Настройки</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-6 border-none">
        <SidebarMenu className="gap-2">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="h-12 px-4 hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10 rounded-xl transition-all cursor-pointer border-none"
            >
              <Link
                href="/settings?tab=profile"
                className="flex items-center gap-4"
              >
                <div className="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 transition-colors">
                  <User size={16} />
                </div>
                <span className="text-[15px]">Профил</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton className="h-12 px-4 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all border-none">
              <LogOut size={20} strokeWidth={1.5} />{" "}
              <span className="text-[15px]">Изход</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
