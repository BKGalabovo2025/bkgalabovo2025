import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  Trophy,
  ArrowLeft,
  Medal,
  Calendar,
  Users,
  MapPin,
  Phone,
  Mail,
  Globe,
  ChevronRight,
  Star,
  Target,
  Shield,
} from "lucide-react";
import {
  InstagramIcon,
  YoutubeIcon,
  FacebookIcon,
} from "@/components/icons/social-icons";
import { getAdminDb } from "@/lib/firebase-admin";
import { getSiteById } from "@/services/site-service";
import PublicCatalogTabs from "@/components/club/PublicCatalogTabs";

export const metadata: Metadata = {
  title: "БК Гълъбово | Бадминтон клуб Гълъбово",
  description:
    "Официален сайт на Бадминтон клуб Гълъбово — турнири, ранглиста, тренировки и членство. Град Гълъбово, обл. Стара Загора.",
};

const features = [
  {
    icon: Trophy,
    title: "Турнири",
    desc: "Участие в официални турнири на национално и регионално ниво.",
  },
  {
    icon: Medal,
    title: "Ранглиста",
    desc: "Актуализирана ранглиста на членовете с точки от всеки турнир.",
  },
  {
    icon: Calendar,
    title: "Тренировки",
    desc: "Редовни тренировки за всички възрасти и нива на игра.",
  },
  {
    icon: Users,
    title: "Общност",
    desc: "Приятна атмосфера и сплотена общност от любители на бадминтона.",
  },
];

const ageGroups = [
  { label: "Деца", sublabel: "до 12 г.", icon: Star },
  { label: "Юноши", sublabel: "12–18 г.", icon: Target },
  { label: "Възрастни", sublabel: "18+ г.", icon: Shield },
  { label: "Ветерани", sublabel: "35+ г.", icon: Trophy },
];

function serializeDoc(data: any) {
  if (!data) return data;
  const copy = { ...data };
  for (const key of Object.keys(copy)) {
    const val = copy[key];
    if (val && typeof val.toDate === "function") {
      copy[key] = val.toDate().toISOString();
    } else if (val && typeof val === "object" && "_seconds" in val) {
      copy[key] = new Date(val._seconds * 1000).toISOString();
    } else if (Array.isArray(val)) {
      copy[key] = val.map(serializeDoc);
    } else if (typeof val === "object") {
      copy[key] = serializeDoc(val);
    }
  }
  return copy;
}

export default async function ClubPage() {
  const adminDb = getAdminDb();

  // Fetch site data for dynamic contact/social info
  const site = await getSiteById("bkgalabovo");

  // 1. Fetch trainings (clubServices) for bkgalabovo
  const servicesSnapshot = await adminDb.collection("clubServices").get();
  const services = servicesSnapshot.docs
    .map((doc) =>
      serializeDoc({
        id: doc.id,
        ...doc.data(),
      })
    )
    .filter((item) => !item.siteId || item.siteId === "bkgalabovo");

  // 2. Fetch general services (clubGeneralServices) for bkgalabovo
  const generalSnapshot = await adminDb.collection("clubGeneralServices").get();
  const generalServices = generalSnapshot.docs
    .map((doc) =>
      serializeDoc({
        id: doc.id,
        ...doc.data(),
      })
    )
    .filter((item) => !item.siteId || item.siteId === "bkgalabovo");

  // 3. Fetch products (products) for bkgalabovo
  const productsSnapshot = await adminDb.collection("products").get();
  const products = productsSnapshot.docs
    .map((doc) =>
      serializeDoc({
        id: doc.id,
        ...doc.data(),
      })
    )
    .filter((item) => !item.siteId || item.siteId === "bkgalabovo");

  // Resolve contact info — prefer DB, fallback to defaults
  const clubName = site?.name || "Бадминтон Клуб Гълъбово";
  const clubEmail = site?.email || "bk_galabovo@abv.bg";
  const clubPhone = site?.phone || "+359 899 82 99 23";
  const clubAddress =
    site?.address ||
    'Спортна зала "Енергетик", ул. Александър Стамболийски 41, 6280 Гълъбово';
  const clubWebsite = site?.website || "https://bkgalabovo.alle.bg/";
  const clubInstagram =
    site?.instagram || "https://www.instagram.com/badminton.galabovo/";
  const clubYoutube = site?.youtube || "https://www.youtube.com/@BKGalabovo";
  const clubFacebook =
    site?.facebook || "https://www.facebook.com/badmintongalabovo/";
  const clubFacebookGroup =
    site?.facebookGroup || "https://www.facebook.com/groups/645571089477573/";

  const socialLinks = [
    {
      href: clubInstagram,
      icon: InstagramIcon,
      label: "Instagram",
      color: "hover:text-pink-400",
    },
    {
      href: clubYoutube,
      icon: YoutubeIcon,
      label: "YouTube",
      color: "hover:text-red-400",
    },
    {
      href: clubFacebook,
      icon: FacebookIcon,
      label: "Facebook",
      color: "hover:text-blue-400",
    },
    {
      href: clubFacebookGroup,
      icon: Users,
      label: "Facebook Група",
      color: "hover:text-blue-300",
    },
  ].filter((s) => s.href);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5">
        <Link
          href="/"
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          Portal
        </Link>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 relative overflow-hidden rounded-lg bg-white/5 p-1">
            <Image
              src="/logo.png"
              alt="Logo"
              width={24}
              height={24}
              className="object-contain"
            />
          </div>
          <span className="font-medium text-sm">БК Гълъбово</span>
        </div>
        <Link
          href="/login"
          className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-all"
        >
          Вход за членове
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center pt-16">
        <div className="absolute inset-0">
          <Image
            src="/bk-hero.png"
            alt="БК Гълъбово"
            fill
            sizes="100vw"
            className="object-cover opacity-20"
            priority
          />
          <div className="absolute inset-0 bg-linear-to-b from-zinc-950/60 via-zinc-950/80 to-zinc-950" />
        </div>
        <div className="absolute inset-0 bg-linear-to-r from-blue-900/10 to-transparent" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-32">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/10 border border-blue-600/20 rounded-full text-blue-400 text-xs font-medium uppercase tracking-widest mb-8">
            <Trophy size={12} />
            СНЦ Бадминтон клуб Гълъбово
          </div>
          <h1 className="text-5xl md:text-7xl font-light tracking-tight max-w-3xl leading-[1.05] mb-6">
            Страстта
            <br />
            към бадминтона
            <br />
            <span className="text-blue-400">от Гълъбово</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mb-12 leading-relaxed">
            Официален бадминтон клуб в град Гълъбово. Тренировки, турнири и
            приятелска атмосфера за всички нива — от начинаещи до напреднали.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/login"
              className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-sm font-medium transition-all active:scale-95"
            >
              Влез в клуба <ChevronRight size={16} />
            </Link>
            <a
              href="#about"
              className="flex items-center gap-2 px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl text-sm font-medium transition-all"
            >
              За нас
            </a>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-32 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-[11px] uppercase tracking-[0.4em] text-blue-400 mb-4">
              За клуба
            </p>
            <h2 className="text-4xl font-light tracking-tight mb-6">
              Организация с<span className="text-zinc-500"> кауза</span>
            </h2>
            <p className="text-zinc-400 leading-relaxed mb-6">
              СНЦ „Бадминтон клуб Гълъбово&ldquo; е сдружение с нестопанска цел,
              посветено на развитието на бадминтона в Гълъбово и региона. Клубът
              организира тренировки, участва в официални турнири и насърчава
              спортния дух сред всички възрасти.
            </p>
            <p className="text-zinc-500 leading-relaxed">
              Ръководен от Мира Георгиева, клубът поддържа активна ранглиста на
              членовете и участва в официалния национален спортен календар.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {ageGroups.map((g) => (
              <div
                key={g.label}
                className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-center group hover:border-blue-600/30 transition-all duration-300"
              >
                <div className="h-12 w-12 bg-blue-600/10 border border-blue-600/20 rounded-2xl flex items-center justify-center text-blue-400 mx-auto mb-4 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-300">
                  <g.icon size={20} strokeWidth={1.5} />
                </div>
                <p className="font-medium text-white">{g.label}</p>
                <p className="text-zinc-500 text-xs mt-1">{g.sublabel}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-32 px-6 bg-zinc-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <p className="text-[11px] uppercase tracking-[0.4em] text-blue-400 mb-4">
              Какво предлагаме
            </p>
            <h2 className="text-4xl font-light tracking-tight">
              Всичко за
              <span className="text-zinc-500"> бадминтона</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 group hover:border-blue-600/30 hover:bg-zinc-900/80 transition-all duration-300"
              >
                <div className="h-12 w-12 bg-blue-600/10 border border-blue-600/20 rounded-2xl flex items-center justify-center text-blue-400 mb-6 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-300">
                  <f.icon size={20} strokeWidth={1.5} />
                </div>
                <h3 className="font-medium text-white mb-3">{f.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Catalogs Section */}
      <section id="catalogs" className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16 text-center md:text-left">
            <p className="text-[11px] uppercase tracking-[0.4em] text-blue-400 mb-4">
              Клубни Каталози
            </p>
            <h2 className="text-4xl font-light tracking-tight">
              Разгледайте нашите
              <span className="text-zinc-500"> услуги и продукти</span>
            </h2>
            <p className="text-zinc-400 text-sm max-w-xl mt-4 leading-relaxed">
              Вижте графиците на тренировките, наличните абонаментни планове,
              клубни услуги и професионална спортна екипировка за продажба.
            </p>
          </div>

          <PublicCatalogTabs
            trainings={services}
            generalServices={generalServices}
            products={products}
          />
        </div>
      </section>

      {/* Members CTA */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-zinc-900 border border-blue-600/20 rounded-6xl p-12 md:p-16 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="relative z-10">
              <p className="text-[11px] uppercase tracking-[0.4em] text-blue-400 mb-6">
                Членство
              </p>
              <h2 className="text-4xl font-light tracking-tight mb-6">
                Стани член на
                <br />
                <span className="text-blue-400">БК Гълъбово</span>
              </h2>
              <p className="text-zinc-400 mb-10 max-w-md mx-auto">
                Включи се в общността. Участвай в тренировки, турнири и следи
                своя напредък в ранглистата.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-sm font-medium transition-all active:scale-95"
              >
                Влез в системата <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-32 px-6 bg-zinc-900/30">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.4em] text-blue-400 mb-4">
            Контакт
          </p>
          <h2 className="text-4xl font-light tracking-tight mb-12">
            Намерете ни
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            {/* Address */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
              <MapPin
                size={20}
                className="text-blue-400 mb-4"
                strokeWidth={1.5}
              />
              <p className="text-white font-medium mb-2">Адрес</p>
              <p className="text-zinc-500 text-sm leading-relaxed">
                {clubAddress}
              </p>
            </div>
            {/* Phone */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
              <Phone
                size={20}
                className="text-blue-400 mb-4"
                strokeWidth={1.5}
              />
              <p className="text-white font-medium mb-2">Телефон</p>
              <a
                href={`tel:${clubPhone.replace(/\s/g, "")}`}
                className="text-zinc-400 hover:text-blue-400 text-sm transition-colors"
              >
                {clubPhone}
              </a>
            </div>
            {/* Email */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
              <Mail
                size={20}
                className="text-blue-400 mb-4"
                strokeWidth={1.5}
              />
              <p className="text-white font-medium mb-2">Имейл</p>
              <a
                href={`mailto:${clubEmail}`}
                className="text-zinc-400 hover:text-blue-400 text-sm transition-colors break-all"
              >
                {clubEmail}
              </a>
            </div>
          </div>

          {/* Website + Social Links */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
            <p className="text-[11px] uppercase tracking-[0.4em] text-blue-400 mb-6">
              Намерете ни онлайн
            </p>
            <div className="flex flex-wrap gap-4 items-center">
              {clubWebsite && (
                <a
                  href={clubWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-2xl text-sm text-zinc-300 hover:text-white transition-all"
                >
                  <Globe size={16} className="text-blue-400" />
                  Уебсайт
                </a>
              )}
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 px-5 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-2xl text-sm text-zinc-300 transition-all ${s.color}`}
                >
                  <s.icon size={16} />
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 bg-blue-600 rounded-xl flex items-center justify-center">
            <Trophy size={14} className="text-white" />
          </div>
          <span className="text-sm font-medium text-zinc-400">
            СНЦ „{clubName}&ldquo;
          </span>
        </div>
        {/* Social icons in footer */}
        <div className="flex items-center gap-3">
          {socialLinks.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              title={s.label}
              className={`h-8 w-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 transition-all ${s.color} hover:border-zinc-600`}
            >
              <s.icon size={14} />
            </a>
          ))}
        </div>
        <span className="text-[10px] uppercase tracking-widest text-zinc-700">
          © {new Date().getFullYear()} БК Гълъбово
        </span>
        <Link
          href="/"
          className="text-sm text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          ← Обратно към портала
        </Link>
      </footer>
    </div>
  );
}
