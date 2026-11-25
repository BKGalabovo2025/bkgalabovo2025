import { redirect } from "next/navigation";

export default async function LegacyInventorySaleDetailsRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/sales/${id}`);
}
