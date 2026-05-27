import { getReceiptDetailsServerAction } from "@/lib/actions/sales-server";
import ReceiptClientPage from "./ReceiptClientPage";
import { PageHeader } from "@/components/layout/page-header";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReceiptPage({ params }: PageProps) {
  const { id: saleId } = await params;

  const result = await getReceiptDetailsServerAction(saleId);
  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <PageHeader
        title="Касова бележка"
        description={`Преглед на детайли за продажба #${saleId.slice(-6).toUpperCase()}`}
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Тренировки", href: "/catalogs" },
          { label: "Разписка" },
        ]}
      />

      <div className="bg-white dark:bg-zinc-950 rounded-4xl shadow-xl shadow-blue-900/5 border border-slate-100 dark:border-zinc-800 overflow-hidden max-w-2xl mx-auto">
        <div className="p-0">
          <ReceiptClientPage saleId={saleId} initialDetails={result.data} />
        </div>
      </div>
    </div>
  );
}
