
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import {
  Sidebar, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter
} from '@/components/ui/sidebar';
import { Home, Users, CreditCard, LogOut, ShoppingCart, Receipt } from 'lucide-react';
import { clubInfo } from '@/config/club';

export function AppSidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <Sidebar className="bg-sidebar-background text-sidebar-foreground">
      <SidebarHeader>
        <div className="w-full text-center py-4 px-2">
          <h1 className="text-lg font-bold">{clubInfo.name}</h1>
        </div>
      </SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <Link href="/dashboard" passHref>
            <SidebarMenuButton isActive={pathname === '/dashboard'}>
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
          <Link href="/finances" passHref>
            <SidebarMenuButton isActive={pathname.startsWith('/finances')}>
              <CreditCard className="w-4 h-4" />
              <span>Финанси</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <Link href="/inventory" passHref>
            <SidebarMenuButton isActive={pathname.startsWith('/inventory')}>
              <ShoppingCart className="w-4 h-4" />
              <span>Инвентар</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <Link href="/sales" passHref>
            <SidebarMenuButton isActive={pathname.startsWith('/sales')}>
              <Receipt className="w-4 h-4" />
              <span>Продажби</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      </SidebarMenu>
      <SidebarFooter>
        {user && (
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut}>
              <LogOut className="w-4 h-4" />
              <span>Изход</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
