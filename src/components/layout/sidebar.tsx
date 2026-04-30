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
    <Sidebar {...props} collapsible="icon">
      <SidebarHeader className="p-4 border-b font-bold text-blue-700">
        БК ГЪЛЪБОВО
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/dashboard"}>
                <Link href="/dashboard" className="flex items-center gap-3">
                  <Home size={20} />
                  <span>Начало</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith("/members")}>
                <Link href="/members" className="flex items-center gap-3">
                  <Users size={20} />
                  <span>Членове</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith("/finances")}>
                <Link href="/finances" className="flex items-center gap-3">
                  <Landmark size={20} />
                  <span>Финанси</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith("/sales")}>
                <Link href="/sales" className="flex items-center gap-3">
                  <ShoppingCart size={20} />
                  <span>Продажби</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith("/inventory")}>
                <Link href="/inventory" className="flex items-center gap-3">
                  <Boxes size={20} />
                  <span>Инвентар</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith("/schedule")}>
                <Link href="/schedule" className="flex items-center gap-3">
                  <Calendar size={20} />
                  <span>График</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith("/reservations")}
              >
                <Link href="/reservations" className="flex items-center gap-3">
                  <CalendarCheck size={20} />
                  <span>Резервации</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith("/subscriptions")}
              >
                <Link href="/subscriptions" className="flex items-center gap-3">
                  <Repeat size={20} />
                  <span>Абонаменти</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith("/tournaments")}
              >
                <Link href="/tournaments" className="flex items-center gap-3">
                  <Trophy size={20} />
                  <span>Турнири</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith("/rankings")}>
                <Link href="/rankings" className="flex items-center gap-3">
                  <Medal size={20} />
                  <span>Ранглиста</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith("/reports")}>
                <Link href="/reports" className="flex items-center gap-3">
                  <BarChart size={20} />
                  <span>Отчети</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t flex items-center gap-2 text-red-600">
        <LogOut size={20} /> <span>Изход</span>
      </SidebarFooter>
    </Sidebar>
  );
}
