import { getAuthUserFromSessionCookie } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import DeclarationsClient from "./DeclarationsClient";

export const dynamic = "force-dynamic";

export default async function DeclarationsPage() {
  const user = await getAuthUserFromSessionCookie();
  if (!user) {
    redirect("/auth");
  }

  return <DeclarationsClient />;
}
