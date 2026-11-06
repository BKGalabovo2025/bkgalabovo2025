import { Metadata } from "next";

import { PartnersClient } from "./PartnersClient";

export const metadata: Metadata = {
  title: "Партньори & Спонсори | БК Гълъбово",
  description:
    "Всички клубни партньори и спонсори, лога и видимост в документи и ваучери.",
};

export default function Page() {
  return <PartnersClient section="all" />;
}
