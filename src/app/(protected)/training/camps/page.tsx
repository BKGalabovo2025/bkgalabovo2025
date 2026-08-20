import { Metadata } from "next";

import CampsClient from "./CampsClient";

export const metadata: Metadata = {
  title: "Лагери | Тренировъчен процес",
  description: "Управление и преглед на всички планирани лагери",
};

export default function CampsPage() {
  return (
    <div className="flex size-full flex-col">
      <CampsClient />
    </div>
  );
}
