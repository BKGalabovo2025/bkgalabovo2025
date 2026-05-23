import { redirect } from "next/navigation";

export default function SalesRedirectPage() {
  redirect("/finances?tab=sales");
}
