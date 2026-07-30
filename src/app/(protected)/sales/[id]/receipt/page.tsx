import { getReceiptDetailsServerAction } from "@/lib/actions/sales";
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
    <div className="space-y-8 pb-12 duration-500 animate-in fade-in">
      <PageHeader
        title="Касова бележка"
        description={`Преглед на детайли за продажба #${saleId.substring(0, 8).toUpperCase()}`}
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Продажби", href: "/sales" },
          { label: "Разписка" },
        ]}
      />

      <div className="w-full">
        <ReceiptClientPage saleId={saleId} initialDetails={result.data} />
      </div>
    </div>
  );
}
