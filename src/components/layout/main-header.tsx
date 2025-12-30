'use client';

import { ThemeToggle } from '@/components/ui/theme-toggle';

export function MainHeader() {
  return (
    <header className="flex justify-end items-center p-4 animate-in slide-in-from-top-2 duration-500">
      <ThemeToggle />
    </header>
  );
}
