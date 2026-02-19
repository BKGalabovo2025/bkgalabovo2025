
'use client';

import { useLayoutEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/sidebar';
import { MainHeader } from '@/components/layout/main-header';
import { Loader2 } from 'lucide-react';
import { Toaster } from 'sonner'; // CORRECTED IMPORT: Import directly from the library

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
        <div className="flex min-h-screen bg-background text-foreground">
          <AppSidebar collapsible="icon" />
          <div className="flex flex-col flex-1">
            <MainHeader />
            <main className="flex-1 p-6 animate-in fade-in-0 duration-500">
              {children}
            </main>
          </div>
          {/* The Toaster component will now render correctly */}
          <Toaster richColors position="top-center" />
        </div>
      </SidebarProvider>
  );
}
