import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function ParentAccountsAliasPage() {
  redirect("/parents/accounts");
}
