import { redirect } from "next/navigation";

import { getAuthUserFromSessionCookie } from "@/lib/auth-utils";
import { getAdminDb } from "@/lib/firebase-admin";
import { SignedDeclaration } from "@/types";

import PrintDeclarationClient from "./PrintDeclarationClient";

export const dynamic = "force-dynamic";

export default async function PrintDeclarationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getAuthUserFromSessionCookie();
  if (!user) {
    redirect("/login");
  }

  const resolvedParams = await params;
  let initialDeclaration: SignedDeclaration | null = null;

  try {
    const adminDb = getAdminDb();
    const docSnap = await adminDb
      .collection("member_declarations")
      .doc(resolvedParams.id)
      .get();

    if (docSnap.exists) {
      const data = docSnap.data();
      initialDeclaration = {
        id: docSnap.id,
        ...data,
        signedAt:
          typeof data?.signedAt === "string"
            ? data.signedAt
            : data?.signedAt?.toDate?.()?.toISOString() ||
              new Date().toISOString(),
      } as SignedDeclaration;
    }
  } catch (err) {
    console.error(
      "PrintDeclarationPage: Error loading declaration from Admin DB:",
      err
    );
  }

  return (
    <PrintDeclarationClient
      declarationId={resolvedParams.id}
      initialDeclaration={initialDeclaration}
    />
  );
}
