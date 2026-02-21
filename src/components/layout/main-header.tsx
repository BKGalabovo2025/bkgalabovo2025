'use client';

import { ThemeToggle } from '@/components/ui/theme-toggle';
import RealTimeClock from '@/components/real-time-clock';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamically import UserMenu to prevent it and its dependencies (like Firestore)
// from being included in the initial bundle for unauthenticated pages.
const UserMenu = dynamic(() => import('@/components/layout/user-menu').then(mod => mod.UserMenu), {
  ssr: false, // This component will only be rendered on the client side
  loading: () => <Skeleton className="h-10 w-10 rounded-full" />, // Show a skeleton loader while the component is loading
});

export function MainHeader() {
  return (
    <header className="flex justify-end items-center p-4 animate-in slide-in-from-top-2 duration-500">
      <RealTimeClock />
      <div className="ml-4">
        <ThemeToggle />
      </div>
      <div className="ml-4">
        <UserMenu />
      </div>
    </header>
  );
}
