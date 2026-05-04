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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";

export function AppSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const { logout } = useAuth();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar className="bg-zinc-50 dark:bg-zinc-950">
      <SidebarHeader className="h-20 flex items-center justify-center">
        <div className="flex items-center gap-3 w-full">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-950 text-white shrink-0 shadow-lg transition-transform group-hover:scale-105">
            <Trophy size={24} />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col animate-in fade-in duration-500 overflow-hidden">
              <span className="font-black text-sm tracking-tighter whitespace-nowrap text-zinc-950 dark:text-white uppercase leading-tight">
                БК ГЪЛЪБОВО
              </span>
              <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest leading-none">Администрация</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/dashboard"} title="Начало">
                <Link href="/dashboard" className="flex items-center gap-3">
                  <Home size={20} className="shrink-0" />
                  {!isCollapsed && <span className="font-bold">Начало</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            {!isCollapsed && (
              <div className="px-4 py-2 mt-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] animate-in fade-in">
                Управление
              </div>
            )}

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith("/members")} title="Членове">
                <Link href="/members" className="flex items-center gap-3">
                  <Users size={20} className="shrink-0" />
                  {!isCollapsed && <span className="font-bold">Членове</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith("/schedule")} title="График">
                <Link href="/schedule" className="flex items-center gap-3">
                  <Calendar size={20} className="shrink-0" />
                  {!isCollapsed && <span className="font-bold">График</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith("/reservations")} title="Резервации">
                <Link href="/reservations" className="flex items-center gap-3">
                  <CalendarCheck size={20} className="shrink-0" />
                  {!isCollapsed && <span className="font-bold">Резервации</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {!isCollapsed && (
              <div className="px-4 py-2 mt-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] animate-in fade-in">
                Финанси
              </div>
            )}

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith("/finances")} title="Финанси">
                <Link href="/finances" className="flex items-center gap-3">
                  <Landmark size={20} className="shrink-0" />
                  {!isCollapsed && <span className="font-bold">Финанси</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith("/sales")} title="Продажби">
                <Link href="/sales" className="flex items-center gap-3">
                  <ShoppingCart size={20} className="shrink-0" />
                  {!isCollapsed && <span className="font-bold">Продажби</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith("/inventory")} title="Инвентар">
                <Link href="/inventory" className="flex items-center gap-3">
                  <Boxes size={20} className="shrink-0" />
                  {!isCollapsed && <span className="font-bold">Инвентар</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {!isCollapsed && (
              <div className="px-4 py-2 mt-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] animate-in fade-in">
                Спорт
              </div>
            )}

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith("/subscriptions")} title="Абонаменти">
                <Link href="/subscriptions" className="flex items-center gap-3">
                  <Repeat size={20} className="shrink-0" />
                  {!isCollapsed && <span className="font-bold">Абонаменти</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

             <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith("/tournaments")} title="Турнири">
                <Link href="/tournaments" className="flex items-center gap-3">
                  <Trophy size={20} className="shrink-0" />
                  {!isCollapsed && <span className="font-bold">Турнири</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith("/rankings")} title="Ранглиста">
                <Link href="/rankings" className="flex items-center gap-3">
                  <Medal size={20} className="shrink-0" />
                  {!isCollapsed && <span className="font-bold">Ранглиста</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith("/reports")} title="Отчети">
                <Link href="/reports" className="flex items-center gap-3">
                  <BarChart size={20} className="shrink-0" />
                  {!isCollapsed && <span className="font-bold">Отчети</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenuButton 
          onClick={() => logout()}
          className="text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
          title="Изход"
        >
          <LogOut size={20} className="shrink-0" /> 
          {!isCollapsed && <span className="font-black text-[10px] uppercase tracking-widest">Изход</span>}
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
