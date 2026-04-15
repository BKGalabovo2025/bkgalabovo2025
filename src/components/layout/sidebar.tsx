'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { Sidebar, SidebarHeader, SidebarContent, SidebarGroup, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from '@/components/ui/sidebar';
import { Home, Users, LogOut } from 'lucide-react';

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  return (
    <Sidebar {...props} collapsible="icon">
      <SidebarHeader className="p-4 border-b font-bold text-blue-700">БК ГЪЛЪБОВО</SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/dashboard'}>
                <Link href="/dashboard" className="flex items-center gap-3"><Home size={20} /><span>Начало</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/members'}>
                <Link href="/members" className="flex items-center gap-3"><Users size={20} /><span>Членове</span></Link>
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