"use client";

import { useState, useEffect, useRef } from "react";
import Script from "next/script";
import Link from "next/link";
import Image from "next/image";
import {
  Trophy,
  Target,
  Users,
  MapPin,
  Phone,
  Mail,
  ChevronRight,
  ChevronLeft,
  CalendarDays,
  ArrowRight,
} from "lucide-react";
import {
  InstagramIcon,
  YoutubeIcon,
  FacebookIcon,
} from "@/components/icons/social-icons";
import { motion, AnimatePresence } from "framer-motion";

const activities = [
  {
    icon: Trophy,
    title: "Участие в състезания",
    desc: "Клубът участва със своите състезатели и членове във всички състезания от Държавния спортен календар (ДСК) на БФ Бадминтон.",
  },
  {
    icon: Target,
    title: "Организиране на турнири",
    desc: "Турнири от Национална верига „Млади таланти“, турнири за всички възрасти – от деца до ветерани, любители и вътрешни клубни турнири.",
  },
  {
    icon: Users,
    title: "Социална и спортна дейност",
    desc: "Провеждане на демонстрации, активни партньорства с училищата и детски градини в Гълъбово, организиране на летни спортни лагери за членовете.",
  },
];

export default function ClubClient({
  schedule,
  hallImages = [],
}: {
  schedule: {
    id: string;
    title: string;
    startTime: string | Date;
    endTime: string | Date;
  }[];
  hallImages?: string[];
}) {
  const [activeImage, setActiveImage] = useState(0);
  const [isWidgetVisible, setIsWidgetVisible] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsWidgetVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "300px" }
    );

    if (widgetRef.current) {
      observer.observe(widgetRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const nextImage = () => {
    setActiveImage((prev) => (prev + 1) % hallImages.length);
  };

  const prevImage = () => {
    setActiveImage(
      (prev) => (prev - 1 + hallImages.length) % hallImages.length
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans overflow-x-hidden selection:bg-blue-400 selection:text-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-black/80 backdrop-blur-xl border-b border-blue-400/30">
        <div className="flex items-center gap-2">
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
        </div>
        <Link
          href="/"
          className="text-xs font-medium uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
        >
          Портал
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        <div className="absolute inset-0">
          <Image
            src="/bk-hero.png"
            alt="БК Гълъбово"
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
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-black/80 border border-blue-400/50 rounded-full text-blue-400 text-xs font-medium uppercase tracking-widest mb-8 shadow-[0_0_15px_rgba(30,58,138,0.3)]">
            <Trophy size={14} className="animate-pulse" />
            Основан 2014 г.
          </div>
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter max-w-4xl mx-auto leading-[1.05] mb-6 uppercase">
            Страстта
            <br />
            към{" "}
            <span className="text-blue-400 drop-shadow-[0_0_12px_rgba(59,130,246,0.6)]">
              Бадминтона
            </span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto mb-12 leading-relaxed">
            СНЦ „Бадминтон клуб Гълъбово“ — официален бадминтон клуб в град
            Гълъбово. Тренировки, турнири и приятелска спортна атмосфера за
            всички.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <a
              href="#contacts"
              className="group flex items-center justify-center gap-2 px-8 py-4 bg-blue-400 hover:bg-blue-600 text-white rounded-xl text-sm font-bold uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(30,58,138,0.6)] hover:shadow-[0_0_30px_rgba(30,58,138,0.9)] hover:-translate-y-1"
            >
              Стани Член{" "}
              <ChevronRight
                size={18}
                className="group-hover:translate-x-1 transition-transform"
              />
            </a>
            <a
              href="#schedule"
              className="flex items-center justify-center gap-2 px-8 py-4 bg-black/80 hover:bg-black text-white border border-zinc-800 hover:border-blue-400 rounded-xl text-sm font-bold uppercase tracking-widest transition-all hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(30,58,138,0.3)]"
            >
              График и Тренировки
            </a>
          </div>
        </motion.div>
      </section>

      {/* About & Mission */}
      <section id="about" className="py-24 px-6 bg-zinc-950 relative">
        {/* Glow effect */}
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-blue-400/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 -translate-x-1/2" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-blue-400 mb-4 drop-shadow-[0_0_8px_rgba(30,58,138,0.8)]">
            За Клуба & Мисия
          </p>
          <h2 className="text-3xl md:text-5xl font-light tracking-tight mb-8">
            Развитие и популяризиране на{" "}
            <span className="font-bold text-white">бадминтона</span> в Гълъбово
          </h2>
          <p className="text-zinc-400 text-lg leading-relaxed mb-6">
            СНЦ „Бадминтон клуб Гълъбово“ е сдружение с нестопанска цел,
            създадено през 2014 г. Нашата основна цел е да създадем
            професионална и същевременно приятелска среда за развитие на този
            динамичен спорт.
          </p>
          <p className="text-zinc-300 text-md leading-relaxed">
            Клубът организира регулярни тренировки за всички възрастови групи –
            деца, юноши, възрастни и ветерани. Гордеем се с нашата общност,
            която не спира да расте и да постига спортни върхове.
          </p>
        </div>
      </section>

      {/* Activities Section */}
      <section className="py-24 px-6 bg-black/40 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-blue-400 mb-4">
              Официален Статус
            </p>
            <h2 className="text-4xl md:text-5xl font-light tracking-tight">
              Нашите Дейности
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {activities.map((act, i) => (
              <motion.div
                key={act.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group bg-black/80 border border-zinc-800 rounded-3xl p-8 hover:border-blue-400 hover:bg-black transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_0_25px_rgba(30,58,138,0.15)] relative overflow-hidden glassmorphism"
              >
                <div className="absolute inset-0 bg-linear-to-br from-blue-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="h-14 w-14 bg-black border border-blue-400/30 rounded-2xl flex items-center justify-center text-blue-400 mb-6 group-hover:bg-blue-400 group-hover:text-white transition-all duration-500 shadow-[0_0_10px_rgba(30,58,138,0.2)] group-hover:shadow-[0_0_20px_rgba(30,58,138,0.8)] relative z-10">
                  <act.icon size={24} />
                </div>
                <h3 className="text-xl font-bold text-white mb-4 relative z-10">
                  {act.title}
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed relative z-10">
                  {act.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Call to Action */}
      <section className="py-32 px-6 bg-linear-to-b from-blue-950/20 to-zinc-950 relative overflow-hidden my-12 border-y border-blue-900/40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_70%)]" />
        <div className="max-w-4xl mx-auto text-center relative z-10 bg-black/60 p-12 md:p-16 rounded-4xl border border-blue-400/20 backdrop-blur-xl shadow-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-blue-400 mb-4 bg-blue-400/10 inline-block px-3 py-1 rounded-full">
            Каталог
          </p>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 text-white uppercase">
            Нашите Услуги и Тренировки
          </h2>
          <p className="text-zinc-300 text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
            Разгледайте пълния списък с предлагани групови и индивидуални
            тренировки, наеми на кортове, абонаментни карти и спортна
            екипировка.
          </p>
          <Link
            href="/club/catalog"
            className="inline-flex items-center gap-3 px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] hover:-translate-y-1 group"
          >
            Разгледай нашите услуги
            <ArrowRight
              size={20}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
        </div>
      </section>

      {/* Schedule 7 days */}
      <section id="schedule" className="py-24 px-6 bg-zinc-950 relative">
        <div className="absolute right-0 top-1/2 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-blue-400 mb-4">
                График
              </p>
              <h2 className="text-4xl md:text-5xl font-light tracking-tight">
                Предстоящи Тренировки
              </h2>
              <p className="text-zinc-300 mt-2">През следващите 7 дни</p>
            </div>
            <Link
              href="/club/schedule"
              className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-blue-400 hover:text-blue-400 transition-colors hover:drop-shadow-[0_0_8px_rgba(30,58,138,0.8)]"
            >
              Пълен Календар <ArrowRight size={16} />
            </Link>
          </div>

          <div className="bg-black/80 border border-zinc-800 rounded-3xl p-8 md:p-12 glassmorphism">
            {schedule.length > 0 ? (
              <div className="space-y-4">
                {/* Dynamically list schedule */}
                {schedule.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 pb-4"
                  >
                    <div className="mb-2 sm:mb-0">
                      <p className="text-white font-medium">{slot.title}</p>
                      <p className="text-sm text-zinc-300">
                        {new Date(slot.startTime).toLocaleDateString("bg-BG")}
                        &nbsp;|&nbsp;
                        {new Date(slot.startTime).toLocaleTimeString("bg-BG", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        до{" "}
                        {new Date(slot.endTime).toLocaleTimeString("bg-BG", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <Link
                      href="#contacts"
                      className="text-blue-400 text-sm hover:underline"
                    >
                      Запиши се
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 flex flex-col items-center">
                <CalendarDays size={48} className="text-zinc-800 mb-4" />
                <p className="text-zinc-300 text-lg">
                  Няма въведени тренировки за следващите 7 дни.
                </p>
                <p className="text-zinc-600 text-sm mt-2">
                  Очаквайте обновяване на седмичната програма.
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
            <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-blue-400 mb-4 drop-shadow-[0_0_8px_rgba(30,58,138,0.8)]">
              База
            </p>
            <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-6">
              Къде тренираме
            </h2>
            <p className="text-zinc-400 text-lg leading-relaxed mb-8">
              Разполагаме със съвременна и напълно оборудвана спортна база.{" "}
              <strong className="text-white">Спортна зала „Енергетик“</strong>{" "}
              предлага:
            </p>
            <ul className="space-y-4 mb-12">
              {[
                "6 изцяло оборудвани корта за бадминтон",
                "Трибуни за състезатели и зрители",
                "Модерна конферентна зала",
                "Просторни съблекални",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-1 shrink-0 h-5 w-5 rounded-full bg-blue-400/20 flex items-center justify-center border border-blue-400/50">
                    <div className="h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(30,58,138,0.8)]" />
                  </div>
                  <span className="text-zinc-300 font-medium">{item}</span>
                </li>
              ))}
            </ul>
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
                  alt="Спортна зала Енергетик"
                  fill
                  className="object-cover"
                />
              </motion.div>
            </AnimatePresence>

            {/* Controls */}
            <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button
                onClick={prevImage}
                aria-label="Предишна снимка"
                className="h-10 w-10 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-blue-400 hover:text-white border border-blue-400/50 hover:bg-blue-400 transition-all shadow-[0_0_15px_rgba(30,58,138,0.5)]"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={nextImage}
                aria-label="Следваща снимка"
                className="h-10 w-10 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-blue-400 hover:text-white border border-blue-400/50 hover:bg-blue-400 transition-all shadow-[0_0_15px_rgba(30,58,138,0.5)]"
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
                    className={`h-2 transition-all duration-300 rounded-full group-hover:bg-white/60 ${i === activeImage ? "w-8 bg-blue-400 shadow-[0_0_8px_rgba(30,58,138,0.9)]" : "w-2 bg-white/30"}`} 
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
              <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-blue-400 mb-4">
                Свържете се с нас
              </p>
              <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-8">
                Контакти и Локация
              </h2>

              <div className="space-y-6 mb-12">
                <div className="bg-black/80 border border-zinc-800 p-6 rounded-2xl flex items-start gap-4 hover:border-blue-400/50 transition-colors">
                  <div className="h-10 w-10 bg-blue-400/10 rounded-xl flex items-center justify-center text-blue-400 shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-white font-medium mb-1">
                      Спортна база / Място на тренировките
                    </p>
                    <p className="text-zinc-400 text-sm">
                      Спортна зала „Енергетик“, ул. „Александър Стамболийски“ 41
                    </p>
                  </div>
                </div>

                <div className="bg-black/80 border border-zinc-800 p-6 rounded-2xl flex items-start gap-4 hover:border-blue-400/50 transition-colors">
                  <div className="h-10 w-10 bg-blue-400/10 rounded-xl flex items-center justify-center text-blue-400 shrink-0">
                    <Phone size={20} />
                  </div>
                  <div>
                    <p className="text-white font-medium mb-1">
                      Телефон за връзка
                    </p>
                    <p className="text-zinc-400 text-sm">
                      Мира Георгиева – треньор
                    </p>
                    <a
                      href="tel:+359899829923"
                      className="text-blue-400 font-bold mt-1 inline-block hover:underline"
                    >
                      +359 899 82 99 23
                    </a>
                  </div>
                </div>

                <div className="bg-black/80 border border-zinc-800 p-6 rounded-2xl flex items-start gap-4 hover:border-blue-400/50 transition-colors">
                  <div className="h-10 w-10 bg-blue-400/10 rounded-xl flex items-center justify-center text-blue-400 shrink-0">
                    <Mail size={20} />
                  </div>
                  <div>
                    <p className="text-white font-medium mb-1">Имейл</p>
                    <a
                      href="mailto:bk_galabovo@abv.bg"
                      className="text-zinc-400 text-sm hover:text-blue-400 transition-colors"
                    >
                      bk_galabovo@abv.bg
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-black/80 border border-zinc-800 rounded-3xl p-10 flex flex-col justify-center relative overflow-hidden glassmorphism">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/5 rounded-full blur-[80px] pointer-events-none" />
              <h3 className="text-2xl font-light text-white mb-8 relative z-10">
                Последвайте ни в мрежите
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                <a
                  href="https://www.facebook.com/badmintongalabovo/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-blue-500 hover:bg-black transition-all group shadow-none hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                >
                  <div className="text-zinc-300 group-hover:text-blue-500 transition-colors">
                    <FacebookIcon size={24} />
                  </div>
                  <span className="font-medium text-zinc-300 group-hover:text-white transition-colors">
                    Facebook Страница
                  </span>
                </a>
                <a
                  href="https://www.facebook.com/groups/645571089477573/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-blue-400 hover:bg-black transition-all group shadow-none hover:shadow-[0_0_15px_rgba(96,165,250,0.3)]"
                >
                  <div className="text-zinc-300 group-hover:text-blue-400 transition-colors">
                    <Users size={24} />
                  </div>
                  <span className="font-medium text-zinc-300 group-hover:text-white transition-colors">
                    Facebook Група
                  </span>
                </a>
                <a
                  href="https://www.instagram.com/badminton.galabovo/"
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
                <a
                  href="https://www.youtube.com/@BKGalabovo"
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
              </div>

              {/* Instagram Feed Widget (Lazy Loaded) */}
              <div ref={widgetRef} className="mt-8 overflow-hidden rounded-2xl relative w-full min-h-[400px]">
                {isWidgetVisible && (
                  <>
                    <Script
                      src="https://elfsightcdn.com/platform.js"
                      strategy="lazyOnload"
                    />
                    <div
                      className="elfsight-app-38429d6c-a19f-4a06-97e0-33126f15eb84"
                      data-elfsight-app-lazy
                    ></div>
                    <div
                      className="elfsight-app-026b377a-abc3-4a27-9a45-85779cc6e70e"
                      data-elfsight-app-lazy
                    ></div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-8 border-t border-zinc-900 bg-black flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 bg-blue-400 rounded-xl flex items-center justify-center">
            <Trophy size={14} className="text-white" />
          </div>
          <span className="text-sm font-bold text-zinc-400 uppercase">
            СНЦ „Бадминтон Клуб Гълъбово“
          </span>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
          © {new Date().getFullYear()} Всички права запазени
        </span>
      </footer>
    </div>
  );
}
