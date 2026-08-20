import { Mail } from "lucide-react";
import Image from "next/image";

import { BentoCard } from "@/components/ui/bento-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";

export function ProfileTab() {
  const { user } = useAuth();

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
      <BentoCard className="flex flex-col items-center space-y-6 border border-zinc-100 bg-white p-10 text-center md:col-span-4 dark:border-zinc-900 dark:bg-zinc-950">
        <div className="relative flex size-40 items-center justify-center overflow-hidden rounded-full border border-zinc-100 bg-zinc-50 shadow-none transition-all group-hover:scale-105 dark:border-zinc-800 dark:bg-zinc-900">
          {user?.photoURL ? (
            <Image
              src={user.photoURL}
              alt="Profile"
              fill
              className="object-cover"
            />
          ) : (
            <Image
              src="/icons/LOGO.jpg"
              alt="Club Logo"
              fill
              className="object-contain p-6 opacity-80"
            />
          )}
        </div>
        <div>
          <h3 className="w-full max-w-[250px] truncate px-2 text-2xl font-light text-zinc-900 dark:text-white">
            {user?.displayName || user?.email?.split("@")[0] || "Администратор"}
          </h3>
          <p className="mt-1 text-[11px] font-medium tracking-widest text-primary uppercase">
            Супер Потребител
          </p>
        </div>
        <div className="w-full space-y-6 border-t border-zinc-50 pt-8 dark:border-zinc-900">
          <div className="flex flex-col items-center gap-1.5 text-[11px] font-medium tracking-widest uppercase">
            <span className="text-zinc-400">Последен вход</span>
            <span className="text-[13px] font-bold tracking-normal text-zinc-900 dark:text-white">
              {user?.metadata?.lastSignInTime
                ? new Date(user.metadata.lastSignInTime).toLocaleString(
                    "bg-BG",
                    {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )
                : "Неизвестно"}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1.5 text-[11px] font-medium tracking-widest uppercase">
            <span className="text-zinc-400">Ниво на достъп</span>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-[12px] font-bold tracking-wider text-primary">
              FULL ACCESS
            </span>
          </div>
        </div>
      </BentoCard>

      <BentoCard className="space-y-10 border border-zinc-100 bg-white p-10 md:col-span-8 dark:border-zinc-900 dark:bg-zinc-950">
        <div className="flex items-center gap-4">
          <Mail className="size-5 text-primary" strokeWidth={1.5} />
          <h3 className="text-2xl font-light text-zinc-900 dark:text-white">
            Лична Информация
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="space-y-3">
            <Label className="text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
              Име
            </Label>
            <Input
              defaultValue="Бадминтон клуб"
              className="h-14 rounded-xl border-zinc-100 bg-zinc-50/50 text-sm font-light shadow-none focus-visible:ring-primary dark:border-zinc-800 dark:bg-zinc-900/50"
            />
          </div>
          <div className="space-y-3">
            <Label className="text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
              Фамилия
            </Label>
            <Input
              defaultValue="Гълъбово"
              className="h-14 rounded-xl border-zinc-100 bg-zinc-50/50 text-sm font-light shadow-none focus-visible:ring-primary dark:border-zinc-800 dark:bg-zinc-900/50"
            />
          </div>
          <div className="space-y-3 md:col-span-2">
            <Label className="text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
              Имейл Адрес
            </Label>
            <Input
              defaultValue={user?.email || ""}
              disabled
              className="h-14 cursor-not-allowed rounded-xl border-zinc-100 bg-zinc-50/50 text-sm font-light opacity-60 shadow-none dark:border-zinc-800 dark:bg-zinc-900/50"
            />
          </div>
        </div>
      </BentoCard>
    </div>
  );
}
