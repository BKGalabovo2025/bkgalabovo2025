"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Trophy,
  Users,
  MapPin,
  Phone,
  Mail,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Clock,
  ChevronDown,
  Menu,
  X,
  AlertTriangle,
} from "lucide-react";
import {
  InstagramIcon,
  YoutubeIcon,
  FacebookIcon,
} from "@/components/icons/social-icons";
import { motion, AnimatePresence } from "framer-motion";
import { TeamSection } from "@/components/recovery/TeamSection";
import { Activity } from "lucide-react";
import { Site } from "@/types/site.types";

export interface RecoveryServiceData {
  id?: string;
  name?: string;
  description?: string;
  imageUrl?: string;
  [key: string]: unknown;
}

export default function RecoveryZoneClient({
  site,
  hallImages = [],
  recoveryServices = [],
}: {
  site: Site;
  hallImages?: string[];
  recoveryServices?: RecoveryServiceData[];
}) {
  const [activeImage, setActiveImage] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const nextImage = () => {
    setActiveImage((prev) => (prev + 1) % hallImages.length);
  };

  const prevImage = () => {
    setActiveImage(
      (prev) => (prev - 1 + hallImages.length) % hallImages.length
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans overflow-x-hidden selection:bg-emerald-500 selection:text-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-black/80 backdrop-blur-xl border-b border-emerald-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 relative overflow-hidden rounded-lg bg-white/5 p-1 border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.5)]">
              <Image
                src="/1.png"
                alt="Logo"
                width={24}
                height={24}
                className="object-contain"
              />
            </div>
            <span className="font-medium text-sm text-white">
              RECOVERY ZONE
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest text-zinc-400">
            <a
              href="#about"
              className="hover:text-emerald-400 transition-colors"
            >
              За центъра
            </a>
            <a
              href="#pricing"
              className="hover:text-emerald-400 transition-colors"
            >
              Процедури
            </a>
            <Link
              href="/recovery-zone/catalog"
              className="hover:text-emerald-400 transition-colors"
            >
              Услуги
            </Link>
            <a
              href="#working-hours"
              className="hover:text-emerald-400 transition-colors"
            >
              Работно време
            </a>
            <a
              href="#contacts"
              className="hover:text-emerald-400 transition-colors"
            >
              Контакти
            </a>
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
              className="md:hidden overflow-hidden bg-black/95 backdrop-blur-xl border-t border-emerald-900/30 mt-4 -mx-6 px-6"
            >
              <div className="flex flex-col gap-6 py-6 text-sm font-bold uppercase tracking-widest text-zinc-300">
                <a
                  href="#about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-emerald-400"
                >
                  За центъра
                </a>
                <a
                  href="#pricing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-emerald-400"
                >
                  Процедури
                </a>
                <Link
                  href="/recovery-zone/catalog"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-emerald-400"
                >
                  Услуги
                </Link>
                <a
                  href="#working-hours"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-emerald-400"
                >
                  Работно време
                </a>
                <a
                  href="#contacts"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-emerald-400"
                >
                  Контакти
                </a>
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-zinc-500 hover:text-white pt-4 border-t border-emerald-900/30"
                >
                  Обратно към Портала
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        <div className="absolute inset-0">
          <Image
            src="/1.png"
            alt="Recovery Zone"
            fill
            sizes="100vw"
            className="object-cover opacity-40"
            priority
          />
          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-linear-to-b from-black/60 via-zinc-950/80 to-zinc-950" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 max-w-6xl mx-auto px-6 text-center mt-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-black/80 border border-emerald-500/50 rounded-full text-emerald-400 text-xs font-medium uppercase tracking-widest mb-8 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <Trophy size={14} className="animate-pulse" />
            Професионално Възстановяване
          </div>
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter max-w-4xl mx-auto leading-[1.05] mb-6 uppercase">
            Възстанови
            <br />
            своите{" "}
            <span className="text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.6)]">
              Сили
            </span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto mb-12 leading-relaxed whitespace-pre-wrap">
            {site.description ||
              "Recovery Zone by ZM — модерен център за лимфен дренаж и спортно възстановяване с оборудване Hyperice Normatec. Погрижете се за тялото си и ускорете възстановяването."}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              href="/recovery-zone/catalog"
              className="group flex items-center justify-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(16,185,129,0.6)] hover:shadow-[0_0_30px_rgba(16,185,129,0.9)] hover:-translate-y-1"
            >
              Разгледай Каталога{" "}
              <ChevronRight
                size={18}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
            <a
              href="#working-hours"
              className="flex items-center justify-center gap-2 px-8 py-4 bg-black/80 hover:bg-black text-white border border-zinc-800 hover:border-emerald-500 rounded-xl text-sm font-bold uppercase tracking-widest transition-all hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              Работно време
            </a>
          </div>
        </motion.div>
      </section>

      {/* About & Mission */}
      <section id="about" className="py-24 px-6 bg-zinc-950 relative">
        {/* Glow effect */}
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 -translate-x-1/2" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-emerald-400 mb-4 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]">
            За Центъра
          </p>
          <h2 className="text-3xl md:text-5xl font-light tracking-tight mb-8">
            Новото ниво на{" "}
            <span className="font-bold text-white">възстановяване</span> в
            Гълъбово
          </h2>
          <p className="text-zinc-400 text-lg leading-relaxed mb-6">
            Recovery Zone by ZM е създаден с една основна цел - да предостави
            достъп до професионални възстановителни процедури. Независимо дали
            сте активен спортист, или търсите релакс след тежък работен ден, ние
            сме тук за вас.
          </p>
          <p className="text-zinc-300 text-md leading-relaxed">
            Оборудван със системите на Hyperice Normatec 3, Recovery Zone by ZM
            предлага високотехнологичен лимфен дренаж за крака, ръце и ханш.
          </p>
        </div>
      </section>

      {/* Dynamic Team Section */}
      <TeamSection
        therapists={site.therapists || []}
        teamIntro={site.teamIntro || ""}
      />

      {/* Contraindications */}
      {site.contraindications && site.contraindications.length > 0 && (
        <section className="py-24 px-6 bg-black relative border-y border-zinc-900">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                <AlertTriangle size={24} />
              </div>
              <h2 className="text-3xl md:text-4xl font-light">
                Противопоказания
              </h2>
            </div>
            <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-8 md:p-12">
              <p className="text-zinc-400 mb-8 leading-relaxed">
                За вашата безопасност, моля консултирайте се с лекар преди да
                използвате системите за възстановяване, ако имате някое от
                следните състояния:
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {site.contraindications.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-1 shrink-0 h-2 w-2 rounded-full bg-red-500" />
                    <span className="text-zinc-300 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* FAQs */}
      {site.faqs && site.faqs.length > 0 && (
        <section className="py-24 px-6 bg-zinc-950 relative">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-emerald-400 mb-4 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]">
                Информация
              </p>
              <h2 className="text-3xl md:text-5xl font-light">
                Често задавани въпроси
              </h2>
            </div>
            <div className="space-y-4">
              {site.faqs.map((faq, i) => (
                <div
                  key={i}
                  className="bg-black border border-zinc-900 rounded-2xl overflow-hidden transition-colors hover:border-emerald-900/50"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left"
                  >
                    <span className="font-medium text-white pr-4">{faq.q}</span>
                    <ChevronDown
                      className={`shrink-0 text-emerald-500 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                      size={20}
                    />
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-5 pt-1 text-zinc-400 text-sm leading-relaxed border-t border-zinc-900/50 mt-1 whitespace-pre-wrap">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-24 px-6 relative bg-zinc-950">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center text-center">
            <h2 className="text-3xl md:text-5xl font-light mb-12">Процедури</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recoveryServices && recoveryServices.length > 0 ? (
              recoveryServices.map((service, i) => (
                <motion.div
                  key={service.id || service.name || i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="group bg-black/80 border border-zinc-800 rounded-3xl p-8 hover:border-emerald-500 hover:bg-black transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_0_25px_rgba(16,185,129,0.15)] relative overflow-hidden glassmorphism"
                >
                  <div className="absolute inset-0 bg-linear-to-br from-emerald-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {service.imageUrl ? (
                    <div className="h-14 w-14 rounded-2xl overflow-hidden mb-6 relative z-10 shadow-[0_0_10px_rgba(16,185,129,0.2)] group-hover:shadow-[0_0_20px_rgba(16,185,129,0.8)] transition-all duration-500 border border-emerald-500/30">
                      <Image
                        src={service.imageUrl}
                        alt={service.name || "Процедура"}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-14 w-14 bg-black border border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-400 mb-6 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.2)] group-hover:shadow-[0_0_20px_rgba(16,185,129,0.8)] relative z-10">
                      <Activity size={24} />
                    </div>
                  )}

                  <h3 className="text-xl font-bold text-white mb-4 relative z-10">
                    {service.name}
                  </h3>
                  <p className="text-zinc-400 text-sm leading-relaxed relative z-10">
                    {service.description || "Няма описание за тази процедура."}
                  </p>
                </motion.div>
              ))
            ) : (
              <p className="text-zinc-400 text-center col-span-3">
                Няма добавени процедури в момента.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Services Call to Action */}
      <section className="py-32 px-6 bg-linear-to-b from-blue-950/20 to-zinc-950 relative overflow-hidden my-12 border-y border-emerald-900/40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_70%)]" />
        <div className="max-w-4xl mx-auto text-center relative z-10 bg-black/60 p-12 md:p-16 rounded-4xl border border-emerald-500/20 backdrop-blur-xl shadow-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-emerald-400 mb-4 bg-emerald-500/10 inline-block px-3 py-1 rounded-full">
            Каталог
          </p>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 text-white uppercase">
            Нашите Услуги
          </h2>
          <p className="text-zinc-300 text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
            Разгледайте пълния списък с предлагани възстановителни процедури,
            сесии за лимфен дренаж и абонаментни карти.
          </p>
          <Link
            href="/recovery-zone/catalog"
            className="inline-flex items-center gap-3 px-10 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(5,150,105,0.4)] hover:shadow-[0_0_30px_rgba(5,150,105,0.6)] hover:-translate-y-1 group"
          >
            Разгледай нашите услуги
            <ArrowRight
              size={20}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
        </div>
      </section>

      {/* Working Hours */}
      <section id="working-hours" className="py-24 px-6 bg-zinc-950 relative">
        <div className="absolute right-0 top-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col items-center justify-center text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-light tracking-tight">
              Работно време
            </h2>
          </div>

          <div className="max-w-3xl mx-auto bg-black/80 border border-zinc-800 rounded-3xl p-8 md:p-12 glassmorphism">
            {site.schedule ? (
              <div className="space-y-6">
                {[
                  { label: "Понеделник", data: site.schedule.monday },
                  { label: "Вторник", data: site.schedule.tuesday },
                  { label: "Сряда", data: site.schedule.wednesday },
                  { label: "Четвъртък", data: site.schedule.thursday },
                  { label: "Петък", data: site.schedule.friday },
                  { label: "Събота", data: site.schedule.saturday },
                  { label: "Неделя", data: site.schedule.sunday },
                ].map((day) => (
                  <div
                    key={day.label}
                    className="flex justify-between items-center py-4 border-b border-zinc-800/50 last:border-0"
                  >
                    <span className="text-zinc-300 font-medium text-lg">
                      {day.label}
                    </span>
                    <span className="text-zinc-400">
                      {day.data?.isOpen ? (
                        `${day.data.open} - ${day.data.close}`
                      ) : (
                        <span className="text-emerald-500 font-medium tracking-widest text-sm uppercase">
                          Почивен ден
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 flex flex-col items-center">
                <Clock size={48} className="text-zinc-800 mb-4" />
                <p className="text-zinc-300 text-lg">
                  Не е въведено работно време.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Facilities Carousel */}
      <section className="py-24 px-6 bg-black/60 border-y border-zinc-900">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-emerald-400 mb-4 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]">
              База
            </p>
            <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-6">
              Къде се намираме?
            </h2>
            <p className="text-zinc-400 text-lg leading-relaxed mb-8">
              <strong className="text-white">
                {site.name || "Recovery Zone by ZM"}
              </strong>{" "}
              предлага:
            </p>
            <ul className="space-y-4 mb-8">
              {(site.benefits && site.benefits.length > 0
                ? site.benefits
                : [
                    "Бързо възстановяване",
                    "Подобрена циркулация",
                    "Превенция на контузии",
                    "Повече енергия",
                  ]
              ).map((item, i) => {
                const textValue =
                  typeof item === "string"
                    ? item
                    : (item as { title?: string }).title || "";
                return (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-1 shrink-0 h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/50">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                    </div>
                    <span className="text-zinc-300 font-medium">
                      {textValue}
                    </span>
                  </li>
                );
              })}
            </ul>

            {site.inventory && (
              <div className="border-t border-zinc-800/80 pt-8 grid grid-cols-2 gap-4 mb-8">
                {(site.inventory.compressors ?? 0) > 0 && (
                  <div className="bg-black/50 p-4 rounded-xl border border-zinc-800/80">
                    <p className="text-2xl font-bold text-emerald-400 mb-1">
                      {site.inventory.compressors}
                    </p>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-widest">
                      Компресора
                    </p>
                  </div>
                )}
                {(site.inventory.attachments?.legs ?? 0) > 0 && (
                  <div className="bg-black/50 p-4 rounded-xl border border-zinc-800/80">
                    <p className="text-2xl font-bold text-emerald-400 mb-1">
                      {site.inventory.attachments?.legs}
                    </p>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-widest">
                      Приставки за крака
                    </p>
                  </div>
                )}
                {(site.inventory.attachments?.arms ?? 0) > 0 && (
                  <div className="bg-black/50 p-4 rounded-xl border border-zinc-800/80">
                    <p className="text-2xl font-bold text-emerald-400 mb-1">
                      {site.inventory.attachments?.arms}
                    </p>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-widest">
                      Приставки за ръце
                    </p>
                  </div>
                )}
                {(site.inventory.attachments?.hips ?? 0) > 0 && (
                  <div className="bg-black/50 p-4 rounded-xl border border-zinc-800/80">
                    <p className="text-2xl font-bold text-emerald-400 mb-1">
                      {site.inventory.attachments?.hips}
                    </p>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-widest">
                      Приставки за таз
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Carousel */}
          <div className="relative aspect-video bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl group">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                <Image
                  src={hallImages[activeImage]}
                  alt="Recovery Zone Center"
                  fill
                  className="object-contain bg-zinc-950"
                />
              </motion.div>
            </AnimatePresence>

            {/* Controls */}
            <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button
                onClick={prevImage}
                aria-label="Предишна снимка"
                className="h-10 w-10 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-emerald-400 hover:text-white border border-emerald-500/50 hover:bg-emerald-500 transition-all shadow-[0_0_15px_rgba(16,185,129,0.5)]"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={nextImage}
                aria-label="Следваща снимка"
                className="h-10 w-10 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-emerald-400 hover:text-white border border-emerald-500/50 hover:bg-emerald-500 transition-all shadow-[0_0_15px_rgba(16,185,129,0.5)]"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Indicators */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-10">
              {hallImages.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Отиди на снимка ${i + 1}`}
                  onClick={() => setActiveImage(i)}
                  className="p-3 touch-manipulation flex items-center justify-center group"
                >
                  <div
                    className={`h-2 transition-all duration-300 rounded-full group-hover:bg-white/60 ${i === activeImage ? "w-8 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]" : "w-2 bg-white/30"}`}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contacts & Social */}
      <section id="contacts" className="py-24 px-6 bg-zinc-950">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col gap-16">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-emerald-400 mb-4">
                Свържете се с нас
              </p>
              <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-8">
                Контакти и Локация
              </h2>

              <div className="space-y-6 mb-12">
                <div className="bg-black/80 border border-zinc-800 p-6 rounded-2xl flex items-start gap-4 hover:border-emerald-500/50 transition-colors">
                  <div className="h-10 w-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-white font-medium mb-1">
                      Локация на центъра
                    </p>
                    <p className="text-zinc-400 text-sm">
                      {site.address || "Гр. Гълъбово, Recovery Zone"}
                    </p>
                  </div>
                </div>

                <div className="bg-black/80 border border-zinc-800 p-6 rounded-2xl flex items-start gap-4 hover:border-emerald-500/50 transition-colors">
                  <div className="h-10 w-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 shrink-0">
                    <Phone size={20} />
                  </div>
                  <div>
                    <p className="text-white font-medium mb-1">
                      Телефон за връзка
                    </p>
                    <p className="text-zinc-400 text-sm">
                      Резервации и информация
                    </p>
                    <a
                      href={`tel:${site.phone || "+359899388338"}`}
                      className="text-emerald-400 font-bold mt-1 inline-block hover:underline"
                    >
                      {site.phone || "+359 899 38 83 38"}
                    </a>
                  </div>
                </div>

                <div className="bg-black/80 border border-zinc-800 p-6 rounded-2xl flex items-start gap-4 hover:border-emerald-500/50 transition-colors">
                  <div className="h-10 w-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 shrink-0">
                    <Mail size={20} />
                  </div>
                  <div>
                    <p className="text-white font-medium mb-1">Имейл</p>
                    <a
                      href={`mailto:${site.email || "recoveryzonebyzm@gmail.com"}`}
                      className="text-zinc-400 text-sm hover:text-emerald-400 transition-colors"
                    >
                      {site.email || "recoveryzonebyzm@gmail.com"}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-black/80 border border-zinc-800 rounded-3xl p-10 flex flex-col justify-center relative overflow-hidden glassmorphism">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />
              <h3 className="text-2xl font-light text-white mb-8 relative z-10">
                Последвайте ни в мрежите
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                {site.facebook && (
                  <a
                    href={site.facebook}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-emerald-500 hover:bg-black transition-all group shadow-none hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  >
                    <div className="text-zinc-300 group-hover:text-emerald-500 transition-colors">
                      <FacebookIcon size={24} />
                    </div>
                    <span className="font-medium text-zinc-300 group-hover:text-white transition-colors">
                      Facebook Страница
                    </span>
                  </a>
                )}

                {site.facebookGroup && (
                  <a
                    href={site.facebookGroup}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-emerald-500 hover:bg-black transition-all group shadow-none hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  >
                    <div className="text-zinc-300 group-hover:text-emerald-400 transition-colors">
                      <Users size={24} />
                    </div>
                    <span className="font-medium text-zinc-300 group-hover:text-white transition-colors">
                      Facebook Група
                    </span>
                  </a>
                )}

                {site.instagram && (
                  <a
                    href={site.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-pink-500 hover:bg-black transition-all group shadow-none hover:shadow-[0_0_15px_rgba(236,72,153,0.3)]"
                  >
                    <div className="text-zinc-300 group-hover:text-pink-500 transition-colors">
                      <InstagramIcon size={24} />
                    </div>
                    <span className="font-medium text-zinc-300 group-hover:text-white transition-colors">
                      Instagram
                    </span>
                  </a>
                )}

                {site.youtube && (
                  <a
                    href={site.youtube}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-red-500 hover:bg-black transition-all group shadow-none hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                  >
                    <div className="text-zinc-300 group-hover:text-red-500 transition-colors">
                      <YoutubeIcon size={24} />
                    </div>
                    <span className="font-medium text-zinc-300 group-hover:text-white transition-colors">
                      YouTube
                    </span>
                  </a>
                )}

                {!site.facebook && !site.instagram && !site.youtube && (
                  <p className="text-zinc-500 text-sm col-span-2 text-center py-4">
                    Очаквайте скоро нашите социални мрежи.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-8 border-t border-zinc-900 bg-black flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 bg-emerald-500 rounded-xl flex items-center justify-center">
            <Trophy size={14} className="text-white" />
          </div>
          <span className="text-sm font-bold text-zinc-400 uppercase">
            RECOVERY ZONE BY ZM
          </span>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
          © {new Date().getFullYear()} Всички права запазени
        </span>
      </footer>
    </div>
  );
}
