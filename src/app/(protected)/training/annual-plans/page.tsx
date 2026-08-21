import { Metadata } from "next";

import AnnualPlansClient from "./annual-plans-client";

export const metadata: Metadata = {
  title: "Едногодишни Планове | Тренировъчен процес",
  description: "BWF Едногодишни Тренировъчни Програми и Периодизация.",
};

export default function AnnualPlansPage() {
  return <AnnualPlansClient />;
}
