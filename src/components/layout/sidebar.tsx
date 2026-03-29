'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import {
  Sidebar, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter
} from '@/components/ui/sidebar';
import { Home, Users, CreditCard, LogOut, ShoppingCart, Receipt, Calendar, FileText, Settings, Tag, LayoutGrid } from 'lucide-react';
import { clubInfo } from '@/config/club';

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <Sidebar {...props} className={cn("bg-sidebar text-sidebar-foreground animate-in slide-in-from-left-2 duration-500", props.className)}>
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
          <Link href="/subscriptions" passHref>
            <SidebarMenuButton isActive={pathname.startsWith('/subscriptions')}>
              <CreditCard className="w-4 h-4" />
              <span>Абонаменти</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>

        <SidebarMenuItem>
          <Link href="/finances/services" passHref>
            <SidebarMenuButton isActive={pathname.startsWith('/finances/services')}>
              <Settings className="w-4 h-4" />
              <span>Услуги</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <Link href="/finances/prices" passHref>
            <SidebarMenuButton isActive={pathname.startsWith('/finances/prices')}>
              <Tag className="w-4 h-4" />
              <span>Цени</span>
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
        <SidebarMenuItem>
          <Link href="/schedule" passHref>
            <SidebarMenuButton isActive={pathname.startsWith('/schedule')}>
              <Calendar className="w-4 h-4" />
              <span>График</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <Link href="/reservations" passHref>
            <SidebarMenuButton isActive={pathname.startsWith('/reservations')}>
              <LayoutGrid className="w-4 h-4" />
              <span>Резервации на корт</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <Link href="/reports" passHref>
            <SidebarMenuButton isActive={pathname.startsWith('/reports')}>
              <FileText className="w-4 h-4" />
              <span>Справки</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      </SidebarMenu>
      <SidebarFooter>
        {user && (
          <SidebarMenuItem>
            <SidebarMenuButton onClick={logout}>
              <LogOut className="w-4 h-4" />
              <span>Изход</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
