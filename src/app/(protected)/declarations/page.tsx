import { redirect } from "next/navigation";

import { getAllDeclarationsAction } from "@/lib/actions/declarations";
import { getAuthUserFromSessionCookie } from "@/lib/auth-utils";

import DeclarationsClient from "./DeclarationsClient";

export const dynamic = "force-dynamic";

export default async function DeclarationsPage() {
  const user = await getAuthUserFromSessionCookie();
  if (!user) {
    redirect("/login");
  }

  const res = await getAllDeclarationsAction();
  const initialDeclarations = res.success && res.data ? res.data : [];

  return <DeclarationsClient initialDeclarations={initialDeclarations} />;
}
