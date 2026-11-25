import { redirect } from "next/navigation";

export default async function LegacyGeneralServiceSaleEditRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/sales/${id}/edit`);
}
