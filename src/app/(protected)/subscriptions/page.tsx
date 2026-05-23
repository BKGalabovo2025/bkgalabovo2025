import { redirect } from "next/navigation";

export default function SubscriptionsRedirectPage() {
  redirect("/finances?tab=subscriptions");
}
