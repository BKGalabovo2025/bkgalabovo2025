import type { Metadata } from "next";
import React from "react";

import { SettingsLayoutClient } from "@/components/settings/SettingsLayoutClient";

export const metadata: Metadata = {
  title: "Настройки | БК Гълъбово",
  description:
    "Управление на системните параметри, сигурността и брандирането на клуба.",
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SettingsLayoutClient>{children}</SettingsLayoutClient>;
}
