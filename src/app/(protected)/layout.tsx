
'use client';

import { useLayoutEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/sidebar';
import { MainHeader } from '@/components/layout/main-header';
import { Loader2 } from 'lucide-react';
import { Toaster } from 'sonner';

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useLayoutEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        router.replace('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      {/*
        AppSidebar now renders as a fixed panel on desktop (md+)
        and as a Sheet/drawer on mobile — handled automatically by shadcn/ui.
        No hardcoded ml-64 needed.
      */}
      <AppSidebar />
      <SidebarInset>
        <MainHeader />
        <main className="flex-1 p-4 sm:p-6">>
          {children}
        </main>
      </SidebarInset>
      <Toaster richColors position="top-center" />
    </SidebarProvider>
  );
}

