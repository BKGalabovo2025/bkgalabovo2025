import { Metadata } from "next";
import React, { Suspense } from "react";

import { ParentAdminProvider } from "@/components/parents/admin/ParentAdminContext";
import { ParentAdminLayoutClient } from "@/components/parents/admin/ParentAdminLayoutClient";

import ParentsAdminLoading from "./loading";

export const metadata: Metadata = {
  title: "Родителски достъп | БК Гълъбово",
  description:
    "Управление на родителски профили, заявки за достъп, отсъствия, корекции и комуникация.",
};

export default function ParentsAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<ParentsAdminLoading />}>
      <ParentAdminProvider>
        <ParentAdminLayoutClient>{children}</ParentAdminLayoutClient>
      </ParentAdminProvider>
    </Suspense>
  );
}
