import { redirect } from "next/navigation";

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ serviceId: string }>;
}) {
  const { serviceId } = await params;
  redirect(`/catalogs/trainings/${serviceId}/edit`);
}
