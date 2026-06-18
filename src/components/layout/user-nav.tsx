/* eslint-disable sonarjs/no-nested-conditional */
/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { User, Settings, LogOut, Shield } from "lucide-react";

export function UserNav() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;

  const initials = user.email
    ? user.email.split("@")[0].substring(0, 2).toUpperCase()
    : "AD";

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full border border-zinc-200 dark:border-zinc-800 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all overflow-hidden shadow-sm"
        >
          <Avatar className="h-9 w-9 border-2 border-white dark:border-zinc-950">
            <AvatarImage src={user.photoURL || ""} alt={user.email || "User"} />
            <AvatarFallback className="bg-zinc-950 text-white text-[10px] font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-64 rounded-2xl p-2 shadow-2xl border-zinc-100 dark:border-zinc-800"
        align="end"
        forceMount
      >
        <DropdownMenuLabel className="font-normal p-4">
          <div className="flex flex-col space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
              <Shield size={12} className="text-emerald-500" /> Администратор
            </p>
            <p className="text-sm font-medium leading-none text-zinc-900 dark:text-white truncate pt-1">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-zinc-50 dark:bg-zinc-800 mx-2" />
        <DropdownMenuGroup className="p-1">
          <DropdownMenuItem
            onClick={() => router.push("/settings?tab=profile")}
            className="rounded-xl px-3 py-2.5 text-xs font-medium uppercase tracking-wider text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white focus:bg-zinc-50 dark:focus:bg-zinc-900 transition-colors cursor-pointer"
          >
            <User className="mr-3 h-4 w-4" strokeWidth={1.5} />
            Моят Профил
            <DropdownMenuShortcut className="text-[10px] opacity-30">
              ⇧⌘P
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.push("/settings")}
            className="rounded-xl px-3 py-2.5 text-xs font-medium uppercase tracking-wider text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white focus:bg-zinc-50 dark:focus:bg-zinc-900 transition-colors cursor-pointer"
          >
            <Settings className="mr-3 h-4 w-4" strokeWidth={1.5} />
            Настройки
            <DropdownMenuShortcut className="text-[10px] opacity-30">
              ⌘S
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-zinc-50 dark:bg-zinc-800 mx-2" />
        <DropdownMenuItem
          onClick={handleLogout}
          className="rounded-xl px-3 py-2.5 text-xs font-medium uppercase tracking-wider text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
        >
          <LogOut className="mr-3 h-4 w-4" strokeWidth={1.5} />
          Изход
          <DropdownMenuShortcut className="text-[10px] opacity-30">
            ⇧⌘Q
          </DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
