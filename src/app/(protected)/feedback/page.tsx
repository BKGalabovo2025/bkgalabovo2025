import { Metadata } from "next";

import FeedbackClient from "./feedback-client";

export const metadata: Metadata = {
  title: "Отзиви и Анкети | Бадминтон клуб Гълъбово",
  description:
    "Управление на отзиви, анкети за обратна връзка от родители и състезатели, шаблони и модерация.",
};

export default function FeedbackPage() {
  return <FeedbackClient />;
}
