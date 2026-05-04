"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Search, Bell, Settings, User, LogOut, Command } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const routeConfig: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Начало", subtitle: "Обзор на дейността" },
  "/members": { title: "Членове", subtitle: "Управление на клубната база" },
  "/schedule": { title: "График", subtitle: "График на тренировки и събития" },
  "/reservations": { title: "Резервации", subtitle: "Управление на кортове" },
  "/finances": { title: "Финанси", subtitle: "Счетоводство и приходи" },
  "/sales": { title: "Продажби", subtitle: "Продажби от магазина" },
  "/inventory": { title: "Инвентар", subtitle: "Складова наличност" },
  "/subscriptions": { title: "Абонаменти", subtitle: "Пакетни услуги" },
  "/tournaments": { title: "Турнири", subtitle: "Състезания и турнири" },
  "/rankings": { title: "Ранглиста", subtitle: "Класиране на играчи" },
  "/reports": { title: "Отчети", subtitle: "Анализи и статистики" },
};

export function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  
  const getRouteInfo = () => {
    if (routeConfig[pathname]) return routeConfig[pathname];
    if (pathname.startsWith("/members/")) return { title: "Профил на член", subtitle: "Детайлна информация" };
    if (pathname.startsWith("/inventory/")) return { title: "Детайли на продукт", subtitle: "Инвентар" };
    return { title: "БК ГЪЛЪБОВО", subtitle: "Club Management" };
  };

  const { title, subtitle } = getRouteInfo();

  return (
    <header className="flex h-20 shrink-0 items-center justify-between bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl px-8 sticky top-0 z-30 border-b border-zinc-200/80 dark:border-zinc-800/80 transition-all">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="-ml-1 h-10 w-10 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl transition-all border-none shadow-none bg-transparent" />
        <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-2" />
        <div className="flex flex-col animate-in slide-in-from-left-4 duration-500">
          <h1 className="font-black text-xl tracking-tighter text-zinc-950 dark:text-white uppercase leading-none">
            {title}
          </h1>
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] leading-none mt-1">
            {subtitle}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Search Bar - Visual Component */}
        <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-all cursor-text w-64 group">
          <Search size={16} className="text-zinc-400 group-hover:text-blue-500 transition-colors" />
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex-1">Търсене...</span>
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm">
            <Command size={10} className="text-zinc-400" />
            <span className="text-[10px] font-black text-zinc-400">K</span>
          </div>
        </div>

        {/* Notifications */}
        <button className="relative h-10 w-10 flex items-center justify-center rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 hover:border-blue-200 dark:hover:border-blue-900 transition-all group">
          <Bell size={18} className="text-zinc-400 group-hover:text-blue-500 transition-colors" />
          <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-blue-600 border-2 border-white dark:border-zinc-900 animate-pulse" />
        </button>

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 p-1 pr-3 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all group outline-none">
              <Avatar className="h-9 w-9 border-2 border-transparent group-hover:border-blue-500 transition-all shadow-md">
                <AvatarImage 
                  src={user?.photoURL || ""} 
                  alt={user?.displayName || "User"} 
                  referrerPolicy="no-referrer"
                />
                <AvatarFallback className="bg-zinc-950 text-white font-black text-xs">
                  {user?.displayName?.split(" ").map(n => n[0]).join("").toUpperCase() || <User size={14} />}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-xs font-black text-zinc-950 dark:text-white uppercase leading-none tracking-tight">
                  {user?.displayName || "Администратор"}
                </span>
                <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest leading-none mt-1">
                  Online
                </span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 p-2 rounded-3xl bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-zinc-200 dark:border-zinc-800 shadow-2xl">
            <DropdownMenuLabel className="px-4 py-3">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-black text-zinc-950 dark:text-white uppercase tracking-tight">{user?.displayName}</p>
                <p className="text-[10px] font-bold text-zinc-500 lowercase">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
            <DropdownMenuItem className="px-4 py-3 rounded-2xl cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all group">
              <User className="mr-3 h-4 w-4 text-zinc-400 group-hover:text-blue-500" />
              <span className="text-xs font-bold uppercase tracking-widest">Профил</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="px-4 py-3 rounded-2xl cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all group">
              <Settings className="mr-3 h-4 w-4 text-zinc-400 group-hover:text-blue-500" />
              <span className="text-xs font-bold uppercase tracking-widest">Настройки</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
            <DropdownMenuItem 
              onClick={() => logout()}
              className="px-4 py-3 rounded-2xl cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/20 transition-all group text-red-600"
            >
              <LogOut className="mr-3 h-4 w-4 text-red-500" />
              <span className="text-xs font-black uppercase tracking-widest">Изход</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
