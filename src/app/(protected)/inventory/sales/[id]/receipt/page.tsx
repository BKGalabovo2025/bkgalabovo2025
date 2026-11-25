import { redirect } from "next/navigation";

export default async function LegacyInventorySaleReceiptRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/sales/${id}/receipt`);
}
