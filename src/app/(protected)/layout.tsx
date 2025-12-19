
export const dynamic = 'force-dynamic';

'use client';

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/sidebar';

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <SidebarProvider>
        <div className="flex min-h-screen">
          <AppSidebar />
          <SidebarInset>
            <main className="flex-1 p-6">
              {children}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
  );
}
