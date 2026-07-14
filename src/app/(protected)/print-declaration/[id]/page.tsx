import { getAuthUserFromSessionCookie } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import PrintDeclarationClient from "./PrintDeclarationClient";


export const dynamic = "force-dynamic";

export default async function PrintDeclarationPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUserFromSessionCookie();
  if (!user) {
    redirect("/login");
  }

  const resolvedParams = await params;
  return <PrintDeclarationClient declarationId={resolvedParams.id} />;
}
