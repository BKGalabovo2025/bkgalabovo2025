import { Metadata } from "next";

import { PartnersClient } from "../PartnersClient";

export const metadata: Metadata = {
  title: "Спонсори & Фирми | БК Гълъбово",
  description: "Спортни, търговски и медийни партньори и спонсори на клуба.",
};

export default function Page() {
  return <PartnersClient section="sponsors" />;
}
