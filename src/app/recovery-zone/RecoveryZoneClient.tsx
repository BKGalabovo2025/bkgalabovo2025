"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Mail,
  MapPin,
  Menu,
  Phone,
  Sparkles,
  Star,
  Trophy,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  FacebookIcon,
  InstagramIcon,
  YoutubeIcon,
} from "@/components/icons/social-icons";
import { TeamSection } from "@/components/recovery/TeamSection";
import { GoogleTranslateWidget } from "@/components/shared/GoogleTranslateWidget";
import { feedbackService } from "@/services/feedback-service";
import { FeedbackSubmission } from "@/types/feedback.types";
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
}: {
  site: Site;
  hallImages?: string[];
}) {
  const [activeImage, setActiveImage] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isHeroExpanded, setIsHeroExpanded] = useState(false);
  const [lang, setLang] = useState("bg");
  const [reviews, setReviews] = useState<FeedbackSubmission[]>([]);
  const [standingSurveyId, setStandingSurveyId] = useState<string | null>(null);

  const nextImage = () => {
    setActiveImage((prev) => (prev + 1) % hallImages.length);
  };

  const prevImage = () => {
    setActiveImage(
      (prev) => (prev - 1 + hallImages.length) % hallImages.length
    );
  };

  useEffect(() => {
    if (typeof document !== "undefined") {
      const match = document.cookie.match(/googtrans=\/bg\/([a-z]{2})/);
      if (match && match[1] === "en") setLang("en");
    }
  }, []);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const [revs, campaigns] = await Promise.all([
          feedbackService.getPublicReviews("recoveryzone"),
          feedbackService.getActiveStandingCampaigns("recoveryzone"),
        ]);
        setReviews(revs);
        if (campaigns.length > 0) {
          setStandingSurveyId(campaigns[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch recovery zone reviews:", err);
      }
    };
    fetchFeedback();
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-zinc-950 font-sans text-white selection:bg-emerald-500 selection:text-white">
      {/* Nav */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-emerald-500/30 bg-black/80 px-6 py-4 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative size-8 overflow-hidden rounded-lg border border-emerald-500/50 bg-white/5 p-1 shadow-[0_0_10px_rgba(16,185,129,0.5)]">
              <Image
                src="/1.png"
                alt="Logo"
                width={24}
                height={24}
                className="object-contain"
              />
            </div>
            <span className="text-sm font-medium text-white">
              RECOVERY ZONE
            </span>
          </div>

          <div className="hidden items-center gap-8 text-[11px] font-bold tracking-widest text-zinc-400 uppercase md:flex">
            <a
              href="#about"
              className="transition-colors hover:text-emerald-400"
            >
              За Зоната
            </a>
            <a
              href="#attachments"
              className="transition-colors hover:text-emerald-400"
            >
              Приставки
            </a>
            <Link
              href="/recovery-zone/catalog"
              className="transition-colors hover:text-emerald-400"
            >
              Услуги
            </Link>
            <a
              href="#working-hours"
              className="transition-colors hover:text-emerald-400"
            >
              Работно време
            </a>
            <a
              href="#info"
              className="transition-colors hover:text-emerald-400"
            >
              Информация
            </a>
            <a
              href="#team"
              className="transition-colors hover:text-emerald-400"
            >
              Екип
            </a>
            <a
              href="#reviews"
              className="transition-colors hover:text-emerald-400"
            >
              Отзиви
            </a>
            <a
              href="#contacts"
              className="transition-colors hover:text-emerald-400"
            >
              Контакти
            </a>
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
              className="-mx-6 mt-4 overflow-hidden border-t border-emerald-900/30 bg-black/95 px-6 backdrop-blur-xl md:hidden"
            >
              <div className="flex flex-col gap-6 py-6 text-sm font-bold tracking-widest text-zinc-300 uppercase">
                <a
                  href="#about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-emerald-400"
                >
                  За Зоната
                </a>
                <a
                  href="#attachments"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-emerald-400"
                >
                  Приставки
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
                  href="#info"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-emerald-400"
                >
                  Информация
                </a>
                <a
                  href="#team"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-emerald-400"
                >
                  Екип
                </a>
                <a
                  href="#reviews"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-emerald-400"
                >
                  Отзиви
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
                  className="border-t border-emerald-900/30 pt-4 text-zinc-500 hover:text-white"
                >
                  Обратно към Портала
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section
        id="about"
        className="relative flex min-h-screen items-center justify-center pt-16"
      >
        <div className="absolute inset-0">
          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-linear-to-b from-black/60 via-zinc-950/80 to-zinc-950" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 mx-auto mt-20 max-w-6xl px-6 text-center"
        >
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-500/50 bg-black/80 px-4 py-2 text-xs font-medium tracking-widest text-emerald-400 uppercase shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <Trophy size={14} className="animate-pulse" />
            Професионално Възстановяване
          </div>
          <h1 className="leading-1.05 mx-auto mb-6 max-w-4xl text-5xl font-black tracking-tighter uppercase md:text-8xl">
            Възстанови
            <br />
            своите{" "}
            <span className="text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.6)]">
              Сили
            </span>
          </h1>
          <div className="mx-auto mb-12 max-w-3xl text-left text-lg leading-relaxed text-zinc-400 md:text-center">
            <h3 className="mb-4 text-2xl font-medium text-white">
              Новото ниво на възстановяване в Гълъбово
            </h3>
            <p className="mb-4">
              Recovery Zone by ZM е създаден с една основна цел - да предостави
              достъп до професионални възстановителни процедури. Независимо дали
              сте активен спортист, или търсите релакс след тежък работен ден,
              ние сме тук за вас.
            </p>
            <AnimatePresence>
              {isHeroExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <p className="mb-4">
                    Оборудван със системите на Hyperice Normatec 3, Recovery
                    Zone by ZM предлага високотехнологичен лимфен дренаж за
                    крака, ръце и ханш.
                  </p>
                  <p className="mb-4">
                    В ZM RECOVERY ZONE използваме лидера в динамичната въздушна
                    компресия – системата Normatec 3 от Hyperice. Тя използва
                    патентованата технология Pulse, която чрез ритмично
                    притискане имитира естествената работа на мускулите. Това
                    ускорява движението на течностите и помага на тялото да се
                    изчисти от токсините значително по-бързо от обикновения
                    престой. Основни ползи:
                  </p>
                  <ul className="mx-auto mb-4 inline-block max-w-2xl list-disc space-y-2 pl-6 text-left">
                    <li>
                      <strong className="text-white">
                        Ускорен лимфен дренаж:
                      </strong>{" "}
                      Подпомага естествения процес на тялото за изхвърляне на
                      метаболитни отпадъци и токсини.
                    </li>
                    <li>
                      <strong className="text-white">
                        Подобрена циркулация:
                      </strong>{" "}
                      Стимулира кръвния поток, което доставя повече кислород и
                      хранителни вещества до мускулите.
                    </li>
                    <li>
                      <strong className="text-white">
                        Превенция на контузии:
                      </strong>{" "}
                      Поддържа еластичността на меките тъкани и намалява
                      сковаността.
                    </li>
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
            <button
              onClick={() => setIsHeroExpanded(!isHeroExpanded)}
              className="mx-auto mt-4 flex items-center gap-2 text-sm font-bold tracking-widest text-emerald-400 uppercase transition-colors hover:text-white"
            >
              {isHeroExpanded ? "Скрий информацията" : "Прочети повече"}
              <ChevronDown
                className={`transition-transform duration-300 ${isHeroExpanded ? "rotate-180" : ""}`}
                size={16}
              />
            </button>
          </div>
          <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
            <Link
              href="/recovery-zone/catalog"
              className="group flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-8 py-4 text-sm font-bold tracking-widest text-white uppercase shadow-[0_0_20px_rgba(16,185,129,0.6)] transition-all hover:-translate-y-1 hover:bg-emerald-600 hover:shadow-[0_0_30px_rgba(16,185,129,0.9)]"
            >
              Разгледай Каталога{" "}
              <ChevronRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
            <a
              href="#working-hours"
              className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-black/80 px-8 py-4 text-sm font-bold tracking-widest text-white uppercase transition-all hover:-translate-y-1 hover:border-emerald-500 hover:bg-black hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              Работно време
            </a>
          </div>
        </motion.div>
      </section>

      {/* Attachments Section */}
      <section
        id="attachments"
        className="relative border-t border-zinc-900/50 bg-black px-6 py-24"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-6 text-3xl font-light tracking-tight md:text-5xl">
              {lang === "en" ? (
                <span className="notranslate">
                  Our recovery attachments and their application
                </span>
              ) : (
                "Нашите приставки и тяхното приложение"
              )}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Legs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="group overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 transition-colors hover:border-emerald-500/50"
            >
              <div className="relative flex h-64 w-full items-center justify-center overflow-hidden bg-zinc-900/50 p-6">
                <div className="relative size-full transform transition-transform duration-500 group-hover:scale-105">
                  <Image
                    src="/zones/legs.webp"
                    alt="Приставки за крака"
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-contain"
                    priority={true}
                  />
                </div>
              </div>
              <div className="p-8">
                <h3 className="mb-4 text-xl font-bold tracking-wider text-emerald-400 uppercase">
                  КРАКА
                </h3>
                <p className="text-sm leading-relaxed text-zinc-400">
                  Обхващат целите крака от стъпалата и глезените до горната част
                  на бедрата. Изключително ефективни при „тежки крака“ след
                  продължително стоене, ходене или интензивно натоварване.
                </p>
              </div>
            </motion.div>

            {/* Pelvis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="group overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 transition-colors hover:border-emerald-500/50"
            >
              <div className="relative flex h-64 w-full items-center justify-center overflow-hidden bg-zinc-900/50 p-6">
                <div className="relative size-full transform transition-transform duration-500 group-hover:scale-105">
                  <Image
                    src="/zones/pelvis.webp"
                    alt="Приставка за таз"
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-contain"
                    priority={true}
                  />
                </div>
              </div>
              <div className="p-8">
                <h3 className="mb-4 text-xl font-bold tracking-wider text-emerald-400 uppercase">
                  {lang === "en" ? (
                    <span className="notranslate">PELVIS</span>
                  ) : (
                    "ТАЗ"
                  )}
                </h3>
                <p className="text-sm leading-relaxed text-zinc-400">
                  Обхваща долната част на гърба, таза, хълбоците и седалищните
                  мускули. Идеална за облекчаване на напрежението в кръста от
                  дълги часове седене и за подобряване на гъвкавостта.
                </p>
              </div>
            </motion.div>

            {/* Arms */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="group overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 transition-colors hover:border-emerald-500/50"
            >
              <div className="relative flex h-64 w-full items-center justify-center overflow-hidden bg-zinc-900/50 p-6">
                <div className="relative size-full transform transition-transform duration-500 group-hover:scale-105">
                  <Image
                    src="/zones/arm.png"
                    alt="Приставки за ръце"
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-contain"
                    priority={true}
                  />
                </div>
              </div>
              <div className="p-8">
                <h3 className="mb-4 text-xl font-bold tracking-wider text-emerald-400 uppercase">
                  {lang === "en" ? (
                    <span className="notranslate">ARMS</span>
                  ) : (
                    "РЪЦЕ"
                  )}
                </h3>
                <p className="text-sm leading-relaxed text-zinc-400">
                  {lang === "en" ? (
                    <span className="notranslate">
                      Covers the areas from the wrists to the shoulders.
                      Extremely useful for badminton players, tennis players,
                      swimmers, and fitness enthusiasts whose arms are subjected
                      to constant stress, as well as for people working in front
                      of a computer.
                    </span>
                  ) : (
                    "Обхващат зоните от китките до раменете. Изключително полезни за бадминтонисти, тенисисти, плувци и фитнес трениращи, при които ръцете са подложени на постоянен стрес, както и за хора, работещи пред компютър."
                  )}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Information Section */}
      {((site.contraindications && site.contraindications.length > 0) ||
        (site.faqs && site.faqs.length > 0)) && (
        <section
          id="info"
          className="relative border-y border-zinc-900 bg-zinc-950 px-6 py-24"
        >
          <div className="mx-auto max-w-4xl">
            <div className="mb-16 flex flex-col items-center justify-center text-center">
              <h2 className="text-4xl font-light tracking-tight md:text-5xl">
                Информация
              </h2>
            </div>

            <div className="space-y-16">
              {/* Contraindications */}
              {site.contraindications && site.contraindications.length > 0 && (
                <div>
                  <div className="mb-8 flex items-center gap-4">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                      <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-2xl font-light md:text-3xl">
                      Противопоказания
                    </h3>
                  </div>
                  <div className="rounded-3xl border border-zinc-900 bg-black p-8 md:p-12">
                    <p className="mb-8 leading-relaxed text-zinc-400">
                      За вашата безопасност, моля консултирайте се с лекар преди
                      да използвате системите за възстановяване, ако имате някое
                      от следните състояния:
                    </p>
                    <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {site.contraindications.map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="mt-1 size-2 shrink-0 rounded-full bg-red-500" />
                          <span className="text-sm text-zinc-300">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* FAQs */}
              {site.faqs && site.faqs.length > 0 && (
                <div>
                  <div className="mb-8">
                    <h3 className="text-2xl font-light md:text-3xl">
                      Често задавани въпроси
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {site.faqs.map((faq, i) => (
                      <div
                        key={i}
                        className="overflow-hidden rounded-2xl border border-zinc-900 bg-black transition-colors hover:border-emerald-900/50"
                      >
                        <button
                          onClick={() => setOpenFaq(openFaq === i ? null : i)}
                          className="flex w-full items-center justify-between px-6 py-5 text-left"
                        >
                          <span className="pr-4 font-medium text-white">
                            {faq.q}
                          </span>
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
                              <div className="mt-1 border-t border-zinc-900/50 px-6 pt-1 pb-5 text-sm leading-relaxed whitespace-pre-wrap text-zinc-400">
                                {faq.a}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Facilities Carousel */}
      <section className="border-y border-zinc-900 bg-black/60 px-6 py-24">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="mb-4 text-[11px] font-bold tracking-[0.4em] text-emerald-400 uppercase drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]">
              Нашите предимства
            </p>
            <h2 className="mb-8 text-4xl font-light tracking-tight md:text-5xl">
              Recovery Zone by ZM предлага:
            </h2>
            <ul className="mb-8 space-y-6">
              {[
                {
                  title: "Световен лидер в технологиите за възстановяване",
                  desc: "Зоната ни е оборудвана със системата Normatec 3 от Hyperice – признат лидер в динамичната въздушна компресия с патентована технология Pulse.",
                },
                {
                  title: "Безупречна и максимална хигиена",
                  desc: "За всяка сесия в нашата зона осигуряваме индивидуални еднократни хигиенни подложки за крака, ръце и таз. Това предотвратява директния контакт с маншетите и гарантира 100% защита и безопасност за всеки посетител.",
                },
                {
                  title: "Пълно покритие на зоните за възстановяване",
                  desc: "Разполагаме с пълен комплект специализирани приставки (за крака, таз и ръце), което позволява цялостно възстановяване – от стъпалата, през ядрото на тялото (долна част на гърба и хълбоци), до раменете.",
                },
                {
                  title: "Персонализиран контрол и комфорт",
                  desc: "Системата в зоната ни предлага приятен масаж, при който интензивността на въздушната компресия е напълно контролируема според Вашите нужди.",
                },
                {
                  title: "Гъвкавост и бързина на процедурите",
                  desc: "Зоната предлага възможност както за кратки 15-минутни сесии тип „Загрявка“ за незабавна мускулна активация преди тренировка, така и за следтренировъчни сесии за ускорено изчистване на токсините.",
                },
                {
                  title: "Среда с фокус върху Вашата безопасност",
                  desc: "Преди всяка сесия предоставяме детайлна информация за безопасност и противопоказания (като ДВТ, сърдечни състояния, бременност и др.), като поставяме Вашето здраве на първо място.",
                },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-4">
                  <div className="mt-1.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-emerald-500/50 bg-emerald-500/20">
                    <div className="size-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  </div>
                  <div>
                    <span className="mb-1 block font-bold text-white">
                      {item.title}:
                    </span>
                    <span className="text-sm leading-relaxed text-zinc-400">
                      {item.desc}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Carousel */}
          <div className="group relative aspect-video overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl">
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
                  sizes="(max-width: 1200px) 100vw, 1200px"
                  className="bg-zinc-950 object-contain"
                />
              </motion.div>
            </AnimatePresence>

            {/* Controls */}
            <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <button
                onClick={prevImage}
                aria-label="Предишна снимка"
                className="flex size-10 items-center justify-center rounded-full border border-emerald-500/50 bg-black/60 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)] backdrop-blur-md transition-all hover:bg-emerald-500 hover:text-white"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={nextImage}
                aria-label="Следваща снимка"
                className="flex size-10 items-center justify-center rounded-full border border-emerald-500/50 bg-black/60 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)] backdrop-blur-md transition-all hover:bg-emerald-500 hover:text-white"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Indicators */}
            <div className="absolute inset-x-0 bottom-2 z-10 flex justify-center gap-1">
              {hallImages.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Отиди на снимка ${i + 1}`}
                  onClick={() => setActiveImage(i)}
                  className="group flex touch-manipulation items-center justify-center p-3"
                >
                  <div
                    className={`h-2 rounded-full transition-all duration-300 group-hover:bg-white/60 ${i === activeImage ? "w-8 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]" : "w-2 bg-white/30"}`}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Call to Action */}
      <section className="relative my-12 overflow-hidden border-y border-emerald-900/40 bg-linear-to-b from-blue-950/20 to-zinc-950 px-6 py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_70%)]" />
        <div className="relative z-10 mx-auto max-w-4xl rounded-4xl border border-emerald-500/20 bg-black/60 p-12 text-center shadow-2xl backdrop-blur-xl md:p-16">
          <p className="mb-4 inline-block rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-bold tracking-[0.4em] text-emerald-400 uppercase">
            Каталог
          </p>
          <h2 className="mb-6 text-4xl font-black tracking-tighter text-white uppercase md:text-6xl">
            Нашите Услуги
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-zinc-300">
            Разгледайте пълния списък с предлагани възстановителни процедури,
            сесии за лимфен дренаж и абонаментни карти.
          </p>
          <Link
            href="/recovery-zone/catalog"
            className="group inline-flex items-center gap-3 rounded-2xl bg-emerald-600 px-10 py-5 font-bold tracking-widest text-white uppercase shadow-[0_0_20px_rgba(5,150,105,0.4)] transition-all hover:-translate-y-1 hover:bg-emerald-500 hover:shadow-[0_0_30px_rgba(5,150,105,0.6)]"
          >
            Разгледай нашите услуги
            <ArrowRight
              size={20}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>
      </section>

      {/* Working Hours */}
      <section id="working-hours" className="relative bg-zinc-950 px-6 py-24">
        <div className="pointer-events-none absolute top-1/2 right-0 size-[500px] translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="mb-16 flex flex-col items-center justify-center text-center">
            <h2 className="text-4xl font-light tracking-tight md:text-5xl">
              Работно време
            </h2>
          </div>

          <div className="mx-auto max-w-4xl">
            {site.schedule ? (
              <div className="flex flex-col gap-3">
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
                    className="group flex flex-col items-start justify-between rounded-2xl border border-white/5 bg-zinc-900/40 p-5 transition-all duration-300 hover:border-emerald-500/30 hover:bg-zinc-900 sm:flex-row sm:items-center md:p-6"
                  >
                    <div className="mb-3 flex items-center gap-4 sm:mb-0">
                      <div
                        className={`flex size-10 items-center justify-center rounded-xl transition-colors md:size-12 md:rounded-2xl ${
                          day.data?.isOpen
                            ? "bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)] group-hover:bg-emerald-500/20"
                            : "bg-white/5 text-zinc-600"
                        }`}
                      >
                        <Clock size={20} />
                      </div>
                      <span className="text-lg font-bold tracking-wide text-zinc-200 md:text-xl">
                        {day.label}
                      </span>
                    </div>
                    <div className="flex w-full sm:w-auto sm:justify-end">
                      {day.data?.isOpen ? (
                        <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-black/50 px-4 py-2 transition-colors group-hover:border-emerald-500/20">
                          <span className="text-lg font-medium text-emerald-400 md:text-xl">
                            {day.data.open}
                          </span>
                          <span className="px-1 text-zinc-600">-</span>
                          <span className="text-lg font-medium text-emerald-400 md:text-xl">
                            {day.data.close}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-xs font-bold tracking-widest text-zinc-500 uppercase">
                          Почивен ден
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glassmorphism flex flex-col items-center rounded-3xl border border-zinc-800 bg-black/80 p-12 text-center">
                <Clock size={48} className="mb-4 text-zinc-800" />
                <p className="text-lg text-zinc-300">
                  Не е въведено работно време.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Dynamic Team Section */}
      <TeamSection
        therapists={site.therapists || []}
        teamIntro={site.teamIntro || ""}
      />

      {/* Customer Reviews Section */}
      <section
        id="reviews"
        className="relative overflow-hidden bg-black/40 px-6 py-24"
      >
        <div className="pointer-events-none absolute -top-40 right-1/4 size-96 rounded-full bg-emerald-500/10 blur-[120px]" />

        <div className="mx-auto max-w-6xl">
          <div className="mb-14 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-400">
                <Star size={14} className="fill-emerald-400" />
                <span>Доверено от спортисти и активни хора</span>
              </div>
              <h2 className="mt-4 text-3xl font-light tracking-tight text-white sm:text-5xl">
                Отзиви от клиенти
              </h2>
              <p className="mt-3 max-w-xl text-base text-zinc-400">
                Вижте реалните мнения на нашите клиенти след компресионна
                терапия с ботушите и ръкавите Hyperice Normatec 3.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {standingSurveyId && (
                <Link href={`/feedback/${standingSurveyId}`}>
                  <button className="flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-600 px-5 py-3 text-xs font-bold text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all hover:bg-emerald-500 active:scale-95">
                    <Sparkles size={14} />
                    Оставете Вашия отзив
                  </button>
                </Link>
              )}
              <Link href="/recovery-zone/reviews">
                <button className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-3 text-xs font-bold text-zinc-300 transition-all hover:border-emerald-500/40 hover:text-white">
                  <span>Всички отзиви ({reviews.length})</span>
                  <ArrowRight size={14} />
                </button>
              </Link>
            </div>
          </div>

          {reviews.length === 0 ? (
            <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/40 p-12 text-center">
              <Sparkles className="mx-auto size-12 text-zinc-600" />
              <p className="mt-4 text-zinc-400">
                Все още няма публикувани отзиви. Бъдете първите, които споделят
                своето преживяване!
              </p>
              {standingSurveyId && (
                <Link
                  href={`/feedback/${standingSurveyId}`}
                  className="mt-6 inline-block"
                >
                  <button className="rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-500">
                    Дайте първия отзив
                  </button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {reviews.slice(0, 3).map((rev, idx) => {
                const initial =
                  rev.respondentName?.trim()?.charAt(0)?.toUpperCase() || "К";
                const quote =
                  rev.highlightQuote ||
                  rev.reviewText ||
                  "Страхотно възстановяване и професионално отношение!";
                return (
                  <div
                    key={rev.id || idx}
                    className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 p-6 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-emerald-500/50 hover:shadow-[0_0_25px_rgba(16,185,129,0.15)]"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-amber-400">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={14}
                              className={
                                s <= (rev.overallRating || 5)
                                  ? "fill-amber-400 text-amber-400"
                                  : "fill-zinc-800 text-zinc-700"
                              }
                            />
                          ))}
                        </div>
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                          {rev.eventType === "recovery"
                            ? "Normatec 3"
                            : "Отзив"}
                        </span>
                      </div>

                      <p className="mt-4 border-l-2 border-emerald-500/60 pl-3 text-sm leading-relaxed text-zinc-200 italic">
                        &ldquo;{quote}&rdquo;
                      </p>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-zinc-800/80 pt-4 text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-8 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 font-bold text-emerald-400">
                          {initial}
                        </div>
                        <div>
                          <p className="font-semibold text-white">
                            {rev.respondentName}
                          </p>
                          <span className="text-[10px] text-zinc-500">
                            Клиент на Recovery Zone
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] text-zinc-500">
                        {new Date(rev.createdAt).toLocaleDateString("bg-BG", {
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Contacts & Social */}
      <section id="contacts" className="bg-zinc-950 px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col gap-16">
            <div>
              <p className="mb-4 text-[11px] font-bold tracking-[0.4em] text-emerald-400 uppercase">
                Свържете се с нас
              </p>
              <h2 className="mb-8 text-4xl font-light tracking-tight md:text-5xl">
                Контакти и Локация
              </h2>

              <div className="mb-12 space-y-6">
                {/* Location and Mobile Zone */}
                <div className="flex items-start gap-4 rounded-2xl border border-zinc-800 bg-black/80 p-6 transition-colors hover:border-emerald-500/50">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                    <MapPin size={20} />
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-bold tracking-wider text-emerald-400 uppercase">
                        Локация
                      </p>
                      <p className="mt-0.5 text-sm font-medium text-white">
                        {site.address ||
                          "Спортна зала „Енергетик“, гр. Гълъбово"}
                      </p>
                    </div>
                    <div className="border-t border-zinc-800/80 pt-2.5">
                      <p className="text-xs font-bold tracking-wider text-emerald-400 uppercase">
                        Мобилна зона
                      </p>
                      <p className="mt-0.5 text-sm font-medium text-zinc-200">
                        Намери ни на турнирите на НВ Бадминтон, България
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-2xl border border-zinc-800 bg-black/80 p-6 transition-colors hover:border-emerald-500/50">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                    <Phone size={20} />
                  </div>
                  <div>
                    <p className="mb-1 font-medium text-white">
                      Телефон за връзка
                    </p>
                    <p className="text-sm text-zinc-400">
                      Резервации и информация
                    </p>
                    <a
                      href={`tel:${site.phone || "+359899388338"}`}
                      className="mt-1 inline-block font-bold text-emerald-400 hover:underline"
                    >
                      {site.phone || "+359 899 38 83 38"}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-2xl border border-zinc-800 bg-black/80 p-6 transition-colors hover:border-emerald-500/50">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                    <Mail size={20} />
                  </div>
                  <div>
                    <p className="mb-1 font-medium text-white">Имейл</p>
                    <a
                      href={`mailto:${site.email || "recoveryzonebyzm@gmail.com"}`}
                      className="text-sm text-zinc-400 transition-colors hover:text-emerald-400"
                    >
                      {site.email || "recoveryzonebyzm@gmail.com"}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="glassmorphism relative flex flex-col justify-center overflow-hidden rounded-3xl border border-zinc-800 bg-black/80 p-10">
              <div className="pointer-events-none absolute top-0 right-0 size-64 rounded-full bg-emerald-500/5 blur-[80px]" />
              <h3 className="relative z-10 mb-8 text-2xl font-light text-white">
                Последвайте ни в мрежите
              </h3>
              <div className="relative z-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {site.facebook && (
                  <a
                    href={site.facebook}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-none transition-all hover:border-emerald-500 hover:bg-black hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  >
                    <div className="text-zinc-300 transition-colors group-hover:text-emerald-500">
                      <FacebookIcon size={24} />
                    </div>
                    <span className="font-medium text-zinc-300 transition-colors group-hover:text-white">
                      Facebook Страница
                    </span>
                  </a>
                )}

                {site.facebookGroup && (
                  <a
                    href={site.facebookGroup}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-none transition-all hover:border-emerald-500 hover:bg-black hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  >
                    <div className="text-zinc-300 transition-colors group-hover:text-emerald-400">
                      <Users size={24} />
                    </div>
                    <span className="font-medium text-zinc-300 transition-colors group-hover:text-white">
                      Facebook Група
                    </span>
                  </a>
                )}

                {site.instagram && (
                  <a
                    href={site.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-none transition-all hover:border-pink-500 hover:bg-black hover:shadow-[0_0_15px_rgba(236,72,153,0.3)]"
                  >
                    <div className="text-zinc-300 transition-colors group-hover:text-pink-500">
                      <InstagramIcon size={24} />
                    </div>
                    <span className="font-medium text-zinc-300 transition-colors group-hover:text-white">
                      Instagram
                    </span>
                  </a>
                )}

                {site.youtube && (
                  <a
                    href={site.youtube}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-none transition-all hover:border-red-500 hover:bg-black hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                  >
                    <div className="text-zinc-300 transition-colors group-hover:text-red-500">
                      <YoutubeIcon size={24} />
                    </div>
                    <span className="font-medium text-zinc-300 transition-colors group-hover:text-white">
                      YouTube
                    </span>
                  </a>
                )}

                {!site.facebook && !site.instagram && !site.youtube && (
                  <p className="col-span-2 py-4 text-center text-sm text-zinc-500">
                    Очаквайте скоро нашите социални мрежи.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="flex flex-col items-center justify-between gap-4 border-t border-zinc-900 bg-black p-8 md:flex-row">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-xl bg-emerald-500">
            <Trophy size={14} className="text-white" />
          </div>
          <span className="text-sm font-bold text-zinc-400 uppercase">
            RECOVERY ZONE BY ZM
          </span>
        </div>
        <div className="text-center md:text-right">
          <p className="text-[11px] text-zinc-400">
            Спортна зала „Енергетик“, гр. Гълъбово • Мобилна зона: На турнирите
            от НВ Бадминтон
          </p>
          <span className="mt-1 block text-[10px] font-bold tracking-widest text-zinc-600 uppercase">
            © {new Date().getFullYear()} Recovery Zone by ZM. Всички права
            запазени
          </span>
        </div>
      </footer>
    </div>
  );
}
