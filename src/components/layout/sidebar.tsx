'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
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
    <Sidebar {...props} className="bg-white border-r border-gray-200">
      <SidebarHeader className="p-4 border-b">
        <h1 className="text-xl font-bold text-blue-600">{clubInfo.name}</h1>
      </SidebarHeader>
      <SidebarMenu className="p-2 space-y-1">
        {menuItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href} passHref legacyBehavior>
              <SidebarMenuButton 
                isActive={pathname === item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                  pathname === item.href ? "bg-blue-50 text-blue-600" : "hover:bg-gray-100"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
      <SidebarFooter className="p-4 border-t mt-auto">
        {user && (
          <SidebarMenuButton 
            onClick={logout} 
            className="flex items-center gap-3 px-3 py-2 w-full text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Изход</span>
          </SidebarMenuButton>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
