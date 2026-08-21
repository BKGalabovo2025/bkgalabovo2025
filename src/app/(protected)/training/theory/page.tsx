import { Metadata } from "next";

import TheoryClient from "./theory-client";

export const metadata: Metadata = {
  title: "Теория и Викторини | Бадминтон Клуб",
  description: "Детска бадминтон викторина — конструктор на тестове и система за рецензия",
};

export default function TheoryPage() {
  return <TheoryClient />;
}