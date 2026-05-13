import Link from "next/link";
import { BentoCard } from "@/components/ui/bento-card";
import { PageHeader } from "@/components/layout/page-header";
import { ListTree, CreditCard, History, ArrowUpRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default function FinancesPage() {
  const financeLinks = [
    {
      title: "Каталог Тренировки",
      description:
        "Каталог на предлаганите абонаменти, еднократни и индивидуални тренировки.",
      href: "/finances/services",
      icon: ListTree,
      color: "blue",
      badge: "Menu",
    },
    {
      title: "Активни Абонаменти",
      description:
        "Управление на активните абонаменти на членовете и проследяване на вноски.",
      href: "/subscriptions",
      icon: CreditCard,
      color: "emerald",
      badge: "Active",
    },
    {
      title: "История и Продажби",
      description:
        "Преглед на всички транзакции, плащания и издадени финансови документи.",
      href: "/sales",
      icon: History,
      color: "orange",
      badge: "History",
    },
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-24">
      <PageHeader
        title="Каталози"
        description="Централизирана система за управление на каталозите от услуги, абонаменти и ценоразписи."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Каталози" },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {financeLinks.map((item) => (
          <Link key={item.href} href={item.href} className="group">
            <BentoCard className="p-10 h-full flex flex-col justify-between transition-all duration-500 group-hover:bg-zinc-950 group-hover:text-white border-zinc-100 bg-white shadow-none rounded-6xl group-hover:-translate-y-2 group-hover:shadow-2xl group-hover:shadow-zinc-200">
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-12">
                  <div className="p-4 rounded-3xl bg-zinc-50 border border-zinc-100 text-zinc-900 transition-all duration-500 group-hover:bg-white/10 group-hover:text-white group-hover:border-white/20">
                    <item.icon className="h-7 w-7" strokeWidth={1.2} />
                  </div>
                  <div className="text-[10px] font-medium uppercase tracking-[0.2em] px-4 py-1.5 rounded-full bg-zinc-50 text-zinc-400 border border-zinc-100 group-hover:bg-white/5 group-hover:text-zinc-400 group-hover:border-white/10">
                    {item.badge}
                  </div>
                </div>
                <h3 className="text-3xl font-light mb-4 tracking-tight group-hover:text-white transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-zinc-500 font-light leading-relaxed group-hover:text-zinc-400 transition-colors">
                  {item.description}
                </p>
              </div>

              <div className="mt-12 flex items-center text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 group-hover:text-zinc-300 transition-all">
                Към модула{" "}
                <ArrowUpRight className="ml-2 h-4 w-4 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 transition-all duration-500" />
              </div>
            </BentoCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
