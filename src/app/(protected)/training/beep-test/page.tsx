import { Metadata } from "next";
import BeepTestClient from "./beep-test-client";

export const metadata: Metadata = {
  title: "Бийп Тест | Физически тестове",
  description:
    "Модул за измерване на аеробния капацитет (VO2 Max) на състезателите.",
};

export default function BeepTestPage() {
  return <BeepTestClient />;
}
