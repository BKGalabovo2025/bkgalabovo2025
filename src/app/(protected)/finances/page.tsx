import Link from "next/link";
import { BentoCard } from "@/components/ui/bento-card";
import { PageHeader } from "@/components/layout/page-header";
import { ListTree, CreditCard, History, ArrowUpRight } from "lucide-react";

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
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
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
            <BentoCard className="p-10 h-full flex flex-col justify-between transition-all duration-300 group-hover:bg-zinc-50 dark:group-hover:bg-white/5 group-hover:-translate-y-1 border-zinc-100 bg-white shadow-none rounded-[2.5rem]">
              <div>
                <div className="flex justify-between items-start mb-8">
                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-zinc-900 dark:text-white transition-colors group-hover:bg-primary group-hover:text-white group-hover:border-primary">
                    <item.icon className="h-6 w-6" strokeWidth={1.5} />
                  </div>
                  <div className="text-[10px] font-medium uppercase tracking-[0.2em] px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                    {item.badge}
                  </div>
                </div>
                <h3 className="text-2xl font-light mb-3 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-zinc-500 font-light leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-10 flex items-center text-[11px] font-medium uppercase tracking-widest text-zinc-400 group-hover:text-primary transition-all">
                Отвори{" "}
                <ArrowUpRight className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-all" />
              </div>
            </BentoCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
