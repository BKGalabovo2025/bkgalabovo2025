import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Детайли за турнир | Турнири - БК Гълъбово",
  description:
    "Информация, участници, жребий и резултати от турнир по бадминтон, организиран от Бадминтон клуб Гълъбово.",
};

export default function TournamentIdRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
