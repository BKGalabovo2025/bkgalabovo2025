'use client';

export const dynamic = 'force-dynamic';

import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/sidebar';
import { MainHeader } from '@/components/layout/main-header';

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <SidebarProvider>
        <div className="flex min-h-screen bg-background text-foreground">
          <AppSidebar collapsible="icon" />
          <div className="flex flex-col flex-1">
            <MainHeader />
            <main className="flex-1 p-6">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
  );
}
