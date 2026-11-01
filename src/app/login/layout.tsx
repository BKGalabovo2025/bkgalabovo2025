import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Вход в системата | Бадминтон клуб Гълъбово",
  description:
    "Вход в административната система и треньорския портал на Бадминтон клуб Гълъбово и Recovery Zone.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
