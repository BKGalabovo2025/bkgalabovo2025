"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Site } from "@/types/site.types";

export function PublicNav({ clubSite: _clubSite }: { clubSite?: Site | null }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-black/80 backdrop-blur-xl border-b border-blue-400/30">
      <div className="flex items-center justify-between">
        <Link href="/club" className="flex items-center gap-2">
          <div className="h-8 w-8 relative overflow-hidden rounded-lg bg-white/5 p-1 border border-blue-400/50 shadow-[0_0_10px_rgba(30,58,138,0.5)]">
            <Image
              src="/logo.png"
              alt="Logo"
              width={24}
              height={24}
              className="object-contain"
            />
          </div>
          <span className="font-medium text-sm text-white">БК ГЪЛЪБОВО</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest text-zinc-400">
          <Link
            href="/club#about"
            className="hover:text-blue-400 transition-colors"
          >
            За Клуба
          </Link>
          <Link
            href="/club#activities"
            className="hover:text-blue-400 transition-colors"
          >
            Дейности
          </Link>
          <Link
            href="/club/catalog"
            className="hover:text-blue-400 transition-colors"
          >
            Услуги
          </Link>
          <Link
            href="/club#schedule"
            className="hover:text-blue-400 transition-colors"
          >
            График
          </Link>
          <Link
            href="/club/team"
            className="hover:text-blue-400 transition-colors text-blue-400"
          >
            Отбор
          </Link>
          <Link
            href="/club#contacts"
            className="hover:text-blue-400 transition-colors"
          >
            Контакти
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/"
            className="text-xs font-medium uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
          >
            Портал
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-white p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Затвори менюто" : "Отвори менюто"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden bg-black/95 backdrop-blur-xl border-t border-blue-900/30 mt-4 -mx-6 px-6"
          >
            <div className="flex flex-col gap-6 py-6 text-sm font-bold uppercase tracking-widest text-zinc-300">
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
                className="hover:text-blue-400 text-blue-400"
              >
                Отбор
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
                className="text-zinc-500 hover:text-white pt-4 border-t border-blue-900/30"
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
