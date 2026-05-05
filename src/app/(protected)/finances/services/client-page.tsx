"use client";

import { DataTable } from "@/components/shared/data-table";
import { Service } from "./service.types";
import { columns } from "./columns";
import { PageHeader } from "@/components/layout/page-header";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface ServicesClientPageProps {
  data: Service[];
}

export default function ServicesClientPage({ data }: ServicesClientPageProps) {
  const router = useRouter();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Каталог на Услуги"
        description="Управление на ценоразпис, инвентар и артикули в бара."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Финанси", href: "/finances" },
          { label: "Услуги" },
        ]}
      >
        <Button
          onClick={() => router.push("/finances/services/new")}
          className="rounded-xl shadow-md font-bento"
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Добави услуга
        </Button>
      </PageHeader>

      <BentoCard className="overflow-hidden">
        <DataTable
          columns={columns}
          data={data}
          filterColumnId="name"
          filterPlaceholder="Търсене по име на услуга..."
          isLoading={false}
          emptyStateMessage="Няма намерени услуги."
        />
      </BentoCard>
    </div>
  );
}
