import type { Metadata } from "next";
import React from "react";

import { FeedbackProvider } from "@/components/feedback/FeedbackContext";
import { FeedbackLayoutClient } from "@/components/feedback/FeedbackLayoutClient";

export const metadata: Metadata = {
  title: "Отзиви и Анкети | БК Гълъбово",
  description:
    "Управление на отзиви, анкети за обратна връзка от родители и състезатели, шаблони и модерация.",
};

export default function FeedbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FeedbackProvider>
      <FeedbackLayoutClient>{children}</FeedbackLayoutClient>
    </FeedbackProvider>
  );
}
