import { Metadata } from "next";

import { NewBusinessTripClient } from "./NewBusinessTripClient";

export const metadata: Metadata = {
  title: "Създаване / Управление на командировка | Счетоводство",
  description:
    "Създаване и управление на командировки, решения на УС и заповеди по спортни събития.",
};

export default function NewBusinessTripPage() {
  return <NewBusinessTripClient />;
}
