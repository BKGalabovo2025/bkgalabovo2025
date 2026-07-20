 
 
 
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
          className="relative size-10 overflow-hidden rounded-full border border-zinc-200 p-0 shadow-sm transition-all hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800"
        >
          <Avatar className="size-9 border-2 border-white dark:border-zinc-950">
            <AvatarImage src={user.photoURL || ""} alt={user.email || "User"} />
            <AvatarFallback className="bg-zinc-950 text-[10px] font-bold text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-64 rounded-2xl border-zinc-100 p-2 shadow-2xl dark:border-zinc-800"
        align="end"
        forceMount
      >
        <DropdownMenuLabel className="p-4 font-normal">
          <div className="flex flex-col space-y-1">
            <p className="flex items-center gap-2 text-xs font-bold tracking-widest text-zinc-400 uppercase">
              <Shield size={12} className="text-emerald-500" /> Администратор
            </p>
            <p className="truncate pt-1 text-sm leading-none font-medium text-zinc-900 dark:text-white">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="mx-2 bg-zinc-50 dark:bg-zinc-800" />
        <DropdownMenuGroup className="p-1">
          <DropdownMenuItem
            onClick={() => router.push("/settings?tab=profile")}
            className="cursor-pointer rounded-xl px-3 py-2.5 text-xs font-medium tracking-wider text-zinc-600 uppercase transition-colors hover:text-zinc-950 focus:bg-zinc-50 dark:text-zinc-400 dark:hover:text-white dark:focus:bg-zinc-900"
          >
            <User className="mr-3 size-4" strokeWidth={1.5} />
            Моят Профил
            <DropdownMenuShortcut className="text-[10px] opacity-30">
              ⇧⌘P
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.push("/settings")}
            className="cursor-pointer rounded-xl px-3 py-2.5 text-xs font-medium tracking-wider text-zinc-600 uppercase transition-colors hover:text-zinc-950 focus:bg-zinc-50 dark:text-zinc-400 dark:hover:text-white dark:focus:bg-zinc-900"
          >
            <Settings className="mr-3 size-4" strokeWidth={1.5} />
            Настройки
            <DropdownMenuShortcut className="text-[10px] opacity-30">
              ⌘S
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="mx-2 bg-zinc-50 dark:bg-zinc-800" />
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer rounded-xl px-3 py-2.5 text-xs font-medium tracking-wider text-rose-500 uppercase transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
        >
          <LogOut className="mr-3 size-4" strokeWidth={1.5} />
          Изход
          <DropdownMenuShortcut className="text-[10px] opacity-30">
            ⇧⌘Q
          </DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
