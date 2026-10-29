import { Metadata } from "next";

import ParentAdminClient from "./ParentAdminClient";

export const metadata: Metadata = {
  title: "Родителски достъп | БК Гълъбово",
  description:
    "Управление на родителски профили, заявки за достъп, отсъствия и корекции на данни.",
};

export default function ParentsAdminPage() {
  // Turbopack route reload
  return <ParentAdminClient />;
}
