import { Trophy } from "lucide-react";
import Link from "next/link";

import { Site } from "@/types/site.types";

export function PublicFooter({
  clubSite: _clubSite,
}: {
  clubSite?: Site | null;
}) {
  return (
    <footer className="border-t border-zinc-900 bg-black px-6 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-xl bg-blue-400">
            <Trophy size={14} className="text-white" />
          </div>
          <span className="text-sm font-bold text-zinc-400 uppercase">
            СНЦ „Бадминтон Клуб Гълъбово“
          </span>
        </div>

        {/* Footer Navigation Links */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-zinc-400">
          <Link
            href="/club#about"
            className="transition-colors hover:text-blue-400"
          >
            За Клуба
          </Link>
          <Link
            href="/club#activities"
            className="transition-colors hover:text-blue-400"
          >
            Дейности
          </Link>
          <Link
            href="/club/catalog"
            className="transition-colors hover:text-blue-400"
          >
            Услуги
          </Link>
          <Link
            href="/club#schedule"
            className="transition-colors hover:text-blue-400"
          >
            График
          </Link>
          <Link
            href="/club/team"
            className="transition-colors hover:text-blue-400"
          >
            Отбор
          </Link>
          <Link
            href="/club#contacts"
            className="transition-colors hover:text-blue-400"
          >
            Контакти
          </Link>
          <Link
            href="/club/reviews"
            className="flex items-center gap-1 text-amber-400 transition-colors hover:text-amber-300"
          >
            <span>⭐</span>
            <span>Отзиви</span>
          </Link>
        </div>

        <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
          © {new Date().getFullYear()} Всички права запазени
        </span>
      </div>
    </footer>
  );
}
