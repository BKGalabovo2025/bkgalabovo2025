import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ site?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  if (params?.site === "recoveryzone") {
    redirect("/schedule/recovery");
  }
  redirect("/schedule/courts");
}
