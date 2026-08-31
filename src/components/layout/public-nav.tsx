"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { GoogleTranslateWidget } from "@/components/shared/GoogleTranslateWidget";
import { Site } from "@/types/site.types";

export function PublicNav({ clubSite: _clubSite }: { clubSite?: Site | null }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-blue-400/30 bg-black/80 px-6 py-4 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <Link href="/club" className="flex items-center gap-2">
          <div className="relative size-8 overflow-hidden rounded-lg border border-blue-400/50 bg-white/5 p-1 shadow-[0_0_10px_rgba(30,58,138,0.5)]">
            <Image
              src="/icons/LOGO.jpg"
              alt="Logo"
              width={24}
              height={24}
              className="object-contain"
            />
          </div>
          <span className="text-sm font-medium text-white">БК ГЪЛЪБОВО</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden items-center gap-8 text-[11px] font-bold tracking-widest text-zinc-400 uppercase md:flex">
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
            className="text-blue-400 transition-colors hover:text-blue-400"
          >
            Отбор
          </Link>
          <Link
            href="/club/reviews"
            className="flex items-center gap-1 text-amber-400 transition-colors hover:text-amber-300"
          >
            <span>⭐</span>
            <span>Отзиви</span>
          </Link>
          <Link
            href="/club#contacts"
            className="transition-colors hover:text-blue-400"
          >
            Контакти
          </Link>
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <Link
            href="/"
            className="text-xs font-medium tracking-widest text-zinc-400 uppercase transition-colors hover:text-white"
          >
            Портал
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <GoogleTranslateWidget />
          {/* Mobile Menu Toggle */}
          <button
            className="p-2 text-white md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Затвори менюто" : "Отвори менюто"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
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
            className="-mx-6 mt-4 overflow-hidden border-t border-blue-900/30 bg-black/95 px-6 backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col gap-6 py-6 text-sm font-bold tracking-widest text-zinc-300 uppercase">
              <Link
                href="/club#about"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-blue-400"
              >
                За Клуба
              </Link>
              <Link
                href="/club#activities"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-blue-400"
              >
                Дейности
              </Link>
              <Link
                href="/club/catalog"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-blue-400"
              >
                Услуги
              </Link>
              <Link
                href="/club#schedule"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-blue-400"
              >
                График
              </Link>
              <Link
                href="/club/team"
                onClick={() => setMobileMenuOpen(false)}
                className="text-blue-400 hover:text-blue-400"
              >
                Отбор
              </Link>
              <Link
                href="/club/reviews"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300"
              >
                <span>⭐</span>
                <span>Отзиви</span>
              </Link>
              <Link
                href="/club#contacts"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-blue-400"
              >
                Контакти
              </Link>
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="border-t border-blue-900/30 pt-4 text-zinc-500 hover:text-white"
              >
                Обратно към Портала
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
