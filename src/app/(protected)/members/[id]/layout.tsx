import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Досие на член | Бадминтон клуб Гълъбово",
  description:
    "Пълен профил, лични данни, документи, такси и тренировъчна статистика за член на Бадминтон клуб Гълъбово.",
};

export default function MemberIdRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
