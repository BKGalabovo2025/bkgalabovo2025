'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { Sidebar, SidebarHeader, SidebarContent, SidebarGroup, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from '@/components/ui/sidebar';
import { Home, Users, Calendar, CreditCard, LogOut } from 'lucide-react';
export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  return (
    <Sidebar {...props} collapsible="icon">
      <SidebarHeader className="p-4 border-b font-bold text-blue-700 uppercase">БК Гълъбово</SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/dashboard'}>
                <Link href="/dashboard" className="flex items-center gap-3"><Home className="h-5 w-5" /><span>Начало</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/members'}>
                <Link href="/members" className="flex items-center gap-3"><Users className="h-5 w-5" /><span>Членове</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t text-red-600 flex items-center gap-2 cursor-pointer hover:bg-red-50"><LogOut className="h-5 w-5" /><span>Изход</span></SidebarFooter>
    </Sidebar>
  );
}