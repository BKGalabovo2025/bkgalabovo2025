'use client';

import { ThemeToggle } from '@/components/ui/theme-toggle';
import RealTimeClock from '@/components/real-time-clock';
import { UserMenu } from './user-menu';

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
