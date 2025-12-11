
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Sidebar, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter
} from '@/components/ui/sidebar';
import { Home, Users, DollarSign, Calendar, ShoppingCart, FileText } from 'lucide-react';

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        {/* Placeholder for Logo */}
        <div className="w-full text-center py-4">
          <h1 className="text-xl font-bold">Badminton Club</h1>
        </div>
      </SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <Link href="/" passHref>
            <SidebarMenuButton isActive={pathname === '/'}>
              <Home className="w-4 h-4" />
              <span>Начало</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <Link href="/members" passHref>
            <SidebarMenuButton isActive={pathname.startsWith('/members')}>
              <Users className="w-4 h-4" />
              <span>Членове</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <Link href="/finance" passHref>
            <SidebarMenuButton isActive={pathname.startsWith('/finance')}>
              <DollarSign className="w-4 h-4" />
              <span>Финанси</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      </SidebarMenu>
      <SidebarFooter>
        {/* Optional: Add footer content here, like a logout button */}
      </SidebarFooter>
    </Sidebar>
  );
}
