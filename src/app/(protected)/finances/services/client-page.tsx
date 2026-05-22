"use client";

import { useState } from "react";
import { Service } from "./service.types";
import { columns } from "./columns";
import { PageHeader } from "@/components/layout/page-header";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { PlusCircle, LayoutGrid, List } from "lucide-react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/shared/data-table";
import { ServiceMenu } from "@/components/finances/ServiceMenu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ServicesClientPageProps {
  data: Service[];
  showPageHeader?: boolean;
}

export default function ServicesClientPage({
  data,
  showPageHeader = true,
}: ServicesClientPageProps) {
  const router = useRouter();
  const [view, setView] = useState<"grid" | "table">("grid");

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-24">
      {!showPageHeader ? (
        <div className="flex justify-between items-center px-2 flex-wrap gap-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-900">
              Каталог Тренировки
            </h3>
            <p className="text-[11px] text-zinc-400">
              Каталог на предлаганите абонаменти, еднократни и индивидуални
              тренировки.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Tabs
              value={view}
              onValueChange={(v) => setView(v as "grid" | "table")}
              className="bg-zinc-50 p-1 rounded-xl border border-zinc-100 hidden md:flex"
            >
              <TabsList className="bg-transparent h-9 border-none">
                <TabsTrigger
                  value="grid"
                  className="rounded-lg px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <LayoutGrid className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger
                  value="table"
                  className="rounded-lg px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <List className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Button
              onClick={() => router.push("/finances/services/new")}
              className="rounded-xl shadow-none bg-zinc-950 text-white hover:bg-zinc-800 h-10 px-6 font-medium text-[10px] uppercase tracking-widest transition-all"
            >
              <PlusCircle className="mr-2 h-3.5 w-3.5" strokeWidth={1.5} />{" "}
              Добави услуга
            </Button>
          </div>
        </div>
      ) : (
        <PageHeader
          title="Каталог Тренировки"
          description="Каталог на предлаганите абонаменти, еднократни и индивидуални тренировки."
          breadcrumbs={[
            { label: "Начало", href: "/dashboard" },
            { label: "Каталози", href: "/finances" },
            { label: "Услуги" },
          ]}
        >
          <div className="flex items-center gap-4">
            <Tabs
              value={view}
              onValueChange={(v) => setView(v as "grid" | "table")}
              className="bg-zinc-50 p-1 rounded-xl border border-zinc-100 hidden md:flex"
            >
              <TabsList className="bg-transparent h-9 border-none">
                <TabsTrigger
                  value="grid"
                  className="rounded-lg px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <LayoutGrid className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger
                  value="table"
                  className="rounded-lg px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <List className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Button
              onClick={() => router.push("/finances/services/new")}
              className="rounded-2xl shadow-xl shadow-zinc-200 bg-zinc-950 text-white hover:bg-zinc-800 h-12 px-8 font-medium text-[11px] uppercase tracking-widest transition-all"
            >
              <PlusCircle className="mr-3 h-4 w-4" strokeWidth={1.5} /> Добави
              услуга
            </Button>
          </div>
        </PageHeader>
      )}

      {view === "grid" ? (
        <ServiceMenu services={data} />
      ) : (
        <BentoCard className="p-8 overflow-hidden border border-zinc-100 bg-white shadow-none rounded-5xl">
          <DataTable
            columns={columns}
            data={data}
            filterColumnId="name"
            filterPlaceholder="Търсене по име на услуга..."
            isLoading={false}
            emptyStateMessage="Няма намерени услуги."
          />
        </BentoCard>
      )}
    </div>
  );
}
