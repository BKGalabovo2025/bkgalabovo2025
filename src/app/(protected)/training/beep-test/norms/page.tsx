import { Metadata } from "next";

import { BeepTestNormsView } from "@/components/training/beep-test/BeepTestNormsView";

export const metadata: Metadata = {
  title: "Нормативи и скала | Бийп Тест",
  description: "Официални нормативи на BWF и калкулатор за VO2 Max.",
};

export default function BeepTestNormsPage() {
  return <BeepTestNormsView />;
}
