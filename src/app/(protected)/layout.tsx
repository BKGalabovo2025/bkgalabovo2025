import { getAuthUserFromSessionCookie } from "@/lib/auth-utils";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ProtectedLayoutClient from "./ProtectedLayoutClient";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Verify the session cookie on the server before rendering protected UI or prefetching
  const user = await getAuthUserFromSessionCookie();

  if (!user) {
    // 2. Clear invalid/expired session cookie
    const cookieStore = await cookies();
    cookieStore.delete("session");

    // 3. Redirect back to login page
    redirect("/login");
  }

  // 4. Session is valid; render standard client-side protected layout structure
  return <ProtectedLayoutClient>{children}</ProtectedLayoutClient>;
}
