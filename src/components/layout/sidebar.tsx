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

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  return (
    <Sidebar {...props} collapsible="icon" className="border-r-0 bg-white dark:bg-zinc-950">
      <SidebarHeader className="h-16 flex items-center px-6 border-b border-gray-100 dark:border-zinc-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shrink-0">
            <Trophy size={18} />
          </div>
          <span className="font-bold text-lg tracking-tight whitespace-nowrap text-zinc-900 dark:text-white">
            БК ГЪЛЪБОВО
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarMenu className="gap-1">
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/dashboard"} className="h-11 px-4 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 rounded-xl transition-all">
                <Link href="/dashboard" className="flex items-center gap-3">
                  <Home size={18} />
                  <span className="font-medium">Начало</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <div className="px-4 py-2 mt-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              Управление
            </div>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith("/members")} className="h-11 px-4 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 rounded-xl transition-all">
                <Link href="/members" className="flex items-center gap-3">
                  <Users size={18} />
                  <span className="font-medium">Членове</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith("/schedule")} className="h-11 px-4 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 rounded-xl transition-all">
                <Link href="/schedule" className="flex items-center gap-3">
                  <Calendar size={18} />
                  <span className="font-medium">График</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith("/reservations")} className="h-11 px-4 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 rounded-xl transition-all">
                <Link href="/reservations" className="flex items-center gap-3">
                  <CalendarCheck size={18} />
                  <span className="font-medium">Резервации</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <div className="px-4 py-2 mt-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              Финанси и Продажби
            </div>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith("/finances")} className="h-11 px-4 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 rounded-xl transition-all">
                <Link href="/finances" className="flex items-center gap-3">
                  <Landmark size={18} />
                  <span className="font-medium">Финанси</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith("/sales")} className="h-11 px-4 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 rounded-xl transition-all">
                <Link href="/sales" className="flex items-center gap-3">
                  <ShoppingCart size={18} />
                  <span className="font-medium">Продажби</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith("/inventory")} className="h-11 px-4 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 rounded-xl transition-all">
                <Link href="/inventory" className="flex items-center gap-3">
                  <Boxes size={18} />
                  <span className="font-medium">Инвентар</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <div className="px-4 py-2 mt-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              Спортна Дейност
            </div>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith("/subscriptions")} className="h-11 px-4 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 rounded-xl transition-all">
                <Link href="/subscriptions" className="flex items-center gap-3">
                  <Repeat size={18} />
                  <span className="font-medium">Абонаменти</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

             <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith("/tournaments")} className="h-11 px-4 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 rounded-xl transition-all">
                <Link href="/tournaments" className="flex items-center gap-3">
                  <Trophy size={18} />
                  <span className="font-medium">Турнири</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith("/rankings")} className="h-11 px-4 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 rounded-xl transition-all">
                <Link href="/rankings" className="flex items-center gap-3">
                  <Medal size={18} />
                  <span className="font-medium">Ранглиста</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith("/reports")} className="h-11 px-4 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 rounded-xl transition-all">
                <Link href="/reports" className="flex items-center gap-3">
                  <BarChart size={18} />
                  <span className="font-medium">Отчети</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-gray-100 dark:border-zinc-800">
        <SidebarMenuButton className="h-11 px-4 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
          <LogOut size={18} /> <span className="font-medium">Изход</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
