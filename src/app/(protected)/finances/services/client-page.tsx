"use client";

import { DataTable } from "@/components/shared/data-table";
import { Service } from "./service.types";
import { columns } from "./columns";

interface ServicesClientPageProps {
  data: Service[];
}

export default function ServicesClientPage({ data }: ServicesClientPageProps) {
  return (
    <div className="container mx-auto py-10">
      <DataTable
        columns={columns}
        data={data}
        filterColumnId="name" // ЗАДЪЛЖИТЕЛНО: Указваме по коя колона да се филтрира
        filterPlaceholder="Търсене по име на услуга..." // ЗАДЪЛЖИТЕЛНО: Текст за полето за търсене
        isLoading={false} // ЗАДЪЛЖИТЕЛНО: Данните се зареждат от сървъра, така че тук не зареждаме
        emptyStateMessage="Няма намерени услуги." // ЗАДЪЛЖИТЕЛНО: Съобщение при празен списък
      />
    </div>
  );
}
