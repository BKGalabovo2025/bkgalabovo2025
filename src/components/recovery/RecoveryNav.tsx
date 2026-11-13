"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CalendarCheck, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { GoogleTranslateWidget } from "@/components/shared/GoogleTranslateWidget";
import { ThemeToggle } from "@/components/theme-toggle";
import { Site } from "@/types/site.types";

interface RecoveryNavProps {
  onBookClick?: () => void;
  site?: Site | null;
}

export function RecoveryNav({ onBookClick, site }: RecoveryNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const brandName = site?.name?.trim() || "RECOVERY ZONE";

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-emerald-500/20 bg-black/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:px-5 lg:gap-3 lg:px-6">
        {/* Brand */}
        <Link
          prefetch={false}
          href="/recovery-zone"
          className="group flex shrink-0 items-center gap-2 whitespace-nowrap transition-opacity hover:opacity-95"
        >
          <div className="relative size-9 shrink-0 overflow-hidden rounded-xl border border-emerald-500/50 bg-emerald-950/40 p-1.5 shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all group-hover:border-emerald-400 group-hover:shadow-[0_0_16px_rgba(16,185,129,0.5)]">
            <Image
              src="/recovery-zone/rz-icon-square.png"
              alt="Recovery Zone Logo"
              width={28}
              height={28}
              className="size-full object-contain"
              priority
            />
          </div>
          <div className="flex flex-col leading-none">
            <span className="max-w-32 truncate text-sm font-bold tracking-wider whitespace-nowrap text-white xl:max-w-36">
              {brandName}
            </span>
            <span className="mt-0.5 text-[10px] font-semibold tracking-widest whitespace-nowrap text-emerald-400">
              by ZM
            </span>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden items-center gap-4 text-[11px] font-bold tracking-wider whitespace-nowrap text-zinc-400 uppercase lg:flex xl:gap-5">
          <Link
            prefetch={false}
            href="/recovery-zone#about"
            className="whitespace-nowrap transition-colors hover:text-emerald-400"
          >
            За Зоната
          </Link>
          <Link
            prefetch={false}
            href="/recovery-zone#attachments"
            className="whitespace-nowrap transition-colors hover:text-emerald-400"
          >
            Приставки
          </Link>
          <Link
            prefetch={false}
            href="/recovery-zone/catalog"
            aria-current={
              isActive("/recovery-zone/catalog") ? "page" : undefined
            }
            className={`whitespace-nowrap transition-colors hover:text-emerald-400 ${
              isActive("/recovery-zone/catalog") ? "text-emerald-400" : ""
            }`}
          >
            Услуги
          </Link>
          <Link
            prefetch={false}
            href="/recovery-zone/team"
            aria-current={isActive("/recovery-zone/team") ? "page" : undefined}
            className={`whitespace-nowrap transition-colors hover:text-emerald-400 ${
              isActive("/recovery-zone/team") ? "text-emerald-400" : ""
            }`}
          >
            Екип
          </Link>
          <Link
            prefetch={false}
            href="/recovery-zone/reviews"
            aria-current={
              isActive("/recovery-zone/reviews") ? "page" : undefined
            }
            className={`whitespace-nowrap transition-colors hover:text-emerald-400 ${
              isActive("/recovery-zone/reviews") ? "text-emerald-400" : ""
            }`}
          >
            Отзиви
          </Link>
          <Link
            prefetch={false}
            href="/recovery-zone#contacts"
            className="whitespace-nowrap transition-colors hover:text-emerald-400"
          >
            Контакти
          </Link>
        </div>

        {/* Right Actions & Controls */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
          {/* Brand Switcher Pill */}
          <div className="hidden items-center gap-0.5 rounded-full border border-white/10 bg-white/5 p-0.5 text-[11px] font-semibold whitespace-nowrap xl:inline-flex">
            <Link
              prefetch={false}
              href="/club"
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 whitespace-nowrap text-blue-300 transition-colors hover:bg-blue-500/15 hover:text-blue-200"
            >
              <span className="size-1.5 rounded-full bg-blue-400" />
              <span>БК Гълъбово</span>
            </Link>
            <Link
              prefetch={false}
              href="/"
              className="rounded-full px-2.5 py-1 whitespace-nowrap text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              Портал
            </Link>
          </div>

          {onBookClick ? (
            <button
              type="button"
              onClick={onBookClick}
              className="hidden shrink-0 items-center gap-1.5 rounded-full bg-emerald-500 px-3.5 py-1.5 text-[11px] font-bold whitespace-nowrap text-zinc-950 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] sm:inline-flex"
            >
              <CalendarCheck size={13} className="shrink-0" />
              <span>Запази час</span>
            </button>
          ) : (
            <Link
              prefetch={false}
              href="/recovery-zone/catalog"
              className="hidden shrink-0 items-center gap-1.5 rounded-full bg-emerald-500 px-3.5 py-1.5 text-[11px] font-bold whitespace-nowrap text-zinc-950 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] sm:inline-flex"
            >
              <CalendarCheck size={13} className="shrink-0" />
              <span>Услуги</span>
            </Link>
          )}

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
            className="overflow-hidden border-t border-emerald-900/30 bg-white/95 px-4 backdrop-blur-xl sm:px-6 lg:hidden dark:bg-black/95"
          >
            <div className="flex flex-col gap-4 py-5 text-xs font-bold tracking-widest text-zinc-300 uppercase sm:gap-5 sm:text-sm">
              <Link
                prefetch={false}
                href="/recovery-zone#about"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-emerald-400"
              >
                За Зоната
              </Link>
              <Link
                prefetch={false}
                href="/recovery-zone#attachments"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-emerald-400"
              >
                Приставки
              </Link>
              <Link
                prefetch={false}
                href="/recovery-zone/catalog"
                onClick={() => setMobileMenuOpen(false)}
                aria-current={
                  isActive("/recovery-zone/catalog") ? "page" : undefined
                }
                className={`hover:text-emerald-400 ${
                  isActive("/recovery-zone/catalog") ? "text-emerald-400" : ""
                }`}
              >
                Услуги
              </Link>
              <Link
                prefetch={false}
                href="/recovery-zone#working-hours"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-emerald-400"
              >
                Работно време
              </Link>
              <Link
                prefetch={false}
                href="/recovery-zone#info"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-emerald-400"
              >
                Информация
              </Link>
              <Link
                prefetch={false}
                href="/recovery-zone/team"
                onClick={() => setMobileMenuOpen(false)}
                aria-current={
                  isActive("/recovery-zone/team") ? "page" : undefined
                }
                className={`hover:text-emerald-400 ${
                  isActive("/recovery-zone/team") ? "text-emerald-400" : ""
                }`}
              >
                Екип
              </Link>
              <Link
                prefetch={false}
                href="/recovery-zone/reviews"
                onClick={() => setMobileMenuOpen(false)}
                aria-current={
                  isActive("/recovery-zone/reviews") ? "page" : undefined
                }
                className={`hover:text-emerald-400 ${
                  isActive("/recovery-zone/reviews") ? "text-emerald-400" : ""
                }`}
              >
                Отзиви
              </Link>
              <Link
                prefetch={false}
                href="/recovery-zone#contacts"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-emerald-400"
              >
                Контакти
              </Link>
              {onBookClick && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onBookClick();
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-zinc-950 transition-colors hover:bg-emerald-400"
                >
                  <CalendarCheck size={16} />
                  <span>Запази час</span>
                </button>
              )}
              <div className="flex items-center justify-between border-t border-emerald-900/30 pt-4">
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
                  href="/club"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300 hover:bg-blue-500/20"
                >
                  БК Гълъбово
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
