import { Metadata } from "next";

import { PartnersClient } from "../PartnersClient";

export const metadata: Metadata = {
  title: "Институционални партньори | БК Гълъбово",
  description: "Институции, общини, училища и федерации – партньори на клуба.",
};

export default function Page() {
  return <PartnersClient section="institutional" />;
}
