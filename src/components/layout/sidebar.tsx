'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { useAuth } from '@/context/auth-context';
import { Sidebar, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from '@/components/ui/sidebar';
import { Home, Users, CreditCard, LogOut, ShoppingCart, Receipt, Calendar, FileText, Settings, Tag, LayoutGrid } from 'lucide-react';
import { clubInfo } from '@/config/club';

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const menuItems = [
    { href: '/dashboard', icon: Home, label: 'Начало' },
    { href: '/members', icon: Users, label: 'Членове' },
    { href: '/subscriptions', icon: CreditCard, label: 'Абонаменти' },
    { href: '/finances/services', icon: Settings, label: 'Услуги' },
    { href: '/finances/prices', icon: Tag, label: 'Цени' },
    { href: '/inventory', icon: ShoppingCart, label: 'Инвентар' },
    { href: '/sales', icon: Receipt, label: 'Продажби' },
    { href: '/schedule', icon: Calendar, label: 'График' },
    { href: '/reservations', icon: LayoutGrid, label: 'Резервации' },
    { href: '/reports', icon: FileText, label: 'Справки' },
  ];

  return (
    <Sidebar {...props} className="border-r bg-white">
      <SidebarHeader className="p-4 border-b">
        <h1 className="text-xl font-bold text-blue-600 truncate">{clubInfo.name}</h1>
      </SidebarHeader>
      <div className="flex-1 overflow-y-auto p-2">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href}>
                <SidebarMenuButton isActive={pathname === item.href} className="w-full gap-3 text-gray-700">
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </div>
      <SidebarFooter className="p-4 border-t">
        {user && (
          <SidebarMenuButton onClick={logout} className="w-full gap-3 text-red-600 hover:bg-red-50 hover:text-red-700">
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Изход</span>
          </SidebarMenuButton>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
