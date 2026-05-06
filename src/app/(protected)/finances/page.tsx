import Link from "next/link";
import { BentoCard } from "@/components/ui/bento-card";
import { PageHeader } from "@/components/layout/page-header";
import {
  ListTree,
  CreditCard,
  History,
  Wallet,
  ArrowUpRight,
} from "lucide-react";
import { formatPrice } from "@/lib/currency";

export const dynamic = "force-dynamic";

export default function FinancesPage() {
  const financeLinks = [
    {
      title: "Каталог на Услуги",
      description:
        "Управление на всички предлагани услуги, артикули и бар наличности.",
      href: "/finances/services",
      icon: ListTree,
      color: "blue",
      badge: "Services",
    },
    {
      title: "Абонаментни Планове",
      description:
        "Дефиниране и проследяване на членски вноски и пакетни карти.",
      href: "/subscriptions",
      icon: CreditCard,
      color: "emerald",
      badge: "Plans",
    },
    {
      title: "История на Продажби",
      description:
        "Преглед на всички транзакции, плащания и издадени касови бележки.",
      href: "/sales",
      icon: History,
      color: "orange",
      badge: "Transactions",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Финансов Модул"
        description="Централизирано управление на приходите, услугите и абонаментите на клуба."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Финанси" },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {financeLinks.map((item) => (
          <Link key={item.href} href={item.href} className="group">
            <BentoCard className="p-8 h-full flex flex-col justify-between transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1 group-hover:border-primary/20">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div
                    className={`p-3 rounded-2xl bg-${item.color}-100 dark:bg-${item.color}-900/30 text-${item.color}-600 dark:text-${item.color}-200`}
                  >
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div
                    className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md bg-slate-100 text-slate-500`}
                  >
                    {item.badge}
                  </div>
                </div>
                <h3 className="text-xl font-bold font-bento mb-2 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-8 flex items-center text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:gap-2 transition-all">
                Отвори{" "}
                <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all" />
              </div>
            </BentoCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
