import { Metadata } from "next";

import RecoveryReviewsClient from "./RecoveryReviewsClient";

export const metadata: Metadata = {
  title: "Отзиви от клиенти | Recovery Zone by ZM",
  description:
    "Реални отзиви и оценки от спортисти и клиенти за възстановителните процедури с Hyperice Normatec 3 в Recovery Zone by ZM.",
};

export default function RecoveryReviewsPage() {
  return <RecoveryReviewsClient />;
}
