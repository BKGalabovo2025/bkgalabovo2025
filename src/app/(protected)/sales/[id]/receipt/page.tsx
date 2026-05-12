"use client";

import { useParams } from "next/navigation";
import ReceiptClientPage from "./ReceiptClientPage";
import { PageHeader } from "@/components/layout/page-header";

export default function ReceiptPage() {
  const params = useParams();
  const saleId = params.id as string;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <PageHeader
        title="Касова бележка"
        description={`Преглед на детайли за продажба #${saleId.slice(-6).toUpperCase()}`}
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Продажби", href: "/sales" },
          { label: "Разписка" },
        ]}
      />

      <div className="bg-white dark:bg-zinc-950 rounded-4xl shadow-xl shadow-blue-900/5 border border-slate-100 dark:border-zinc-800 overflow-hidden max-w-2xl mx-auto">
        <div className="p-0">
          <ReceiptClientPage saleId={saleId} />
        </div>
      </div>
    </div>
  );
}
