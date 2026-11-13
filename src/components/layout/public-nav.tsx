"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, Star, Users, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { GoogleTranslateWidget } from "@/components/shared/GoogleTranslateWidget";
import { ThemeToggle } from "@/components/theme-toggle";
import { Site } from "@/types/site.types";

export function PublicNav({ clubSite }: { clubSite?: Site | null }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const brandName = clubSite?.name?.trim() || "БК ГЪЛЪБОВО";

  const isActive = (href: string) => {
    if (href === "/club") return pathname === "/club";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-blue-400/20 bg-black/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:px-5 lg:gap-3 lg:px-6">
        <Link
          prefetch={false}
          href="/club"
          className="flex shrink-0 items-center gap-2 whitespace-nowrap"
        >
          <div className="relative size-8 shrink-0 overflow-hidden rounded-xl shadow-[0_0_10px_rgba(30,58,138,0.5)]">
            <Image
              src="/icons/badge-option-3-light-squircle.png"
              alt="Logo"
              width={32}
              height={32}
              className="object-cover"
              priority
            />
          </div>
          <span className="max-w-44 truncate text-xs font-bold tracking-wide whitespace-nowrap text-white uppercase sm:max-w-none xl:text-[13px]">
            {brandName}
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden items-center gap-3 text-[11px] font-bold tracking-wider whitespace-nowrap text-zinc-400 uppercase lg:flex xl:gap-3.5">
          <Link
            prefetch={false}
            href="/club#about"
            className="whitespace-nowrap transition-colors hover:text-blue-400"
          >
            За Клуба
          </Link>
          <Link
            prefetch={false}
            href="/club#activities"
            className="whitespace-nowrap transition-colors hover:text-blue-400"
          >
            Дейности
          </Link>
          <Link
            prefetch={false}
            href="/club/catalog"
            aria-current={isActive("/club/catalog") ? "page" : undefined}
            className={`whitespace-nowrap transition-colors hover:text-blue-400 ${
              isActive("/club/catalog") ? "text-blue-400" : ""
            }`}
          >
            Услуги
          </Link>
          <Link
            prefetch={false}
            href="/club/schedule"
            aria-current={isActive("/club/schedule") ? "page" : undefined}
            className={`whitespace-nowrap transition-colors hover:text-blue-400 ${
              isActive("/club/schedule") ? "text-blue-400" : ""
            }`}
          >
            График
          </Link>
          <Link
            prefetch={false}
            href="/club/team"
            aria-current={isActive("/club/team") ? "page" : undefined}
            className={`whitespace-nowrap transition-colors hover:text-blue-400 ${
              isActive("/club/team") ? "text-blue-400" : ""
            }`}
          >
            Отбор
          </Link>
          <Link
            prefetch={false}
            href="/club#contacts"
            className="whitespace-nowrap transition-colors hover:text-blue-400"
          >
            Контакти
          </Link>
          <Link
            prefetch={false}
            href="/club/reviews"
            aria-current={isActive("/club/reviews") ? "page" : undefined}
            className={`inline-flex items-center gap-1 whitespace-nowrap transition-colors hover:text-amber-300 ${
              isActive("/club/reviews") ? "text-amber-300" : "text-amber-400"
            }`}
          >
            <Star
              size={12}
              className="shrink-0 fill-amber-400 text-amber-400"
            />
            <span>Отзиви</span>
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {/* Brand Switcher Pill */}
          <div className="hidden items-center gap-0.5 rounded-full border border-white/10 bg-white/5 p-0.5 text-[11px] font-semibold whitespace-nowrap xl:inline-flex">
            <Link
              prefetch={false}
              href="/recovery-zone"
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 whitespace-nowrap text-emerald-300 transition-colors hover:bg-emerald-500/15 hover:text-emerald-200"
            >
              <span className="size-1.5 rounded-full bg-emerald-400" />
              <span>Recovery Zone</span>
            </Link>
            <Link
              prefetch={false}
              href="/"
              className="rounded-full px-2 py-1 whitespace-nowrap text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              Портал
            </Link>
          </div>

          <Link
            prefetch={false}
            href="/club/parents/login"
            className="hidden shrink-0 items-center gap-1.5 rounded-full border border-blue-500/40 bg-linear-to-r from-blue-600/90 to-indigo-600/90 px-3 py-1.5 text-[11px] font-bold whitespace-nowrap text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all hover:border-blue-400 hover:shadow-[0_0_20px_rgba(37,99,235,0.5)] sm:inline-flex"
          >
            <Users size={13} className="shrink-0" />
            <span>Родителски вход</span>
          </Link>

          <span className="hidden h-5 w-px bg-white/15 sm:block" />

          <ThemeToggle className="shrink-0 border-white/20 bg-white/10 text-white shadow-none hover:bg-white/20 active:scale-95 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20" />
          <div className="shrink-0">
            <GoogleTranslateWidget />
          </div>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-95 lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Затвори менюто" : "Отвори менюто"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X size={18} strokeWidth={2} />
            ) : (
              <Menu size={18} strokeWidth={2} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-blue-900/30 bg-white/95 px-4 backdrop-blur-xl sm:px-6 lg:hidden dark:bg-black/95"
          >
            <div className="flex flex-col gap-4 py-4 text-xs font-bold tracking-widest text-zinc-300 uppercase sm:gap-6 sm:py-6 sm:text-sm">
              <Link
                prefetch={false}
                href="/club#about"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-blue-400"
              >
                За Клуба
              </Link>
              <Link
                prefetch={false}
                href="/club#activities"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-blue-400"
              >
                Дейности
              </Link>
              <Link
                prefetch={false}
                href="/club/catalog"
                onClick={() => setMobileMenuOpen(false)}
                aria-current={isActive("/club/catalog") ? "page" : undefined}
                className={`hover:text-blue-400 ${
                  isActive("/club/catalog") ? "text-blue-400" : ""
                }`}
              >
                Услуги
              </Link>
              <Link
                prefetch={false}
                href="/club/schedule"
                onClick={() => setMobileMenuOpen(false)}
                aria-current={isActive("/club/schedule") ? "page" : undefined}
                className={`hover:text-blue-400 ${
                  isActive("/club/schedule") ? "text-blue-400" : ""
                }`}
              >
                График
              </Link>
              <Link
                prefetch={false}
                href="/club/team"
                onClick={() => setMobileMenuOpen(false)}
                aria-current={isActive("/club/team") ? "page" : undefined}
                className={`hover:text-blue-400 ${
                  isActive("/club/team") ? "text-blue-400" : ""
                }`}
              >
                Отбор
              </Link>
              <Link
                prefetch={false}
                href="/club#contacts"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-blue-400"
              >
                Контакти
              </Link>
              <Link
                prefetch={false}
                href="/club/reviews"
                onClick={() => setMobileMenuOpen(false)}
                aria-current={isActive("/club/reviews") ? "page" : undefined}
                className={`flex items-center gap-1.5 hover:text-amber-300 ${
                  isActive("/club/reviews")
                    ? "text-amber-300"
                    : "text-amber-400"
                }`}
              >
                <Star size={14} className="fill-amber-400 text-amber-400" />
                <span>Отзиви</span>
              </Link>
              <Link
                prefetch={false}
                href="/club/parents/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-xl border border-blue-500/40 bg-blue-950/40 px-3.5 py-2.5 font-bold text-blue-300 hover:bg-blue-900/60 hover:text-white"
              >
                <Users size={16} />
                <span>Родителски портал</span>
              </Link>
              <div className="flex items-center justify-between border-t border-blue-900/30 pt-4">
                <Link
                  prefetch={false}
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  Портал
                </Link>
                <Link
                  prefetch={false}
                  href="/recovery-zone"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20"
                >
                  Recovery Zone
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
