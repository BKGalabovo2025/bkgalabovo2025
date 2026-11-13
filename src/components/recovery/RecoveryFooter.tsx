import Image from "next/image";
import Link from "next/link";

import { Site } from "@/types/site.types";

export function RecoveryFooter({ site }: { site?: Site | null }) {
  const brandName = site?.name?.trim() || "Recovery Zone by ZM";
  const address =
    site?.address?.trim() || "Спортна зала „Енергетик“, град Гълъбово";

  return (
    <footer className="border-t border-zinc-900 bg-black px-6 py-5 sm:py-6">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
        <div className="flex flex-col items-center gap-1 text-center md:items-start md:text-left">
          <Link
            href="/recovery-zone"
            className="group flex items-center gap-2.5 transition-opacity hover:opacity-90"
          >
            <div className="relative size-7 shrink-0 overflow-hidden rounded-lg border border-emerald-500/40 bg-zinc-950 p-1 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
              <Image
                src="/recovery-zone/rz-icon-square.png"
                alt={brandName}
                width={22}
                height={22}
                className="aspect-square size-full object-contain"
                style={{ aspectRatio: "1 / 1" }}
              />
            </div>
            <span className="text-sm font-bold tracking-wider text-white uppercase">
              {brandName}
            </span>
          </Link>
          <span className="text-[11px] text-zinc-400">{address}</span>
        </div>

        {/* Footer Navigation Links */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-zinc-400">
          <Link
            href="/recovery-zone"
            className="transition-colors hover:text-emerald-400"
          >
            За Зоната
          </Link>
          <Link
            href="/recovery-zone/catalog"
            className="transition-colors hover:text-emerald-400"
          >
            Услуги
          </Link>
          <Link
            href="/recovery-zone/team"
            className="transition-colors hover:text-emerald-400"
          >
            Екип
          </Link>
          <Link
            href="/recovery-zone/reviews"
            className="transition-colors hover:text-emerald-400"
          >
            Отзиви
          </Link>
          <Link href="/club" className="transition-colors hover:text-blue-400">
            БК Гълъбово
          </Link>
          <Link href="/" className="transition-colors hover:text-white">
            Портал
          </Link>
        </div>

        <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
          © {new Date().getFullYear()} {brandName}. Всички права запазени
        </span>
      </div>
    </footer>
  );
}
