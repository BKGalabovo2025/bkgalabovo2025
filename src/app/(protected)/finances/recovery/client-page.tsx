"use client";

import { useState } from "react";
import { ClubService } from "@/types";
import { PageHeader } from "@/components/layout/page-header";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { PlusCircle, LayoutGrid, List } from "lucide-react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/shared/data-table";
import { RecoveryMenu } from "@/components/finances/RecoveryMenu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ColumnDef } from "@tanstack/react-table";
import { formatPrice } from "@/lib/currency";

interface RecoveryClientPageProps {
  data: ClubService[];
  showPageHeader?: boolean;
}

export default function RecoveryClientPage({
  data,
  showPageHeader = true,
}: RecoveryClientPageProps) {
  const router = useRouter();
  const [view, setView] = useState<"grid" | "table">("grid");

  const columns: ColumnDef<ClubService>[] = [
    {
      accessorKey: "name",
      header: "Име",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold">{row.original.name}</span>
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider">
            {row.original.category}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "durationMinutes",
      header: "Продължителност",
      cell: ({ row }) => <span>{row.original.durationMinutes} мин</span>,
    },
    {
      accessorKey: "price",
      header: "Цена",
      cell: ({ row }) => <span>{formatPrice(row.original.price)}</span>,
    },
    {
      accessorKey: "zones",
      header: "Зони",
      cell: ({ row }) => (
        <div className="flex gap-1 flex-wrap">
          {row.original.zones?.map((zone) => (
            <span
              key={zone}
              className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-[10px] font-medium"
            >
              {zone}
            </span>
          ))}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/finances/recovery/${row.original.id}`)}
        >
          Редактиране
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-24">
      {!showPageHeader ? (
        <div className="flex justify-between items-center px-2 flex-wrap gap-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-900">
              Каталог Възстановяване
            </h3>
            <p className="text-[11px] text-zinc-400">
              Управление на процедури, пакети и сесии в Recovery Zone.
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
              onClick={() => router.push("/finances/recovery/new")}
              className="rounded-xl shadow-none bg-zinc-950 text-white hover:bg-zinc-800 h-10 px-6 font-medium text-[10px] uppercase tracking-widest transition-all"
            >
              <PlusCircle className="mr-2 h-3.5 w-3.5" strokeWidth={1.5} />{" "}
              Добави процедура
            </Button>
          </div>
        </div>
      ) : (
        <PageHeader
          title="Каталог Възстановяване"
          description="Управление на процедури, пакети и сесии в Recovery Zone."
          breadcrumbs={[
            { label: "Начало", href: "/dashboard" },
            { label: "Каталози", href: "/catalogs" },
            { label: "Възстановяване" },
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
              onClick={() => router.push("/finances/recovery/new")}
              className="rounded-2xl shadow-xl shadow-zinc-200 bg-zinc-950 text-white hover:bg-zinc-800 h-12 px-8 font-medium text-[11px] uppercase tracking-widest transition-all"
            >
              <PlusCircle className="mr-3 h-4 w-4" strokeWidth={1.5} /> Добави
              процедура
            </Button>
          </div>
        </PageHeader>
      )}

      {view === "grid" ? (
        <RecoveryMenu services={data} />
      ) : (
        <BentoCard className="p-8 overflow-hidden border border-zinc-100 bg-white shadow-none rounded-5xl">
          <DataTable
            columns={columns}
            data={data}
            filterColumnId="name"
            filterPlaceholder="Търсене по име..."
            isLoading={false}
            emptyStateMessage="Няма намерени процедури."
          />
        </BentoCard>
      )}
    </div>
  );
}
