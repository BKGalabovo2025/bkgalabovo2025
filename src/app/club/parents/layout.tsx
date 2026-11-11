import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Родителски портал | Бадминтон клуб Гълъбово",
  description:
    "Вход и управление на профила на детето, присъствия и тренировъчен график в Бадминтон Клуб Гълъбово.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ParentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
