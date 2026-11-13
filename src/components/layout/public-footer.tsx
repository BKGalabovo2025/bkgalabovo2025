import { Star, Trophy } from "lucide-react";
import Link from "next/link";

import { Site } from "@/types/site.types";

export function PublicFooter({ clubSite }: { clubSite?: Site | null }) {
  const brandName = clubSite?.name?.trim() || "СНЦ „Бадминтон Клуб Гълъбово“";
  const address =
    clubSite?.address?.trim() || "Спортна зала „Енергетик“, град Гълъбово";

  return (
    <footer className="border-t border-zinc-900 bg-black px-6 py-5 sm:py-6">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
        <div className="flex flex-col items-center gap-1 text-center md:items-start md:text-left">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-xl bg-blue-400">
              <Trophy size={14} className="text-white" />
            </div>
            <span className="text-sm font-bold text-zinc-400 uppercase">
              {brandName}
            </span>
          </div>
          <span className="text-[11px] text-zinc-500">{address}</span>
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
            href="/club/schedule"
            className="transition-colors hover:text-blue-400"
          >
            График и Турнири
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
            <Star size={12} className="fill-amber-400 text-amber-400" />
            <span>Отзиви</span>
          </Link>
          <Link
            href="/recovery-zone"
            className="transition-colors hover:text-emerald-400"
          >
            Recovery Zone
          </Link>
          <Link href="/" className="transition-colors hover:text-white">
            Портал
          </Link>
        </div>

        <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
          © {new Date().getFullYear()} Всички права запазени
        </span>
      </div>
    </footer>
  );
}
